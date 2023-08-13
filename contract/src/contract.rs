#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_binary, from_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128, CosmosMsg, WasmMsg, Order, BlockInfo};

use cw2::set_contract_version;
use cw20::Denom;
use cw721::{Cw721ReceiveMsg, Cw721ExecuteMsg};
use cw_utils::must_pay;

use crate::util;
use crate::error::ContractError;
use crate::msg::{
    ExecuteMsg, 
    InstantiateMsg, 
    QueryMsg, 
    StakedNftResponse, 
    StakedNftsResponse,
    ConfigResponse,
    NftReceiveMsg, 
    TotalEarnedResponse,
    TotalLockedResponse
};
use crate::state::{
    Config, 
    CONFIG,
    LAST_AIRDROP,
    TOTAL_AIRDROP,
    TOTAL_STAKED,
    LOCKTIME_FEE,
    ACCOUNT_MAP,
    NftInfo, 
    UserInfo
};

const CONTRACT_NAME: &str = "crates.io:staking";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let config = Config {
        owner: info.sender.clone(),
        fee_address: msg.fee_address.clone(),
        collection_address: msg.collection_address.clone(),
        native_token: msg.native_token.clone(),
        duration: msg.duration.clone(),
        enabled: true,
    };

    CONFIG.save(deps.storage, &config)?;
    LAST_AIRDROP.save(deps.storage, &env.block.clone())?;
    LOCKTIME_FEE.save(deps.storage, &Uint128::from(1000000000000000000u128))?;
    TOTAL_AIRDROP.save(deps.storage, &Uint128::zero())?;
    TOTAL_STAKED.save(deps.storage, &0u64)?;
    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::UpdateOwner { 
            owner 
        } => util::execute_update_owner(
            deps.storage, 
            info.sender, 
            owner
        ),
        ExecuteMsg::UpdateFeeAddress { 
            fee_address
        } => util::execute_update_fee_address(
            deps.storage, 
            info.sender, 
            fee_address
        ),
        ExecuteMsg::UpdateEnabled { 
            enabled 
        } => util::execute_update_enabled(
            deps.storage, 
            info.sender, 
            enabled
        ),
        ExecuteMsg::UpdateDuration {
            duration
        } => util::execute_update_duration(
            deps.storage, 
            info.sender, 
            duration
        ),
        ExecuteMsg::UpdateConfig {
            new_owner,
            new_fee_address,
            new_collection_address,
            new_duration,
            new_locktime_fee,
        } => util::execute_update_config(
            deps.storage,
            info.sender,
            new_owner,
            new_fee_address,
            new_collection_address,
            new_duration,
            new_locktime_fee
        ),
        ExecuteMsg::Withdraw {
            amount,
        } => execute_withdraw(
            deps, 
            env, 
            info, 
            amount,
        ),
        ExecuteMsg::Airdrop {
            airdrop_amount,
        } => execute_airdrop(
            deps, 
            env, 
            info, 
            airdrop_amount,
        ),
        ExecuteMsg::AirdropRestart {
        } => execute_airdrop_restart(
            deps, 
            env, 
            info, 
        ),
        ExecuteMsg::ReceiveNft (
            msg
        ) => execute_receive_nft(
            deps, 
            env, 
            info, 
            msg
        ),
        ExecuteMsg::Unstake {
            unstake_nft_id
        } => execute_unstake(
            deps, 
            env, 
            info, 
            unstake_nft_id
        ),
        ExecuteMsg::Claim {
            claim_nft_id
        } => execute_claim(
            deps, 
            env, 
            info, 
            claim_nft_id
        ),
        ExecuteMsg::Restake {
            restake_nft_id
        } => execute_restake(
            deps, 
            env, 
            info, 
            restake_nft_id
        ),
    }
}

pub fn execute_withdraw (
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128
) -> Result<Response, ContractError> { 
    util::check_owner(deps.storage, info.sender.clone())?;

    let cfg = CONFIG.load(deps.storage)?;

    if util::get_token_amount(deps.querier, Denom::Native(cfg.native_token.clone()), env.clone().contract.address.clone())? < amount {
        return Err(crate::ContractError::InsufficientCw20 {  });
    }

    let msg = util::transfer_token_message(Denom::Native(cfg.native_token.clone()), amount.clone(), info.sender.clone())?;

    Ok(Response::new()
        .add_message(msg)
        .add_attribute("action", "execute_withdraw")
        .add_attribute("withdraw", amount.clone())
    )
}

pub fn execute_airdrop(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    airdrop_amount: Uint128
) -> Result<Response, ContractError> { 
    util::check_enabled(deps.storage)?;
    util::check_owner(deps.storage, info.sender.clone())?;

    if airdrop_amount <= Uint128::zero() {
        return Err(crate::ContractError::InvalidAirdrop {  });
    }

    let cfg = CONFIG.load(deps.storage)?;

    if util::get_token_amount(deps.querier, Denom::Native(cfg.native_token.clone()), env.clone().contract.address.clone())? < airdrop_amount {
        return Err(crate::ContractError::InsufficientCw20 {  });
    }

    let nft_count = util::get_in_locktime_nft_count(deps.storage, env.block.clone())?;

    if nft_count.is_zero() {
        return Err(crate::ContractError::NoUnexpiredNft {  });
    }

    if airdrop_amount < nft_count {
        return Err(crate::ContractError::OverNftCount { 
            nft_count 
        });
    }

    let airdrop = Uint128::from(airdrop_amount/nft_count);

    let result: StdResult<Vec<(Addr, UserInfo)>> = ACCOUNT_MAP.range(deps.storage, None, None, Order::Ascending).collect();
    
    match result {
        Ok(all_accounts) => {
            for (_address, _userinfo) in all_accounts.iter() {
                let mut userinfo = _userinfo.clone();
                for (index, _nftinfo) in userinfo.staked_nfts.clone().iter().enumerate() {
                    let mut nftinfo = _nftinfo.clone();
                    if nftinfo.lock_time > env.block.time.seconds() {
                        nftinfo.airdrop += airdrop;
                    }
                    userinfo.staked_nfts[index] = nftinfo;
                };
                ACCOUNT_MAP.save(deps.storage, _address.clone(), &userinfo)?;
            }

            util::update_airdrop_info(deps.storage, env.clone(), info.sender.clone(), airdrop_amount)?;
        },
        Err(_error) => {
            return Err(crate::ContractError::NoAirdropNft {  });
        }
    }

    Ok(Response::new()
        .add_attribute("action", "execute_airdrop")
        .add_attribute("airdrop", airdrop.clone())
    )
}

pub fn execute_airdrop_restart(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> { 
    util::check_owner(deps.storage, info.sender.clone())?;

    LAST_AIRDROP.update(deps.storage, | _exists| -> StdResult<_> {
        Ok(env.block.clone())
    })?;

    Ok(Response::new()
        .add_attribute("action", "execute_airdrop_restart")
    )
}

pub fn execute_receive_nft(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    wrapper: Cw721ReceiveMsg
) -> Result<Response, ContractError> {
    util::check_enabled(deps.storage)?;

    let cfg = CONFIG.load(deps.storage)?;

    if info.sender.clone() != cfg.collection_address.clone() {
        return Err(crate::ContractError::InvalidCw721Token {  });
    }

    let stake_nft_id = wrapper.token_id.clone();
    let user_addr = deps.api.addr_validate(wrapper.sender.as_str())?;

    let msg: NftReceiveMsg = from_binary(&wrapper.msg)?;

    match msg {
        NftReceiveMsg::Stake {
            sender,
            token_id
        } => {
            if (sender != user_addr) || (token_id != stake_nft_id) {
                return Err(ContractError::InvalidCw721Msg {  });
            }

            let duration = cfg.duration;
            let _nftinfo = NftInfo {
                nft_id: stake_nft_id.clone(),
                lock_time: duration+env.block.time.seconds(),
                airdrop: Uint128::zero(),
            };
            
            let mut _userinfo = UserInfo {
                address: info.sender.clone(),
                staked_nfts: vec![_nftinfo.clone()],
                total_earnd: Uint128::zero()
            };

            if ACCOUNT_MAP.has(deps.storage, user_addr.clone()) {
                _userinfo = ACCOUNT_MAP.load(deps.storage, user_addr.clone())?;
                _userinfo.staked_nfts.push(_nftinfo.clone());
            }

            ACCOUNT_MAP.save(deps.storage, user_addr.clone(), &_userinfo)?;
            TOTAL_STAKED.update(deps.storage, | exists| -> StdResult<_> {
                Ok(exists+1)
            })?;

            Ok(Response::new()
                .add_attribute("action", "execute_stake")
                .add_attribute("nft_id", stake_nft_id.clone())
            )
        }
    }
}

pub fn execute_restake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    restake_nft_id: String
) -> Result<Response, ContractError> {
    util::check_enabled(deps.storage)?;

    let cfg = CONFIG.load(deps.storage)?;
    let mut userinfo = ACCOUNT_MAP.load(deps.storage, info.sender.clone())?;

    if userinfo.staked_nfts.is_empty() {
        return Err(ContractError::NoStakedNft {  });
    }
    
    let index = userinfo.staked_nfts.iter().position(|nft| nft.nft_id == restake_nft_id);

    match index {
        Some(index) => {
            let mut nftinfo = userinfo.staked_nfts[index].clone();
            if nftinfo.lock_time > env.block.time.seconds() {
                return Err(ContractError::Locktime {  });
            }

            nftinfo.lock_time = env.block.time.seconds()+cfg.duration;
            userinfo.staked_nfts[index] = nftinfo;
            ACCOUNT_MAP.save(deps.storage, info.sender.clone(), &userinfo)?;

            Ok(Response::new()
                .add_attribute("action", "restake")
            )
        },
        None => {
            return Err(ContractError::NoStakedNft {  });
        }
    }
}

pub fn execute_unstake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    unstake_nft_id: String
) -> Result<Response, ContractError> {
    util::check_enabled(deps.storage)?;

    let cfg = CONFIG.load(deps.storage)?;
    let locktime_fee = LOCKTIME_FEE.load(deps.storage)?;
    let mut userinfo = ACCOUNT_MAP.load(deps.storage, info.sender.clone())?;

    if userinfo.staked_nfts.is_empty() {
        return Err(ContractError::NoStakedNft {  });
    }
    
    let index = userinfo.staked_nfts.iter().position(|nft| nft.nft_id == unstake_nft_id);

    match index {
        Some(index) => {
            let nftinfo = userinfo.staked_nfts[index].clone();
            let mut msgs:Vec<CosmosMsg> = vec![];

            if nftinfo.lock_time > env.block.time.seconds() {
                let receive_fee = match must_pay(&info, &cfg.native_token.clone()) {
                    Ok(it) => it,
                    Err(_err) => return Err(ContractError::Locktime {  }),
                }.u128();

                if receive_fee >= u128::from(locktime_fee) {
                    let fee_msg = util::transfer_token_message(Denom::Native(cfg.native_token.clone()), locktime_fee.clone(), cfg.fee_address.clone())?;
                    msgs.push(fee_msg)
                } else {
                    return Err(ContractError::Locktime {  });
                }
            }
            
            msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: cfg.collection_address.clone().to_string(),
                msg: to_binary(&Cw721ExecuteMsg::TransferNft {
                    token_id: unstake_nft_id,
                    recipient: info.sender.clone().into()
                })?,
                funds: vec![],
            }));

            userinfo.staked_nfts.remove(index);
            ACCOUNT_MAP.save(deps.storage, info.sender.clone(), &userinfo)?;

            Ok(Response::new()
                .add_messages(msgs)
                .add_attribute("action", "unstake")
            )
        },
        None => {
            return Err(ContractError::NoStakedNft {  });
        }
    }
}

pub fn execute_claim(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    claim_nft_id: String
) -> Result<Response, ContractError> {
    util::check_enabled(deps.storage)?;

    let cfg = CONFIG.load(deps.storage)?;
    let mut userinfo = ACCOUNT_MAP.load(deps.storage, info.sender.clone())?;

    if userinfo.staked_nfts.is_empty() {
        return Err(ContractError::NoStakedNft {  });
    }

    let index = userinfo.staked_nfts.iter().position(|nft| nft.nft_id == claim_nft_id);

    match index {
        Some(index) => {
            let mut nftinfo = userinfo.staked_nfts[index].clone();
            if nftinfo.airdrop == Uint128::zero() {
                return Err(ContractError::NoReward {  });
            }
    
            if util::get_token_amount(deps.querier, Denom::Native(cfg.native_token.clone()), env.clone().contract.address.clone())? < nftinfo.airdrop {
                return Err(crate::ContractError::InsufficientCw20 {  });
            }
    
            let reward_msg = util::transfer_token_message(Denom::Native(cfg.native_token.clone()), nftinfo.airdrop, info.sender.clone())?;
    
            let amount = nftinfo.airdrop;
            nftinfo.airdrop = Uint128::zero();
            userinfo.total_earnd += amount;
            userinfo.staked_nfts[index] = nftinfo;
    
            ACCOUNT_MAP.save(deps.storage, info.sender.clone(), &userinfo)?;
                
            return Ok(Response::new()
                .add_message(reward_msg)
                .add_attribute("action", "claim")
                .add_attribute("address", info.sender.clone().to_string())
                .add_attribute("claimed_amount", amount)
            );
        },
        None => {
            return Err(ContractError::NoStakedNft {  });
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_binary(&query_config(deps, env)?),
        QueryMsg::GetTotalEarned { address } => to_binary(&query_total_earned(deps, address)?),
        QueryMsg::GetTotalLocked {} => to_binary(&query_total_locked(deps, env)?),
        QueryMsg::StakedNfts { address } => to_binary(&query_staked_nfts(deps, address)?)
    }
}

pub fn query_config(deps: Deps, env: Env) -> StdResult<ConfigResponse> {
    let config: Config = CONFIG.load(deps.storage)?;
    let last_airdrop: BlockInfo = LAST_AIRDROP.load(deps.storage)?;
    let total_airdrop: Uint128 = TOTAL_AIRDROP.load(deps.storage)?;
    let total_staked: u64 = TOTAL_STAKED.load(deps.storage)?;
    let locktime_fee: Uint128 = LOCKTIME_FEE.load(deps.storage)?;
    Ok(ConfigResponse {
        owner: config.owner,
        collection_address: config.collection_address,
        fee_address: config.fee_address,
        duration: config.duration,
        enabled: config.enabled,
        current_time: env.block.time.seconds(),
        last_airdrop_time: last_airdrop.time.seconds(),
        total_airdrop: total_airdrop.clone(),
        total_staked: total_staked.clone(),
        locktime_fee: locktime_fee.clone()
    })
}

pub fn query_total_earned(deps: Deps, address: Addr) -> StdResult<TotalEarnedResponse> {
    let userinfo = ACCOUNT_MAP.load(deps.storage, address);

    match userinfo {
        Ok(userinfo) => {
            Ok(TotalEarnedResponse {
                total_earned: userinfo.total_earnd.clone()
            })
        },
        Err(_error) => {
            Ok(TotalEarnedResponse {
                total_earned: Uint128::zero()
            })
        }
    }
}

pub fn query_total_locked(deps: Deps, env: Env) -> StdResult<TotalLockedResponse> {
    let nft_count = util::get_in_locktime_nft_count(deps.storage, env.block.clone());
    match nft_count {
        Ok(nft_count) => {
            Ok(TotalLockedResponse {
                count: nft_count.clone()
            })
        },
        Err(_error) => {
            Ok(TotalLockedResponse {
                count: Uint128::zero()
            })
        }
    }
}

pub fn query_staked_nfts(
    deps: Deps, 
    address: Addr
) -> StdResult<StakedNftsResponse> {
    let userinfo: UserInfo = ACCOUNT_MAP.load(deps.storage, address.clone()).expect("Failed to load nfts");
    let mut address_maps : Vec<StakedNftResponse> = Vec::new();
    for nft in userinfo.staked_nfts {
        address_maps.push(StakedNftResponse { 
            account_address: address.clone(), 
            nft_id: nft.nft_id, 
            airdrop: nft.airdrop, 
            lock_time: nft.lock_time,
        })
    }
    let resp = StakedNftsResponse { nft_maps: address_maps };
    Ok(resp)
}