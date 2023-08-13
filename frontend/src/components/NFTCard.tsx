import { useEffect, useState } from "react"
import DEFAULT_IMG from "../assets/images/empty-nft.png"

export default function NFTCard({
  data, 
  type=0,
  isSelected=false,
  onClick=null
}: {
  type:number,
  data?:any,
  isSelected?:boolean
  onClick?:any
}) {
  const NORMAL_NFT = 0;
  const BUY_NFT = 1;
  const EMPTY_NFT = 2;
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
    <div className={(isSelected?"selected ":"") + "nft-card flex flex-col" + (type===EMPTY_NFT?" empty":" cursor-pointer")}>
      {type === BUY_NFT && (
        <a className="flex flex-col w-full h-full items-center justify-center" href="https://injective.talis.art/collection/649722487bb389db4355d335" target="#">
          <span className="aliens-font3 btn-plus">+</span>
          <span className="aliens-font3 btn-buy">Buy NFT</span>
        </a>)}
      {type === EMPTY_NFT && (
        <></>
      )}
      {type === NORMAL_NFT && (
        <div className="nft-inner flex flex-col items-center" onClick={() => onClick(data.token_id, data.airdrop)}>
          { isLoaded ? (
            <img className="nft-img" loading="lazy" src={imageUrl}/>
          ) : (
            <img className="nft-img" src={DEFAULT_IMG}/>
          ) }
          <span className="nft-id">{data && title}</span>
        </div>
      )}
    </div>
  )
}