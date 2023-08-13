import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import DEFAULT_IMG from "../assets/images/empty-nft.png"
import { getDays, getHours, getMinutes, getSeconds } from "../utils/utils"
import Injective from "../assets/icons/Injective"
import { useResponsiveView } from "../hooks/useResponsiveView"
import { useAppStore } from "../store/app"
import { useShuttle } from "@delphi-labs/shuttle-react";
import useWallet from "../hooks/useWallet";
import { getRestakeMsg, getUnstakeMsg, getClaimMsg, getFeeEstimate } from "../utils/messages"
import { useAccountStore } from "../store/account"

export default function NFTDetailRow({
  data,
}: {
  data: any,
}) {

  const responseive_md = useResponsiveView(1024)
  const app = useAppStore((state) => state)
  const account = useAccountStore((state) => state)
  const { broadcast } = useShuttle()
  const wallet = useWallet()
  const { simulate } = useShuttle();


  const getStakedTime = () => {
    const stakedTime = app.currentTime + app.duration - data.lock_time

    if (getDays(stakedTime) > 0) return `${getDays(stakedTime)} days`
    if (getHours(stakedTime) > 0) return `${getHours(stakedTime)} hours`
    if (getMinutes(stakedTime) > 0) return `${getMinutes(stakedTime)} mins`
    if (getSeconds(stakedTime) > 0) return `${getSeconds(stakedTime)} seconds`
  }

  const getUnlockTime = () => {
    const current = app.currentTime
    const unlockTime = data.lock_time - current

    if (getDays(unlockTime) > 0) return `${getDays(unlockTime)} days left`
    if (getHours(unlockTime) > 0) return `${getHours(unlockTime)} hours left`
    if (getMinutes(unlockTime) > 0) return `${getMinutes(unlockTime)} mins left`
    if (getSeconds(unlockTime) > 0) return `${getSeconds(unlockTime)} seconds left`
  }

  const handleRestake = async () => {
    if (!app.enabled) {
      toast.warn("Staking contract is disabled.")
      return
    }
    if (!app.airdropStarted) {
      toast.warn("Airdrop not started.")
      return
    }
    if (data.lock_time > app.currentTime) return
    const msg = getRestakeMsg(wallet, data.token_id)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    broadcast({
      wallet,
      messages: msg,
      feeAmount: feeEstimate?.fee?.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then(() => {
        toast.success("Restake Successed")
      })
      .catch((error: any) => {
        toast.success("Restake Failed")
        console.log("Broadcast error", error)
      })
  }

  const handleUnstake = async () => {
    if (!app.enabled) {
      toast.warn("Staking contract is disabled.")
      return
    }
    if (data.lock_time > app.currentTime)
      toast.info(`You have to pay fee(${app.locktimeFee}INJ) to unstake nft in lock time.`)
    const msg = getUnstakeMsg(wallet, account.stakedNfts, [data.token_id], app.currentTime, app.locktimeFee)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    broadcast({
      wallet,
      messages: msg,
      feeAmount: feeEstimate?.fee?.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then(() => {
        account.addNft(data.token_id)
        account.unstakeNft(data.token_id)
        toast.success("Unstake Successed")
      })
      .catch((error: any) => {
        toast.error("Unstake Failed")
        console.log("Broadcast error", error)
      })
      .finally(() => {
        account.fetchBalance()
      })
  }

  const handleClaim = async () => {
    if (!app.enabled) {
      toast.warn("Staking contract is disabled.")
      return
    }
    const msg = getClaimMsg(wallet, [data.token_id])
    console.log(msg, data)
    const feeEstimate: any = await getFeeEstimate(simulate, wallet, msg)
    if (data.airdrop > 0) {
      broadcast({
        wallet,
        messages: msg,
        feeAmount: feeEstimate?.fee?.amount,
        gasLimit: feeEstimate?.gasLimit,
      })
        .then(() => {
          toast.success("Claim Successed")
          account.setAirdrop(data.token_id, 0)
        })
        .catch((error: any) => {
          toast.error("Claim Failed")
          console.log("Broadcast error", error)
        })
        .finally(() => {
          account.fetchBalance()
          account.fetchTotalEarned()
        })
    }
  }

  const [isLoaded, setLoaded] = useState(false)
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadImage = async () => {
    const token_uri = data.token_uri
    if (!token_uri) return
    const uri: string = token_uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    const response = await fetch(uri);
    const metadata = await response.json();
    setTitle(metadata.title);
    let imageUrl = `/nfts/${data.token_id}.png`
    let image = new Image()
    image.src =imageUrl

    image.onload = () => {
      setImageUrl(imageUrl);
      setLoaded(true)
    }

    image.onerror = () => {
      imageUrl = metadata.media.replace("ipfs://", "https://ipfs.io/ipfs/");
      setImageUrl(imageUrl);
      setLoaded(true)
    }
  };

  useEffect(() => {
    if (data) {
      loadImage();
    }
  })

  return (
    <div className="nft-row flex flex-row items-center w-full">
      <div className="nft-img">
        {isLoaded ? (
          <img src={imageUrl} />
        ) : (
          <img src={DEFAULT_IMG} />
        )}
      </div>
      <div className="nft-id flex flex-col justify-center">
        <span>{title}</span>
        {responseive_md &&
          <span className={"aliens-font3 " + ((data.lock_time > app.currentTime) ? " disabled" : "")} onClick={handleRestake}>
            Restake
          </span>}
      </div>
      <div className="staked-day flex flex-col justify-center">
        <span>{getStakedTime()}</span>
        {responseive_md &&
          <span className="aliens-font3 " onClick={handleUnstake}>
            Unstake
          </span>}
      </div>
      <div className="until-day flex flex-col justify-center">
        <span>{getUnlockTime()}</span>
        {responseive_md &&
          <span className={"aliens-font3 flex flex-row items-center " + (data.airdrop == 0 ? " disabled" : "")} onClick={handleClaim}>
            Claim({data.airdrop}<Injective className="mx-1" />)
          </span>}
      </div>
      <div className="actions flex flex-row justify-center gap-10 flex-grow hidden lg:flex">
        <span className={"aliens-font3" + ((data.lock_time > app.currentTime) ? " disable disabled" : "")} onClick={handleRestake}>
          Restake
        </span>
        <span className="aliens-font3" onClick={handleUnstake}>
          Unstake
        </span>
        <span className={"aliens-font3 flex flex-row items-center justify-center" + (data.airdrop == 0 ? " disabled" : "")} onClick={handleClaim}>
          Claim({data.airdrop}<Injective className="mx-1" />)
        </span>
      </div>
    </div>
  )
}