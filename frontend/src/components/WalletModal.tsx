import { toast } from "react-toastify"
import { useRef } from "react"
import { Link } from "react-router-dom"
import { isCosmosWalletInstalled, Wallet } from "@injectivelabs/wallet-ts"
import { useState } from "react";
import MetaMask from "../assets/icons/Metamask"
import Keplr from "../assets/icons/Keplr"
import QrIcon from '../assets/icons/Qr'
import QRCode from "react-qr-code";
import { useWalletStore } from "../store/wallet"
import LOADING from "../assets/images/loading.gif"
import { useShuttle, isAndroid, isIOS, isMobile, WalletExtensionProvider, WalletMobileProvider } from "@delphi-labs/shuttle-react"

export default function WalletModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: Function
}) {
  const [isMetamaskInstalled] = useWalletStore((state) => [
    state.isMetamaskInstalled
  ]);
  const { connect, mobileConnect, extensionProviders, mobileProviders } = useShuttle();

  const downloadMetamaskLink = useRef<HTMLAnchorElement>(null)
  const downloadKeplrLink = useRef<HTMLAnchorElement>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [mobile_mode, setMobile] = useState(false);

  const handleExtension = (extensionProvdier: WalletExtensionProvider | undefined) => {
    setMobile(false)
    if (extensionProvdier) {
      connect({
        extensionProviderId: extensionProvdier.id,
        chainId: import.meta.env.VITE_PUBLIC_CHAIN_ID,
      })
        .then(() => {
          toast.success(`${extensionProvdier.name} wallet connected`)
        })
        .catch((error: any) => {
          console.log(error)
          toast.error('Connect Failed')
        })
    }
  }
  const handleKeplr = () => {
    const isWalletInstalled = isCosmosWalletInstalled(Wallet.Keplr)
    if (isWalletInstalled) {
      const extensionProvdier: WalletExtensionProvider | undefined = extensionProviders.find((extensionProvider: WalletExtensionProvider) => {
        return extensionProvider.id == "keplr"
      })
      handleExtension(extensionProvdier)
    } else if (downloadKeplrLink && downloadKeplrLink.current) {
      downloadKeplrLink.current.click()
    }
  }

  const handleMetamask = async () => {
    const metamaskInstalled = await isMetamaskInstalled()
    if (metamaskInstalled) {
      const extensionProvdier: WalletExtensionProvider | undefined = extensionProviders.find((extensionProvider: WalletExtensionProvider) => {
        return extensionProvider.id == "metamask"
      })
      handleExtension(extensionProvdier)
    } else if (downloadMetamaskLink && downloadMetamaskLink.current) {
      downloadMetamaskLink.current.click()
    }
  }

  const handleMobile = async (mobileProvider: WalletMobileProvider | undefined) => {
    setMobile(true)
    if (mobileProvider) {
      const urls = await mobileConnect({
        mobileProviderId: mobileProvider.id,
        chainId: import.meta.env.VITE_PUBLIC_CHAIN_ID,
        callback: () => {
          setQrCodeUrl("");
        },
      })

      if (isMobile()) {
        if (isAndroid()) {
          window.location.href = urls.androidUrl;
        } else if (isIOS()) {
          window.location.href = urls.iosUrl;
        } else {
          window.location.href = urls.androidUrl;
        }
      } else {
        setQrCodeUrl(urls.qrCodeUrl);
      }

    }
  }
  const handleMobileMetamask = () => {
    const mobileProvider: WalletMobileProvider | undefined = mobileProviders.find((mobileProvider: WalletMobileProvider) => {
      return mobileProvider.id == "mobile-metamask"
    })
    handleMobile(mobileProvider)
  }
  const handleMobileKeplr = () => {
    const mobileProvider: WalletMobileProvider | undefined = mobileProviders.find((mobileProvider: WalletMobileProvider) => {
      return mobileProvider.id == "mobile-keplr"
    })
    handleMobile(mobileProvider)
  }

  if (isOpen == false)
    return (<></>)
  return (
    <div className="wallet-modal fixed top-0 left-0 w-full h-full items-center flex justify-center">
      <div className="backdrop backdrop-blur fixed top-0 left-0 w-full h-full" onClick={() => onClose(false)}></div>
      <div className="fixed flex flex-row gap-10 items-center">
        <div className="flex flex-col gap-10 ">
          <div className="flex items-center item gap-10">
            <div className="flex flex-grow items-center gap-10 " onClick={handleMetamask}>
              <MetaMask />
              <span>MetaMask</span>
            </div>
            <div className="flex items-center" onClick={handleMobileMetamask}>
              <QrIcon />
            </div>
          </div>
          <div className="flex items-center item item gap-10">
            <div className="flex flex-grow items-center gap-10" onClick={handleKeplr}>
              <Keplr />
              <span>Keplr</span>
            </div>
            <div className="flex items-center" onClick={handleMobileKeplr}>
              <QrIcon />
            </div>
          </div>
        </div>
        {mobile_mode && (qrCodeUrl ? (
          <div className="flex flex-col items-center gap-10">
            <span>Scan this QR code with your mobile wallet</span>
            <QRCode value={qrCodeUrl} />
          </div>
        ) : <div className="flex flex-col items-center">
          <img src={LOADING} />
        </div>)}
      </div>
      <Link className="hidden" ref={downloadMetamaskLink} to="https://metamask.io/download" target="_blank" />
      <Link className="hidden" ref={downloadKeplrLink} to="https://www.keplr.app/download" target="_blank" />
    </div>
  )
}