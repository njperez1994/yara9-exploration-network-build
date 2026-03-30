import { useMemo, useState } from "react";
import { StationSidebar, type StationTab } from "./StationSidebar";
import { StationTopBanner } from "./StationTopBanner";
import { MarketView } from "../mcc/views/MarketView";
import { IndustrialCraftingView } from "../mcc/views/IndustrialCraftingView";
import { WalletView } from "../mcc/views/WalletView";
import { StorageLiveView } from "../mcc/views/StorageLiveView";
import { SatelliteLicensesView } from "../mcc/views/SatelliteLicensesView";
import { DataExchangeView } from "../mcc/views/DataExchangeView";
import type { StorageInventory } from "../mcc/storage-utils";

const T1_REQUIREMENTS: StorageInventory = {
  felspar: 100,
  platinum: 25,
};

export function StationShell() {
  const [activeTab, setActiveTab] = useState<StationTab>("market");
  const [materials, setMaterials] = useState<StorageInventory>({
    felspar: 0,
    platinum: 0,
  });
  const [moduleCount, setModuleCount] = useState(0);
  const [pendingScan, setPendingScan] = useState(false);
  const [dataItems, setDataItems] = useState(0);
  const [standing, setStanding] = useState(0);
  const [mtcRewards, setMtcRewards] = useState(0);

  const craftT1Module = () => {
    if (
      materials.felspar < T1_REQUIREMENTS.felspar ||
      materials.platinum < T1_REQUIREMENTS.platinum
    ) {
      return false;
    }

    setMaterials((prev) => ({
      felspar: prev.felspar - T1_REQUIREMENTS.felspar,
      platinum: prev.platinum - T1_REQUIREMENTS.platinum,
    }));
    setModuleCount((prev) => prev + 1);
    return true;
  };

  const startScan = () => {
    if (pendingScan || moduleCount < 1) return;
    setModuleCount((prev) => prev - 1);
    setPendingScan(true);
  };

  const completeScan = () => {
    if (!pendingScan) return;
    setPendingScan(false);
    setDataItems((prev) => prev + 1);
  };

  const redeemDataItem = () => {
    if (dataItems < 1) return;
    setDataItems((prev) => prev - 1);
    setStanding((prev) => prev + 10);
    setMtcRewards((prev) => prev + 50);
  };

  const activeView = useMemo(() => {
    switch (activeTab) {
      case "market":
        return <MarketView />;
      case "industrial":
        return (
          <IndustrialCraftingView
            requirements={T1_REQUIREMENTS}
            availableMaterials={materials}
            moduleCount={moduleCount}
            onInventorySync={setMaterials}
            onCraftT1={craftT1Module}
          />
        );
      case "wallet":
        return <WalletView />;
      case "storage":
        return <StorageLiveView />;
      case "licenses":
        return <SatelliteLicensesView />;
      case "exchange":
        return (
          <DataExchangeView
            moduleCount={moduleCount}
            pendingScan={pendingScan}
            dataItems={dataItems}
            standing={standing}
            mtcRewards={mtcRewards}
            onStartScan={startScan}
            onCompleteScan={completeScan}
            onRedeemData={redeemDataItem}
          />
        );
      default:
        return <MarketView />;
    }
  }, [
    activeTab,
    dataItems,
    materials,
    moduleCount,
    mtcRewards,
    pendingScan,
    standing,
  ]);

  return (
    <section
      className="station-shell"
      aria-label="Macana Commerce Center station interface"
    >
      <StationTopBanner
        resources={{
          lux: "12,480",
          mtc: `${mtcRewards}`,
          scanData: `${dataItems}`,
        }}
      />

      <div className="station-main-layout">
        <StationSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
        <div className="station-view-container">{activeView}</div>
      </div>
    </section>
  );
}
