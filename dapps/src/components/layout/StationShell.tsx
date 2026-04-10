import { useEffect, useMemo, useState } from "react";
import { StationSidebar, type StationTab } from "./StationSidebar";
import { StationTopBanner } from "./StationTopBanner";
import { MarketView } from "../mcc/views/MarketView";
import { IndustrialCraftingView } from "../mcc/views/IndustrialCraftingView";
import { WalletView } from "../mcc/views/WalletView";
import { StorageLiveView } from "../mcc/views/StorageLiveView";
import { SatelliteLicensesView } from "../mcc/views/SatelliteLicensesView";
import { DataExchangeView } from "../mcc/views/DataExchangeView";
import type { StorageInventory } from "../mcc/storage-utils";
import {
  advanceSimulation,
  deploySatelliteToTarget,
  getSimulationView,
  loadSimulationState,
  queueSatelliteCraft,
  saveSimulationState,
  submitScanResult,
  syncStationResourcesFromStorage,
  withdrawFreeSatellite,
} from "../../gameplay/macanaSimulation";

export function StationShell() {
  const [activeTab, setActiveTab] = useState<StationTab>("exchange");
  const [clock, setClock] = useState(() => Date.now());
  const [simulation, setSimulation] = useState(() => loadSimulationState());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      setSimulation((current) => advanceSimulation(current, now));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    saveSimulationState(simulation);
  }, [simulation]);

  const syncInventory = (inventory: StorageInventory) => {
    let message = "Storage sync failed.";
    let ok = false;

    setSimulation((current) => {
      const result = syncStationResourcesFromStorage(
        current,
        inventory,
        Date.now(),
      );
      message = result.message;
      ok = result.ok;
      return result.state;
    });

    return { ok, message };
  };

  const queueT1Craft = () => {
    let message = "Crafting request failed.";
    let ok = false;

    setSimulation((current) => {
      const result = queueSatelliteCraft(current, Date.now());
      message = result.message;
      ok = result.ok;
      return result.state;
    });

    return { ok, message };
  };

  const withdrawSatellite = () => {
    let message = "Satellite withdrawal failed.";
    let ok = false;

    setSimulation((current) => {
      const result = withdrawFreeSatellite(current, Date.now());
      message = result.message;
      ok = result.ok;
      return result.state;
    });

    return { ok, message };
  };

  const deploySatellite = (targetId: string) => {
    let message = "Satellite deployment failed.";
    let ok = false;

    setSimulation((current) => {
      const result = deploySatelliteToTarget(current, targetId, Date.now());
      message = result.message;
      ok = result.ok;
      return result.state;
    });

    return { ok, message };
  };

  const submitResult = (resultId: string) => {
    let message = "Scan submission failed.";
    let ok = false;

    setSimulation((current) => {
      const result = submitScanResult(current, resultId, Date.now());
      message = result.message;
      ok = result.ok;
      return result.state;
    });

    return { ok, message };
  };

  const simulationView = useMemo(
    () => getSimulationView(simulation, clock),
    [clock, simulation],
  );

  const activeView = useMemo(() => {
    switch (activeTab) {
      case "market":
        return <MarketView />;
      case "industrial":
        return (
          <IndustrialCraftingView
            requirements={simulationView.recipeRequirements}
            availableMaterials={simulationView.stationResources}
            corpPoolCount={simulationView.corpPoolCount}
            queuedCraftCount={simulationView.queuedCraftCount}
            activeCraftJobs={simulationView.activeCraftJobs}
            onInventorySync={syncInventory}
            onCraftT1={queueT1Craft}
          />
        );
      case "wallet":
        return <WalletView />;
      case "storage":
        return <StorageLiveView />;
      case "licenses":
        return (
          <SatelliteLicensesView
            standing={simulationView.standing}
            standingTierLabel={simulationView.standingTierLabel}
            withdrawalLimit={simulationView.withdrawalLimit}
            withdrawalsUsed={simulationView.withdrawalsUsed}
            standingTiers={simulationView.standingTiers}
          />
        );
      case "exchange":
        return (
          <DataExchangeView
            corpPoolCount={simulationView.corpPoolCount}
            riderReadySatelliteCount={simulationView.riderReadySatelliteCount}
            riderExpiredSatelliteCount={
              simulationView.riderExpiredSatelliteCount
            }
            standing={simulationView.standing}
            standingTierLabel={simulationView.standingTierLabel}
            withdrawalsUsed={simulationView.withdrawalsUsed}
            withdrawalLimit={simulationView.withdrawalLimit}
            mtcBalance={simulationView.mtcBalance}
            activeDeployment={simulationView.activeDeployment}
            pendingResults={simulationView.pendingResults}
            availableTargets={simulationView.availableTargets}
            onWithdrawSatellite={withdrawSatellite}
            onDeploySatellite={deploySatellite}
            onSubmitScanResult={submitResult}
          />
        );
      default:
        return <MarketView />;
    }
  }, [activeTab, simulationView]);

  return (
    <section
      className="station-shell"
      aria-label="Macana Commerce Center station interface"
    >
      <StationTopBanner
        resources={{
          lux: "12,480",
          mtc: `${simulationView.mtcBalance}`,
          scanData: `${simulationView.pendingResultCount}`,
        }}
      />

      <div className="station-main-layout">
        <StationSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
        <div className="station-view-container">{activeView}</div>
      </div>
    </section>
  );
}
