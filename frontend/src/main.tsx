import React from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/main.scss";
import "tailwindcss/tailwind.css"
import { createRoot } from 'react-dom/client';

import {
  KeplrExtensionProvider,
  MetamaskExtensionProvider,
  KeplrMobileProvider,
  MetamaskMobileProvider,
  ShuttleProvider
} from "@delphi-labs/shuttle-react"

import { INJECTIVE_MAINNET, INJECTIVE_TESTNET } from "./utils/networks";

const extensionProviders = [
  new KeplrExtensionProvider({
    networks: [INJECTIVE_MAINNET, INJECTIVE_TESTNET]
  }),
  new MetamaskExtensionProvider({
    networks: [INJECTIVE_MAINNET, INJECTIVE_TESTNET]
  })
];

const mobileProviders = [
  new KeplrMobileProvider({
    networks: [INJECTIVE_MAINNET, INJECTIVE_TESTNET]
  }),
  new MetamaskMobileProvider({
    networks: [INJECTIVE_MAINNET, INJECTIVE_TESTNET]
  })
];

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ShuttleProvider
      extensionProviders={extensionProviders}
      mobileProviders={mobileProviders}
      persistent
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ShuttleProvider>
  </React.StrictMode>
);
