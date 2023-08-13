use cosmwasm_std::{StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Disabled")]
    Disabled {},

    #[error("InvalidCw721Token")]
    InvalidCw721Token {},

    #[error("InvalidCw20Token")]
    InvalidCw20Token {},

    #[error("Unstake Fee Failed")]
    UnstakeFeeFailed {},

    #[error("Invalid CW721 Receive Message")]
    InvalidCw721Msg {},

    #[error("Invalid CW20 Receive Message")]
    InvalidCw20Msg {},

    #[error("No Staked Nfts")]
    NoStakedNft {},

    #[error("No Unexpired Nfts")]
    NoUnexpiredNft {},

    #[error("NoReward")]
    NoReward {},

    #[error("Insufficient Cw20")]
    InsufficientCw20 {},

    #[error("OverNftCount")]
    OverNftCount {
        nft_count: Uint128
    },

    #[error("Invalid airdrop")]
    InvalidAirdrop {},
    
    #[error("Locktime. Send Unstake Fee")]
    Locktime {},

    #[error("No Airdrop Nfts")]
    NoAirdropNft {},
}
