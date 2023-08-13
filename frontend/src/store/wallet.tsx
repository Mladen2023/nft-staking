import { create } from "zustand";
import { persist } from "zustand/middleware";
import detectEthereumProvider from '@metamask/detect-provider'

interface WalletState {
  currentNetworkId: string
  switchNetwork: Function
  isMetamaskInstalled: Function
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      currentNetworkId: import.meta.env.VITE_PUBLIC_CHAIN_ID,
      switchNetwork: (network: string) => set({ currentNetworkId: network }),
      isMetamaskInstalled: async () => {
        const provider = await detectEthereumProvider()
        return !!provider
      }
    }),
    {
      name: "wallet-state",
    }
  )
);
