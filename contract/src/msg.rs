use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Uint128, Addr};
use cw721::Cw721ReceiveMsg;

#[cw_serde]
pub struct InstantiateMsg {
    pub owner: Addr,
    pub fee_address: Addr,
    pub collection_address: Addr,
    pub native_token: String,
    pub duration: u64
}

#[cw_serde]
pub enum ExecuteMsg {
    UpdateOwner {
        owner: Addr,
    },
    UpdateFeeAddress {
        fee_address: Addr,
    },
    UpdateEnabled {
        enabled: bool
    },
    UpdateConfig {
        new_owner: Addr,
        new_fee_address: Addr,
        new_collection_address: Addr,
        new_duration: u64,
        new_locktime_fee: Uint128,
    },
    Withdraw {
        amount: Uint128
    },
    Airdrop { airdrop_amount: Uint128 },
    AirdropRestart { },
    ReceiveNft (Cw721ReceiveMsg),
    Restake { restake_nft_id: String },
    Unstake { unstake_nft_id: String },
    Claim { claim_nft_id: String },
    UpdateDuration { duration: u64 },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResponse)]
    GetConfig {
    },

    #[returns(TotalEarnedResponse)]
    GetTotalEarned {
        address: Addr
    },

    #[returns(TotalLockedResponse)]
    GetTotalLocked {
    },

    #[returns(StakedNftsResponse)]
    StakedNfts {
        address: Addr
    },
    
}

#[cw_serde]
pub struct ConfigResponse {
    pub owner: Addr,
    pub collection_address: Addr,
    pub fee_address: Addr,
    pub duration: u64,
    pub enabled: bool,
    pub last_airdrop_time: u64,
    pub current_time: u64,
    pub total_staked: u64,
    pub total_airdrop: Uint128,
    pub locktime_fee: Uint128
}

#[cw_serde]
pub struct TotalEarnedResponse {
    pub total_earned: Uint128,
}

#[cw_serde]
pub struct TotalLockedResponse {
    pub count: Uint128,
}

#[cw_serde]
pub struct StakedNftResponse {
    pub account_address: Addr,
    pub nft_id: String,
    pub airdrop: Uint128,
    pub lock_time: u64
}

#[cw_serde]
pub struct StakedNftsResponse {
    pub nft_maps: Vec<StakedNftResponse>,
}

#[cw_serde]
pub enum NftReceiveMsg {
    Stake {
        sender: String,
        token_id: String
    }
}