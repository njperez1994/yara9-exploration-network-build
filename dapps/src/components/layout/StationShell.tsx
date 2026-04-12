import { useCallback, useEffect, useMemo, useState } from "react";
import { StationSidebar, type StationTab } from "./StationSidebar";
import { StationTopBanner } from "./StationTopBanner";
import { MarketView } from "../mcc/views/MarketView";
import { IndustrialCraftingView } from "../mcc/views/IndustrialCraftingView";
import { WalletView } from "../mcc/views/WalletView";
import { StorageLiveView } from "../mcc/views/StorageLiveView";
import { SatelliteLicensesView } from "../mcc/views/SatelliteLicensesView";
import { DataExchangeView } from "../mcc/views/DataExchangeView";
import {
  claimT1Probe,
  craftOwnerProbeBatch,
  fetchMacanaState,
  redeemDataItem,
  startScan,
  type MacanaActionResult,
  type MacanaLoopState,
} from "../../gameplay/macanaApi";
import type { StationIdentity } from "../../gameplay/stationIdentity";

type StationShellProps = {
  identity: StationIdentity;
};
const STANDING_TIERS = [
  {
    id: "standing-low",
    label: "Low Standing",
    minimumStanding: 0,
    dailyWithdrawalLimit: 5,
  },
  {
    id: "standing-medium",
    label: "Medium Standing",
    minimumStanding: 100,
    dailyWithdrawalLimit: 10,
  },
  {
    id: "standing-high",
    label: "High Standing",
    minimumStanding: 250,
    dailyWithdrawalLimit: 15,
  },
] as const;

const TAB_LABELS: Record<StationTab, string> = {
  exchange: "Data Exchange",
  industrial: "Fabrication",
  licenses: "Licenses",
  storage: "Storage Live",
  wallet: "Wallet",
  market: "Market",
};

function formatResource(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getStandingTierLabel(limit: number) {
  return (
    STANDING_TIERS.find((tier) => tier.dailyWithdrawalLimit === limit)?.label ??
    "Operational"
  );
}

export function StationShell({ identity }: StationShellProps) {
  const [activeTab, setActiveTab] = useState<StationTab>("exchange");
  const [clock, setClock] = useState(() => Date.now());
  const [loopState, setLoopState] = useState<MacanaLoopState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const result = await fetchMacanaState(identity.resolvedWalletAddress);
      setLoopState(result.state);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to reach the Macana backend.",
      );
    } finally {
      setLoading(false);
    }
  }, [identity.resolvedWalletAddress]);

  useEffect(() => {
    setLoading(true);
    void refreshState();
  }, [refreshState]);

  useEffect(() => {
    if (!loopState?.activeScan) {
      return;
    }

    const remainingMs =
      new Date(loopState.activeScan.completesAt).getTime() - Date.now();
    const timeoutId = window.setTimeout(
      () => {
        void refreshState();
      },
      Math.max(750, remainingMs + 400),
    );

    return () => window.clearTimeout(timeoutId);
  }, [loopState?.activeScan, refreshState]);

  const runAction = useCallback(
    async (action: () => Promise<MacanaActionResult>) => {
      try {
        const result = await action();
        setLoopState(result.state);
        setLoadError(null);
        return { ok: result.ok, message: result.message };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Macana backend request failed.";
        setLoadError(message);
        return { ok: false, message };
      }
    },
    [],
  );

  const claimProbe = useCallback(
    () => runAction(() => claimT1Probe(identity.resolvedWalletAddress)),
    [identity.resolvedWalletAddress, runAction],
  );

  const craftOwnerBatch = useCallback(
    () => runAction(() => craftOwnerProbeBatch(identity.resolvedWalletAddress)),
    [identity.resolvedWalletAddress, runAction],
  );

  const startTargetScan = useCallback(
    (targetId: string) =>
      runAction(() => startScan(identity.resolvedWalletAddress, targetId)),
    [identity.resolvedWalletAddress, runAction],
  );

  const redeemPendingDataItem = useCallback(
    (dataItemId: string) =>
      runAction(() =>
        redeemDataItem(identity.resolvedWalletAddress, dataItemId),
      ),
    [identity.resolvedWalletAddress, runAction],
  );

  const activeScan = useMemo(() => {
    if (!loopState?.activeScan) {
      return null;
    }

    return {
      ...loopState.activeScan,
      remainingSeconds: Math.max(
        0,
        Math.ceil(
          (new Date(loopState.activeScan.completesAt).getTime() - clock) / 1000,
        ),
      ),
    };
  }, [clock, loopState?.activeScan]);

  const standingTierLabel = loopState
    ? getStandingTierLabel(loopState.quota.limit)
    : "Loading";

  const standingTiers = useMemo(
    () =>
      STANDING_TIERS.map((tier) => ({
        ...tier,
        isCurrent: tier.dailyWithdrawalLimit === loopState?.quota.limit,
      })),
    [loopState?.quota.limit],
  );

  const opsStatus = useMemo(() => {
    if (loading && !loopState) {
      return "SYNCING";
    }

    if (loadError) {
      return "FAULT";
    }

    if (loopState?.activeScan) {
      return "SCAN ACTIVE";
    }

    if ((loopState?.pendingDataItems.length ?? 0) > 0) {
      return "PACKET READY";
    }

    return "STANDBY";
  }, [loadError, loading, loopState]);

  const activeView = useMemo(() => {
    if (loading && !loopState) {
      return (
        <section className="module-view">
          <h2>Station Sync</h2>
          <p>Requesting persisted rider state from Supabase.</p>
        </section>
      );
    }

    if (!loopState) {
      return (
        <section className="module-view">
          <h2>Station Sync Error</h2>
          <p>{loadError ?? "Macana backend state is unavailable."}</p>
        </section>
      );
    }

    switch (activeTab) {
      case "market":
        return <MarketView />;
      case "industrial":
        return (
          <IndustrialCraftingView
            riderRole={loopState.rider.role}
            t1ProbeCount={loopState.inventory.t1}
            onCraftT1={craftOwnerBatch}
          />
        );
      case "wallet":
        return (
          <WalletView
            connectedWalletAddress={identity.connectedWalletAddress}
            riderWalletAddress={loopState.rider.walletAddress}
            riderName={loopState.rider.riderName}
            riderRole={loopState.rider.role}
            authMode={identity.authMode}
          />
        );
      case "storage":
        return <StorageLiveView />;
      case "licenses":
        return (
          <SatelliteLicensesView
            standing={loopState.rider.standingPoints}
            standingTierLabel={standingTierLabel}
            withdrawalLimit={loopState.quota.limit}
            withdrawalsUsed={loopState.quota.used}
            standingTiers={standingTiers}
          />
        );
      case "exchange":
        return (
          <DataExchangeView
            t1ProbeCount={loopState.inventory.t1}
            riderRole={loopState.rider.role}
            standing={loopState.rider.standingPoints}
            standingTierLabel={standingTierLabel}
            withdrawalsUsed={loopState.quota.used}
            withdrawalLimit={loopState.quota.limit}
            mtcBalance={loopState.rider.mtcBalance}
            activeScan={activeScan}
            pendingDataItems={loopState.pendingDataItems}
            availableTargets={loopState.availableTargets}
            onClaimProbe={claimProbe}
            onStartScan={startTargetScan}
            onRedeemDataItem={redeemPendingDataItem}
          />
        );
      default:
        return <MarketView />;
    }
  }, [
    activeScan,
    activeTab,
    claimProbe,
    craftOwnerBatch,
    loadError,
    loading,
    loopState,
    redeemPendingDataItem,
    standingTierLabel,
    standingTiers,
    startTargetScan,
    identity.authMode,
    identity.connectedWalletAddress,
  ]);

  return (
    <section
      className="station-shell"
      aria-label="Macana Commerce Center station interface"
    >
      <StationTopBanner
        resources={{
          lux: loopState ? formatResource(loopState.station.luxBalance) : "--",
          mtc: loopState ? formatResource(loopState.rider.mtcBalance) : "--",
          scanData: loopState ? `${loopState.pendingDataItems.length}` : "--",
        }}
        riderName={loopState?.rider.riderName ?? "Dock Sync"}
        riderRole={loopState?.rider.role ?? "pending"}
        activeModuleLabel={TAB_LABELS[activeTab]}
        opsStatus={opsStatus}
      />

      <div className="station-main-layout">
        <StationSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
        <div
          className={`station-view-container ${
            activeTab === "industrial" ? "station-view-container--flush" : ""
          }`}
        >
          {loadError ? <p className="craft-note error">{loadError}</p> : null}
          {activeView}
        </div>
      </div>
    </section>
  );
}
