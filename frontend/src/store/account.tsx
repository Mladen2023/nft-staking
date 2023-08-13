import { create } from 'zustand'
import { persist } from "zustand/middleware";

import { toBase64, fromBase64 } from "@injectivelabs/sdk-ts";
import { BigNumberInWei } from '@injectivelabs/utils';

import { 
  chainGrpcBankApi,
  chainGrpcWasmApi,
} from '../utils/networks';


interface NftInfo {
  token_id: string
  lock_time: number
  airdrop: number
  token_uri: string
}

interface AccountState {
  address: string
  isAdmin: boolean
  totalBalance: number
  totalEarned: number
  accountNfts: Array<any>
  stakedNfts: Array<NftInfo>
  setAddress: Function
  setIsAdmin: Function
  fetchBalance: Function
  fetchTotalEarned: Function
  fetchAccountNfts: Function
  fetchStakedNfts: Function
  addNft: Function
  deleteNft: Function
  stakeNft: Function
  unstakeNft: Function
  setAirdrop: Function
  tokenUris: Array<any>
}

export const useAccountStore = create<AccountState>() (
  persist(
    (set, get) => ({
      address: '',
      isAdmin: false,
      totalBalance: 0,
      totalEarned: 0,
      accountNfts: [],
      stakedNfts: [],
      tokenUris: [],
      setAddress: (address: string) => {
        set({address: address})
      },
      setIsAdmin: (isAdmin: boolean) => {
        set({isAdmin: isAdmin})
      },
      fetchBalance: async () => {
        try {
          const balance = await chainGrpcBankApi.fetchBalance({
            accountAddress: get().address, 
            denom: import.meta.env.VITE_PUBLIC_STAKING_DENOM
          })
          set({totalBalance: Number(new BigNumberInWei(balance.amount).toBase().toFixed(2))})
        } catch (error) {
          console.log("fetch balance failed...", error)
        }
      },
      fetchTotalEarned: async () => {
        try {
          if (get().address.length == 0) return
          const response:any = await chainGrpcWasmApi.fetchSmartContractState(
            import.meta.env.VITE_PUBLIC_STAKING_CONTRACT, 
            toBase64({
              get_total_earned: {
                address: get().address
              }
            })
          );
          if (response) {
            const result = fromBase64(response.data)
            set({
              totalEarned: Number(new BigNumberInWei(result.total_earned).toBase().toFixed(2))
            })
          }
        } catch (error) {
          console.log(false, `Get Config error : ${error}`)
        }
      },
      fetchAccountNfts: async () => {
        try {
          const nftsArray:any = []
          let start_after:string = '0'
          while (1) {
            const response:any = await chainGrpcWasmApi.fetchSmartContractState(
              import.meta.env.VITE_PUBLIC_COLLECTION_CONTRACT, 
              toBase64({
                tokens: {
                  owner: get().address,
                  start_after: start_after,
                  limit: 30
                }
              })
            );
            if (response) {
              const result = fromBase64(response.data)
              if (result.ids.length == 0) break
              result.ids.forEach((token_id: string) => {
                nftsArray.push({token_id: token_id, token_uri: ''})
                start_after = token_id
              })
            }
          }

          let tokenUris = get().tokenUris
          let count = 0
          for (let index = 0; index < nftsArray.length; ++index) {
            let exist = tokenUris.findIndex((token: any) => {
              return (token.token_id == nftsArray[index].token_id)
            })

            if (exist < 0) {
              chainGrpcWasmApi.fetchSmartContractState(
                import.meta.env.VITE_PUBLIC_COLLECTION_CONTRACT, 
                toBase64({
                  all_nft_info: {
                    "token_id": nftsArray[index].token_id
                  }
                })
              ).then((response_nft: any) => {
                if (response_nft) {
                  count++
                  const nftInfo = fromBase64(response_nft.data)
                  nftsArray[index].token_uri = nftInfo.info.token_uri
                  tokenUris.push({token_id: nftsArray[index].token_id, token_uri: nftInfo.info.token_uri})
                  if (count == nftsArray.length) {
                    set({tokenUris: tokenUris})
                    set({accountNfts: nftsArray})
                  }
                }
              })
            } else {
              count++
              nftsArray[index].token_uri = tokenUris[exist].token_uri
              if (count == nftsArray.length)  {
                set({tokenUris: tokenUris})
                set({accountNfts: nftsArray})
              }
            }
          }
          
          if (nftsArray.length == 0) set({accountNfts: []})
        } catch (error) {
          set({accountNfts: []})
        }
      },
      addNft: async (tokenId: string) => {
        let exists = get().accountNfts
        let tokenUri = get().tokenUris.find((item) => (item.token_id == tokenId))
        
        if (!tokenUri) {
          tokenUri = {token_id: tokenId, token_uri: ''}
        }

        if (exists.findIndex((item) => (item.token_id == tokenId)) < 0) exists.push({token_id: tokenId, token_uri: tokenUri.token_uri})
        exists.sort((a, b) => {return (parseInt(a.token_id) - parseInt(b.token_id))})
        set({
          accountNfts: exists
        })
      },
      deleteNft: async (tokenId: string) => {
        let exists = get().accountNfts
        set({
          accountNfts: exists.filter((item) => (item.token_id != tokenId))
        })
      },
      fetchStakedNfts: async () => {
        try {
          const response:any = await chainGrpcWasmApi.fetchSmartContractState(
            import.meta.env.VITE_PUBLIC_STAKING_CONTRACT, 
            toBase64({
              staked_nfts: {
                address: get().address
              }
            })
          )
    
          const nftsArray:any = []
          if (response) {
            const result = fromBase64(response.data)
            result.nft_maps.forEach((nft: any) => {
              let airdrop = new BigNumberInWei(nft.airdrop).toBase().toNumber().toFixed(2)
              nftsArray.push({
                token_id: nft.nft_id, 
                lock_time: nft.lock_time,
                airdrop: Number(airdrop), 
                token_uri: '',
              })
              nftsArray.sort(compare)
            })
    
            let count = 0
            let tokenUris = get().tokenUris
            for (let index = 0; index < nftsArray.length; ++index) {
              let exist = tokenUris.findIndex((token: any) => {
                return (token.token_id == nftsArray[index].token_id)
              })
    
              if (exist < 0) {
                chainGrpcWasmApi.fetchSmartContractState(
                  import.meta.env.VITE_PUBLIC_COLLECTION_CONTRACT, 
                  toBase64({
                    all_nft_info: {
                      "token_id": nftsArray[index].token_id
                    }
                  })
                ).then((response_nft: any) => {
                  if (response_nft) {
                    count ++
                    const nftInfo = fromBase64(response_nft.data)
                    nftsArray[index].token_uri = nftInfo.info.token_uri
                    tokenUris.push({token_id: nftsArray[index].token_id, token_uri: nftInfo.info.token_uri})
                    if (count == nftsArray.length) {
                      set({tokenUris: tokenUris})
                      set({stakedNfts: nftsArray})
                    }
                  }
                })
              } else {
                count ++
                nftsArray[index].token_uri = tokenUris[exist].token_uri
                if (count == nftsArray.length) {
                  set({tokenUris: tokenUris})
                  set({stakedNfts: nftsArray})
                }
              }
            }
            if (nftsArray.length == 0) set({stakedNfts: []})
          }
        } catch (error) {
          console.log(error)
          set({stakedNfts: []})
        }
      },
      stakeNft: async (tokenId: string, lockTime: number) => {
        let exists = get().stakedNfts
        let tokenUri = get().tokenUris.find((item) => (item.token_id == tokenId))
        if (!tokenUri) {
          tokenUri = {token_id: tokenId, token_uri: ''}
        }

        if (exists.findIndex((item) => (item.token_id == tokenId)) < 0) exists.push({
          token_id: tokenId,
          token_uri: tokenUri.token_uri,
          airdrop: 0,
          lock_time: lockTime
        })
        exists.sort(compare)
        set({
          stakedNfts: exists
        })
      },
      unstakeNft: async (tokenId: string) => {
        let exists = get().stakedNfts
        set({
          stakedNfts: exists.filter((nft) => (nft.token_id!= tokenId))
        })
      },
      setAirdrop: (tokenId: string, airdrop: number) => {
        let exists = get().stakedNfts
        let index = exists.findIndex((item) => (item.token_id == tokenId))
        if (index >= 0) {
          exists[index].airdrop = airdrop
          set({
            stakedNfts: exists
          })
        }
        
      }
    }),
    {
      name: "account-state"
    }
  )
)

function compare(a: any, b: any) {
  return (parseInt(a.token_id) - parseInt(b.token_id))
}