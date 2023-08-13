import { useNavigate, Link } from "react-router-dom";
import { useEffect, useRef } from "react";

import AirdropProgress from "../components/AirdropProgress";
import TITLE_BG from "../assets/images/top-title.png"

import { changeBackgroundUrl, copyClipboard } from "../utils/utils";
import AliensBtn from "../components/AliensBtn";
import { toast } from "react-toastify";
import { useAppStore } from "../store/app";
import useWallet from "../hooks/useWallet";
import { useShuttle } from "@delphi-labs/shuttle-react";
import { useAccountStore } from "../store/account";
import { getAirdropMsg, getWithdrawMsg, getUpdateConfig, getAirdropRestartMsg, getUpdateEnabledMsg, getFeeEstimate } from "../utils/messages";

import { Stargate } from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";

export default function Admin() {
  const navigate = useNavigate()

  const ref_airdropAmount = useRef<HTMLInputElement>(null)
  const ref_chargeAirdrop = useRef<HTMLInputElement>(null)
  const ref_duration = useRef<HTMLInputElement>(null)
  const ref_feeAddr = useRef<HTMLInputElement>(null)
  const ref_locktimeFee = useRef<HTMLInputElement>(null)
  const ref_collectionAddr = useRef<HTMLInputElement>(null)
  const ref_ownerAddr = useRef<HTMLInputElement>(null)
  const ref_withdraw = useRef<HTMLInputElement>(null)

  const app = useAppStore()
  const account = useAccountStore()
  const wallet = useWallet()
  const { disconnectWallet, broadcast, simulate } = useShuttle()

  const handleDisconnect = () => {
    disconnectWallet(wallet)
    navigate("/")
  }

  useEffect(() => {
    if (!wallet || !account.isAdmin)
      navigate("/")
    app.fetchAirdropable()
    app.fetchLockNftCount()
  }, [])

  useEffect(() => {
    if (ref_duration.current !== null) ref_duration.current.value = app.duration.toString()
    if (ref_locktimeFee.current !== null) ref_locktimeFee.current.value = app.locktimeFee.toString()
    if (ref_collectionAddr.current !== null) ref_collectionAddr.current.value = app.collection
    if (ref_ownerAddr.current !== null) ref_ownerAddr.current.value = app.owner
    if (ref_feeAddr.current !== null) ref_feeAddr.current.value = app.feeAddr
  }, [app.duration, app.locktimeFee, app.collection, app.owner, app.feeAddr])

  const showUserInfo = (address: string, balance: number) => {
    let res = address.substring(0, 12) + "..." + address.substring(address.length - 6, address.length)
    res += ` (${balance}inj)`
    return res
  }

  const handleAirdrop = async () => {
    if (!app.enabled) {
      toast.warn("Staking contract is disabled.")
      return
    }
    const amount = ref_airdropAmount.current?.value
    if (amount && Number(amount)) {
      const msg = getAirdropMsg(wallet, amount)
      const feeEstimate: any = getFeeEstimate(simulate, wallet, msg)
      broadcast({
        wallet,
        messages: msg,
        feeAmount: feeEstimate?.fee?.amount,
        gasLimit: feeEstimate?.gasLimit,
      })
        .then(() => {
          toast.success("Airdrop Successed")
        })
        .catch((error: any) => {
          toast.error("Airdrop Failed")
          console.log("Broadcast error", error)
        })
        .finally(() => {
          app.fetchAirdropable()
          app.fetchStakingContract()
        })
    }
    else {
      toast.warn("Invalid input value.")
    }
  }

  const handleCharge = async () => {
    const amount = ref_chargeAirdrop.current?.value
    if (amount && Number(amount)) {
      const offlineSigner = (window as any).getOfflineSigner(import.meta.env.VITE_PUBLIC_CHAIN_ID);
      const client = await Stargate.InjectiveSigningStargateClient.connectWithSigner(
        import.meta.env.VITE_PUBLIC_CHAIN_RPC_ENDPOINT,
        offlineSigner,
      );
      const _amount = {
        denom: import.meta.env.VITE_PUBLIC_STAKING_DENOM,
        amount: new BigNumberInBase(amount).toWei().toFixed()
      };
      const fee = {
        amount: [
          {
            denom: "inj",
            amount: "5000000000000000",
          },
        ],
        gas: "200000",
      };

      client.sendTokens(
        wallet.account.address,
        import.meta.env.VITE_PUBLIC_STAKING_CONTRACT,
        [_amount],
        fee,
        ""
      )
        .then(() => {})
        .catch(() => {})
        .finally(() => {
          toast.success("Charge Airdrop Successed")
          app.fetchAirdropable()
          account.fetchBalance()
        })
    } else
      toast.warn("Invalid input value.")
  }

  const handleWithdraw = async () => {
    const amount = ref_withdraw.current?.value
    if (amount && Number(amount)) {
      const msg = getWithdrawMsg(wallet, amount)
      const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
      console.log(msg, feeEstimate)
      broadcast({
        wallet,
        messages: msg,
        feeAmount: feeEstimate?.fee?.amount,
        gasLimit: feeEstimate?.gasLimit,
      })
        .then(() => {
          toast.success("Withdraw successed")
        })
        .catch((error: any) => {
          toast.error("Withdraw failed")
          console.log("Broadcast error", error)
        })
        .finally(() => {
          app.fetchAirdropable()
          account.fetchBalance()
        })
    } else {
      toast.warn("Invalid input value.")
    }
  }

  const handleUpdateConfig = async () => {
    let updateInfo = {
      duration: ref_duration.current?.value,
      owner: ref_ownerAddr.current?.value,
      feeAddr: ref_feeAddr.current?.value,
      locktimeFee: ref_locktimeFee.current?.value,
      collectionAddr: ref_collectionAddr.current?.value
    }
    const msg = getUpdateConfig(wallet, updateInfo)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    broadcast({
      wallet,
      messages: msg,
      feeAmount: feeEstimate?.fee?.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then(() => {
        toast.success("UpdateConfig Successed")
      })
      .catch((error: any) => {
        toast.error("UpdateConfig Failed")
        console.log("Broadcast error", error)
      })
      .finally(() => {
        app.fetchStakingContract()
      })
  }

  const handleAirdropRestart = async () => {
    const msg = getAirdropRestartMsg(wallet)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    broadcast({
      wallet,
      messages: msg,
      feeAmount: feeEstimate?.fee?.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then(() => {
        toast.success("Airdrop Restart Successed")
      })
      .catch((error: any) => {
        toast.error("Airdrop Restart Failed")
        console.log("Broadcast error", error)
      })
      .finally(() => {
        app.fetchStakingContract()
      })
  }
  
  const handleUpdateEnabled = async () => {
    const msg = getUpdateEnabledMsg(wallet, !app.enabled)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    broadcast({
      wallet,
      messages: msg,
      feeAmount: feeEstimate?.fee?.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then(() => {
        toast.success("Update Enabled Successed")
      })
      .catch((error: any) => {
        toast.error("Update Enabled Failed")
        console.log("Broadcast error", error)
      })
      .finally(() => {
        app.fetchStakingContract()
      })
  }

  useEffect(() => {
    if (window.innerWidth > 768)
      changeBackgroundUrl('var(--main-bg-url)')
    else
      changeBackgroundUrl('var(--main-bg-sm-url)')
  }, [])

  return (
    <div className="admin__container container flex flex-col items-center">
      <section className="top-banner flex flex-col items-center gap-10 mt-10 w-full lg:flex-row">
        <div className="w-[300px]"></div>
        <div className="top-title flex flex-grow justify-center">
          <img src={TITLE_BG} />
        </div>
        <div className="wallet-info flex flex-row flex-wrap justify-center items-center w-[300px] lg:flex-nowrap">
          <span className="address cursor-pointer" onClick={() => copyClipboard(account.address)}>
            {showUserInfo(account.address, account.totalBalance)}
          </span>
          <div className="aliens-font3 ml-5 text-16" onClick={handleDisconnect}>Disconnect</div>
          <Link to="/main" className="aliens-font3 ml-5 text-16">Back</Link>
        </div>
      </section>

      <section className="airdrop-info flex flex-col-reverse items-center lg:items-end justify-center my-14 gap-20 lg:flex-row w-full">
        <div className="locktime-progress">
          <AirdropProgress />
        </div>
      </section>

      <section className="flex flex-wrap w-full items-center justify-center gap-20">
        <section className="admin-info flex flex-col gap-10 items-center">
          <div className="flex flex-col flex-wrap w-full items-center justify-center lg:flex-row gap-5">
            <span>Available Airdrop Amount: </span>
            <label className="font-bold">{app.airdropable}inj</label>
          </div>
          <div className="flex flex-col flex-wrap w-full items-center justify-center lg:flex-row gap-5  ">
            <span>Unlock Staked Nft Count: </span>
            <label className="font-bold">{app.lockNftCount}</label>
          </div>
          <div className="flex flex-col flex-wrap w-full gap-10 items-center lg:flex-row">
            <input className="w-full lg:w-auto" type="text" placeholder="0inj" ref={ref_airdropAmount} />
            <AliensBtn onClick={handleAirdrop}>Airdrop</AliensBtn>
            <input className="w-full lg:w-auto" type="text" placeholder="0inj" ref={ref_chargeAirdrop} />
            <AliensBtn onClick={handleCharge}>Charge Airdrop</AliensBtn>
            <input className="w-full lg:w-auto" type="text" placeholder="0inj" ref={ref_withdraw} />
            <AliensBtn onClick={handleWithdraw}>Withdraw</AliensBtn>
          </div>
          <div className="flex flex-row w-full justify-center mt-10 gap-10">
            <AliensBtn onClick={handleAirdropRestart}>
              {app.airdropStarted && 'Airdrop Restart'}
              {!app.airdropStarted && 'Airdrop Start'}
            </AliensBtn>
            <AliensBtn onClick={handleUpdateEnabled}>
              {app.enabled && 'Airdrop Disable'}
              {!app.enabled && 'Airdrop Enable'}
            </AliensBtn>
          </div>
        </section>

        <section className="config-info flex flex-col gap-5 mt-20">
          <div className="flex flex-row w-full gap-3">
            <span className="name">Duration:</span>
            <input className="w-full" placeholder="0s" ref={ref_duration} />
          </div>
          <div className="flex flex-row w-full gap-3">
            <span className="name">Owner:</span>
            <input className="w-full" ref={ref_ownerAddr} />
          </div>
          <div className="flex flex-row w-full gap-3">
            <span className="name">Fee address:</span>
            <input className="w-full" ref={ref_feeAddr} />
          </div>
          <div className="flex flex-row w-full gap-3">
            <span className="name">Unstake Fee:</span>
            <input className="w-full" placeholder="0inj" ref={ref_locktimeFee} />
          </div>
          <div className="flex flex-row w-full gap-3">
            <span className="name">Collection Address:</span>
            <input className="w-full" ref={ref_collectionAddr} />
          </div>
          <div className="flex flex-row w-full justify-center">
            <AliensBtn onClick={handleUpdateConfig}>Update Config</AliensBtn>
          </div>
        </section>
      </section>
    </div>
  );
}