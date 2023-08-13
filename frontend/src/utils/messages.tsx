import { MsgExecuteContract, MsgSend, SimulateResult } from "@delphi-labs/shuttle-react";
import { BigNumberInBase } from "@injectivelabs/utils";

export function getAirdropMsg(wallet: any, amount: string) {
  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      airdrop: {
        airdrop_amount: new BigNumberInBase(amount).toWei().toFixed(),
      }
    },
  });

  return [msg]
}

export function getAirdropRestartMsg(wallet: any) {
  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      airdrop_restart: {
      }
    },
  });

  return [msg]
}

export function getUpdateEnabledMsg(wallet: any, enabled: boolean) {
  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      update_enabled: {
        enabled: enabled
      }
    },
  });

  return [msg]
}

export function getChargeMsg(wallet: any, amount: string) {
  const msg = new MsgSend({
    fromAddress: wallet.account.address,
    toAddress: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    amount: [
      {
        denom: import.meta.env.VITE_PUBLIC_STAKING_DENOM,
        amount: new BigNumberInBase(amount).toWei().toFixed()
      }
    ],
  });

  return [msg]
}
  
export function getClaimMsg(wallet: any, tokenIds: Array<string>) {
  const msgs = new Array<MsgExecuteContract>

  tokenIds.map((nft_id) => {
    const msg = new MsgExecuteContract({
      sender: wallet.account.address,
      contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
      msg: {
        claim: {
          claim_nft_id: nft_id,
        }
      },
    });

    msgs.push(msg)
  })

  return msgs
}

export function getRestakeMsg(wallet: any, tokenId: string) {
  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      restake: {
        restake_nft_id: tokenId,
      }
    },
  });

  return [msg]
}
export function getStakeMsg(wallet: any, tokenIds: Array<string>) {

  const msgs = new Array<MsgExecuteContract>

  tokenIds.map((nft_id) => {
    const send_msg = {
      stake: {
        sender: wallet.account.address,
        token_id: nft_id
      }
    };

    const msg = new MsgExecuteContract({
      sender: wallet.account.address,
      contract: import.meta.env.VITE_PUBLIC_COLLECTION_CONTRACT,
      msg: {
        send_nft: {
          contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
          token_id: nft_id,
          msg: Buffer.from(JSON.stringify(send_msg)).toString('base64'),
        }
      },
    });

    msgs.push(msg)
  })

  return msgs

}
export function getUnstakeMsg(wallet: any, stakedNfts:any, tokenIds: Array<string>, currentTime:any, locktimeFee:any) {
  const msgs = new Array<MsgExecuteContract>

  tokenIds.map((nft_id) => {
    let nftinfo: any = stakedNfts.find((nft: any) => (nft.token_id == nft_id))
    if (!nftinfo) return
    let feeAmount = '0'
    if (nftinfo.lock_time > currentTime && locktimeFee) {
      feeAmount = new BigNumberInBase(locktimeFee).toWei().toFixed()
    }
    const msg = new MsgExecuteContract({
      sender: wallet.account.address,
      contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
      msg: {
        unstake: {
          unstake_nft_id: nft_id,
        }
      },
      funds: [
        {
          denom: import.meta.env.VITE_PUBLIC_STAKING_DENOM,
          amount: feeAmount
        }
      ]
    });

    msgs.push(msg)
  })

  return msgs

}
export function getUpdateConfig(wallet: any, updateInfo: any) {

  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      update_config: {
        new_owner: updateInfo.owner,
        new_fee_address: updateInfo.feeAddr,
        new_collection_address: updateInfo.collectionAddr,
        new_duration: parseInt(updateInfo.duration),
        new_locktime_fee: new BigNumberInBase(updateInfo.locktimeFee).toWei().toFixed(),
      }
    },
  });

  return [msg]

}
export function getWithdrawMsg(wallet: any, amount: string) {

  const msg = new MsgExecuteContract({
    sender: wallet.account.address,
    contract: import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
    msg: {
      withdraw: {
        amount: new BigNumberInBase(amount).toWei().toFixed(),
      }
    },
  });

  return [msg]

}

export async function getFeeEstimate(simulate: any, wallet: any, messages: any) {
  if (!messages || messages.length <= 0 || !wallet) {
    return null;
  }

  const response: SimulateResult = await simulate({
    messages,
    wallet,
  });

  return {
    fee: response.fee?.amount[0],
    gasLimit: response.fee?.gas,
  };
}