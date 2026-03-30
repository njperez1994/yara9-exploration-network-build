import { useMemo, useState } from "react";
import { StationSidebar, type StationTab } from "./StationSidebar";
import { StationTopBanner } from "./StationTopBanner";
import { MarketView } from "../mcc/views/MarketView";
import { IndustrialCraftingView } from "../mcc/views/IndustrialCraftingView";
import { WalletView } from "../mcc/views/WalletView";
import { StorageLiveView } from "../mcc/views/StorageLiveView";
import { SatelliteLicensesView } from "../mcc/views/SatelliteLicensesView";
import { DataExchangeView } from "../mcc/views/DataExchangeView";

export function StationShell() {
  const [activeTab, setActiveTab] = useState<StationTab>("market");

  const activeView = useMemo(() => {
    switch (activeTab) {
      case "market":
        return <MarketView />;
      case "industrial":
        return <IndustrialCraftingView />;
      case "wallet":
        return <WalletView />;
      case "storage":
        return <StorageLiveView />;
      case "licenses":
        return <SatelliteLicensesView />;
      case "exchange":
        return <DataExchangeView />;
      default:
        return <MarketView />;
    }
  }, [activeTab]);

  return (
    <section
      className="station-shell"
      aria-label="Macana Commerce Center station interface"
    >
      <StationTopBanner
        resources={{
          lux: "12,480",
          mtc: "1,260",
          scanData: "38 packets",
        }}
      />

      <div className="station-main-layout">
        <StationSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
        <div className="station-view-container">{activeView}</div>
      </div>
    </section>
  );
}
