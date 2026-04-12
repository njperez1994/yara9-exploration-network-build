import "./tailwind.css";
import ReactDOM from "react-dom/client";
import "./main.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import {
  NotificationProvider,
  VaultProvider,
  dAppKit,
} from "@evefrontier/dapp-kit";
import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { Theme } from "@radix-ui/themes";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Theme appearance="dark">
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <VaultProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </VaultProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  </Theme>,
);
