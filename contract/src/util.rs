use std::convert::{From, TryFrom};
use cosmwasm_std::{
    to_binary,  Response, StdResult, Uint128, Coin, BankMsg,
    WasmMsg, WasmQuery, QueryRequest, Addr, Storage, CosmosMsg,  QuerierWrapper, BalanceResponse as NativeBalanceResponse, BankQuery, Order, BlockInfo, Env
};
use cw20::{Cw20ExecuteMsg, Denom, BalanceResponse as CW20BalanceResponse, Cw20QueryMsg};
use crate::error::ContractError;
use crate::state::{
    CONFIG,
    ACCOUNT_MAP, 
    UserInfo, 
    TOTAL_AIRDROP, 
    LAST_AIRDROP, 
    LOCKTIME_FEE
};

pub fn check_enabled(
    storage: &mut dyn Storage,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(storage)?;
    if !cfg.enabled {
        return Err(ContractError::Disabled {})
    }
    Ok(Response::new().add_attribute("action", "check_enabled"))
}

pub fn check_owner(
    storage: &mut dyn Storage,
    address: Addr
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(storage)?;
    
    if address != cfg.owner {
        return Err(ContractError::Unauthorized {  })
    }
    Ok(Response::new()
        .add_attribute("action", "check_owner")
    )
}

pub fn execute_update_owner(
    storage: &mut dyn Storage,
    address: Addr,
    owner: Addr,
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    CONFIG.update(storage, |mut exists| -> StdResult<_> {
        exists.owner = owner.clone();
        Ok(exists)
    })?;

    Ok(Response::new()
        .add_attribute("action", "update_config")
        .add_attribute("owner", owner.clone())
    )
}

pub fn execute_update_fee_address(
    storage: &mut dyn Storage,
    address: Addr,
    fee_address: Addr,
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    CONFIG.update(storage, |mut exists| -> StdResult<_> {
        exists.fee_address = fee_address.clone();
        Ok(exists)
    })?;

    Ok(Response::new()
        .add_attribute("action", "update_config")
        .add_attribute("fee_address", fee_address.clone())
    )
}

pub fn execute_update_enabled (
    storage: &mut dyn Storage,
    address: Addr,
    enabled: bool
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    CONFIG.update(storage, |mut exists| -> StdResult<_> {
        exists.enabled = enabled;
        Ok(exists)
    })?;

    Ok(Response::new()
        .add_attribute("action", "update_enabled")
    )
}

pub fn update_airdrop_info (
    storage: &mut dyn Storage,
    env: Env,
    address: Addr,
    amount_airdrop: Uint128
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    TOTAL_AIRDROP.update(storage, |mut exists| -> StdResult<_> {
        exists += amount_airdrop;
        Ok(exists)
    })?;

    LAST_AIRDROP.update(storage, | _exists| -> StdResult<_> {
        Ok(env.block.clone())
    })?;
    
    Ok(Response::new().add_attribute("action", "update_total_airdrop"))
}

pub fn execute_update_config(
    storage: &mut dyn Storage,
    address: Addr,
    new_owner: Addr,
    new_fee_address: Addr,
    new_collection_address: Addr,
    new_duration: u64,
    new_locktime_fee: Uint128
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    CONFIG.update(storage, |mut exists| -> StdResult<_> {
        exists.owner = new_owner;
        exists.fee_address = new_fee_address;
        exists.collection_address = new_collection_address;
        exists.duration = new_duration;
        Ok(exists)
    })?;

    LOCKTIME_FEE.update(storage, |_| -> StdResult<_> {
        Ok(new_locktime_fee)
    })?;
    
    Ok(Response::new().add_attribute("action", "update_config"))
}

pub fn execute_update_duration(
    storage: &mut dyn Storage,
    address: Addr,
    duration: u64
) -> Result<Response, ContractError> {
    check_owner(storage, address)?;
    
    CONFIG.update(storage, |mut exists| -> StdResult<_> {
        exists.duration = duration;
        Ok(exists)
    })?;

    Ok(Response::new().add_attribute("action", "update_config"))
}

pub fn transfer_token_message(
    denom: Denom,
    amount: Uint128,
    receiver: Addr
) -> Result<CosmosMsg, ContractError> {

    match denom.clone() {
        Denom::Native(native_str) => {
            return Ok(BankMsg::Send {
                to_address: receiver.clone().into(),
                amount: vec![Coin{
                    denom: native_str,
                    amount
                }]
            }.into());
        },
        Denom::Cw20(native_token) => {
            return Ok(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: native_token.clone().into(),
                funds: vec![],
                msg: to_binary(&Cw20ExecuteMsg::Transfer {
                    recipient: receiver.clone().into(),
                    amount
                })?,
            }));
        }
    }
}

pub fn get_token_amount(
    querier: QuerierWrapper,
    denom: Denom,
    contract_addr: Addr
) -> Result<Uint128, ContractError> {

    match denom.clone() {
        Denom::Native(native_str) => {
            let native_response: NativeBalanceResponse = querier.query(&QueryRequest::Bank(BankQuery::Balance {
                address: contract_addr.clone().into(),
                denom: native_str
            }))?;
            return Ok(native_response.amount.amount);
        },
        Denom::Cw20(native_token) => {
            let balance_response: CW20BalanceResponse = querier.query(&QueryRequest::Wasm(WasmQuery::Smart {
                contract_addr: native_token.clone().into(),
                msg: to_binary(&Cw20QueryMsg::Balance {address: contract_addr.clone().into()})?,
            }))?;
            return Ok(balance_response.balance);
        }
    }
}

pub fn get_in_locktime_nft_count(
    storage: &dyn Storage,
    block: BlockInfo
) -> Result<Uint128, ContractError> {
    let mut count = 0;
    let result: StdResult<Vec<(Addr, UserInfo)>> = ACCOUNT_MAP.range(storage, None, None, Order::Ascending).collect();
    
    match result {
        Ok(all_accounts) => {
            for (_address, userinfo) in all_accounts.iter() {
                count += userinfo.staked_nfts
                    .iter()
                    .filter(|nftinfo| 
                        (nftinfo.lock_time > block.time.seconds())
                    ).count();
            }
    
            return Ok(Uint128::from(u128::try_from(count).unwrap()));
        },
        Err(_error) => {
            return Err(crate::ContractError::NoStakedNft {  });
        }
    }
}

pub fn set_airdrop(
    storage: &mut dyn Storage,
    address: Addr,
    nft_id: String,
    airdrop: Uint128,
) -> Result<Response, ContractError> {
    let mut userinfo = ACCOUNT_MAP.load(storage, address.clone())?;
    let index = userinfo.staked_nfts.iter().position(|nft| nft.nft_id == nft_id);
    match index {
        Some(index) => {
            let mut nftinfo = userinfo.staked_nfts[index].clone();
            nftinfo.airdrop += airdrop;
            userinfo.staked_nfts[index] = nftinfo;
            ACCOUNT_MAP.save(storage, address.clone(), &userinfo)?;
            return Ok(Response::default());
        },
        None => {
            return Err(crate::ContractError::NoStakedNft {  });
        }
    };
}
