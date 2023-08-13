import { useShuttle } from "@delphi-labs/shuttle-react";

import { useWalletStore } from "../store/wallet";

export default function useWallet() {
  const currentNetworkId = useWalletStore((state) => state.currentNetworkId);
  const { getWallets } = useShuttle();

  return getWallets({ chainId: currentNetworkId })[0];
}