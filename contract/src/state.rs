use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128, BlockInfo};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub owner: Addr,
    pub fee_address: Addr,
    pub collection_address: Addr,
    pub native_token: String,
    pub duration: u64,
    pub enabled: bool,
}

#[cw_serde]
pub struct Collections {
    pub name: Vec<String>,
    pub address: Vec<Addr>,
    pub total_airdrop: Vec<Uint128>,
    pub total_stake: Vec<u64>,
    pub start_at: Vec<u64>,
    pub is_started: Vec<bool>
}

#[cw_serde]
pub struct  NftInfo {
    pub nft_id: String,
    pub lock_time: u64,
    pub airdrop: Uint128,
}

#[cw_serde]
pub struct UserInfo {
    pub address: Addr,
    pub total_earnd: Uint128,
    pub staked_nfts: Vec<NftInfo>,
}

pub const CONFIG_KEY: &str = "config";
pub const CONFIG: Item<Config> = Item::new(CONFIG_KEY);

pub const LAST_AIRDROP_KEY: &str = "last_airdrop";
pub const LAST_AIRDROP: Item<BlockInfo> = Item::new(LAST_AIRDROP_KEY);

pub const TOTAL_AIRDROP_KEY: &str = "total_airdrop";
pub const TOTAL_AIRDROP: Item<Uint128> = Item::new(TOTAL_AIRDROP_KEY);

pub const TOTAL_STAKED_KEY: &str = "total_staked";
pub const TOTAL_STAKED: Item<u64> = Item::new(TOTAL_STAKED_KEY);

pub const LOCKTIME_FEE_KEY: &str = "locktime_fee";
pub const LOCKTIME_FEE: Item<Uint128> = Item::new(LOCKTIME_FEE_KEY);

pub const ACCOUNT_MAP_PREFIX: &str = "account_map";
pub const ACCOUNT_MAP: Map<Addr, UserInfo> = Map::new(ACCOUNT_MAP_PREFIX);
