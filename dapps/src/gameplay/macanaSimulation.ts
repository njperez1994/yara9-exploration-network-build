export type StationResourceInventory = {
  felspar: number;
  platinum: number;
};

export type SimulationActionResult = {
  ok: boolean;
  message: string;
  state: SimulationState;
};

type Corporation = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
};

type Station = {
  id: string;
  corporationId: string;
  code: string;
  name: string;
  createdAt: string;
};

type Rider = {
  id: string;
  callsign: string;
  walletAddress: string | null;
  createdAt: string;
};

type ResourceType = {
  id: string;
  code: keyof StationResourceInventory;
  label: string;
  sourceTypeId: string | null;
};

type StationResourceBalance = {
  id: string;
  stationId: string;
  resourceTypeId: string;
  availableUnits: number;
  updatedAt: string;
  sourceSnapshotAt: string | null;
};

type ItemType = {
  id: string;
  code: string;
  label: string;
  category: "satellite";
  moveTypeRef: string | null;
};

type CraftingRecipe = {
  id: string;
  stationId: string;
  itemTypeId: string;
  label: string;
  outputQuantity: number;
  craftDurationSeconds: number;
  active: boolean;
};

type CraftingRecipeInput = {
  id: string;
  recipeId: string;
  resourceTypeId: string;
  quantity: number;
};

type CorporationInventory = {
  id: string;
  corporationId: string;
  stationId: string;
  itemTypeId: string;
  quantity: number;
  updatedAt: string;
};

type RiderInventoryStatus = "ready" | "deployed" | "consumed" | "expired";

type RiderInventory = {
  id: string;
  riderId: string;
  corporationId: string;
  stationId: string;
  itemTypeId: string;
  sourceWithdrawalId: string;
  status: RiderInventoryStatus;
  expiresAt: string;
  updatedAt: string;
  chainObjectId: string | null;
};

type SystemRecord = {
  id: string;
  code: string;
  label: string;
};

type ScanTarget = {
  id: string;
  systemId: string;
  label: string;
  kind: "ore_pocket" | "relay_wreck" | "signal_trace";
  standingReward: number;
  mtcReward: number;
  scanDurationSeconds: number;
  active: boolean;
};

type SatelliteWithdrawal = {
  id: string;
  riderId: string;
  corporationId: string;
  stationId: string;
  itemTypeId: string;
  riderInventoryId: string;
  withdrawnAt: string;
  dayKey: string;
  standingAtWithdrawal: number;
  standingTierId: string;
  costMtc: number;
  expiresAt: string;
};

type SatelliteDeploymentStatus = "active" | "completed";

type SatelliteDeployment = {
  id: string;
  riderId: string;
  riderInventoryId: string;
  targetId: string;
  status: SatelliteDeploymentStatus;
  deployedAt: string;
  completesAt: string;
  completedAt: string | null;
};

type ScanResultStatus = "captured" | "submitted";

type ScanResult = {
  id: string;
  riderId: string;
  deploymentId: string;
  targetId: string;
  status: ScanResultStatus;
  dataUnits: number;
  standingAwarded: number;
  mtcAwarded: number;
  completedAt: string;
  submittedAt: string | null;
};

type StandingTier = {
  id: string;
  code: string;
  label: string;
  minimumStanding: number;
  dailyWithdrawalLimit: number;
};

type RiderStanding = {
  id: string;
  riderId: string;
  corporationId: string;
  totalStanding: number;
  tierId: string;
  updatedAt: string;
};

type MtcWallet = {
  id: string;
  riderId: string;
  balance: number;
  updatedAt: string;
};

type MtcLedger = {
  id: string;
  walletId: string;
  riderId: string;
  amount: number;
  reason: "t1_scan_submission";
  scanResultId: string;
  createdAt: string;
};

type CorporationCraftingJobStatus = "queued" | "completed";

type CorporationCraftingJob = {
  id: string;
  corporationId: string;
  stationId: string;
  recipeId: string;
  itemTypeId: string;
  quantity: number;
  status: CorporationCraftingJobStatus;
  startedAt: string;
  completesAt: string;
  completedAt: string | null;
};

export type SimulationState = {
  version: number;
  corporations: Corporation[];
  stations: Station[];
  riders: Rider[];
  resourceTypes: ResourceType[];
  stationResourceBalances: StationResourceBalance[];
  itemTypes: ItemType[];
  craftingRecipes: CraftingRecipe[];
  craftingRecipeInputs: CraftingRecipeInput[];
  corporationInventory: CorporationInventory[];
  riderInventory: RiderInventory[];
  systems: SystemRecord[];
  scanTargets: ScanTarget[];
  satelliteWithdrawals: SatelliteWithdrawal[];
  satelliteDeployments: SatelliteDeployment[];
  scanResults: ScanResult[];
  standingTiers: StandingTier[];
  riderStanding: RiderStanding[];
  mtcWallets: MtcWallet[];
  mtcLedger: MtcLedger[];
  corporationCraftingJobs: CorporationCraftingJob[];
};

export type SimulationView = {
  corpPoolCount: number;
  queuedCraftCount: number;
  activeCraftJobs: Array<{
    id: string;
    quantity: number;
    remainingSeconds: number;
  }>;
  stationResources: StationResourceInventory;
  recipeRequirements: StationResourceInventory;
  standing: number;
  standingTierLabel: string;
  standingTierCode: string;
  withdrawalLimit: number;
  withdrawalsUsed: number;
  withdrawalsRemaining: number;
  riderReadySatelliteCount: number;
  riderExpiredSatelliteCount: number;
  mtcBalance: number;
  activeDeployment: {
    id: string;
    targetId: string;
    targetLabel: string;
    systemLabel: string;
    remainingSeconds: number;
    standingReward: number;
    mtcReward: number;
  } | null;
  pendingResults: Array<{
    id: string;
    targetLabel: string;
    standingAwarded: number;
    mtcAwarded: number;
    completedAt: string;
  }>;
  pendingResultCount: number;
  availableTargets: Array<{
    id: string;
    label: string;
    systemLabel: string;
    scanDurationSeconds: number;
    standingReward: number;
    mtcReward: number;
  }>;
  standingTiers: Array<{
    id: string;
    label: string;
    minimumStanding: number;
    dailyWithdrawalLimit: number;
    isCurrent: boolean;
  }>;
};

const SIMULATION_STATE_VERSION = 1;
const STORAGE_KEY = "macana-gameplay-simulation-v1";
const CORPORATION_ID = "corp-macana";
const STATION_ID = "station-mcc";
const RIDER_ID = "rider-demo";
const T1_ITEM_TYPE_ID = "item-satellite-t1";
const T1_RECIPE_ID = "recipe-satellite-t1";
const FELSPAR_RESOURCE_ID = "resource-felspar";
const PLATINUM_RESOURCE_ID = "resource-platinum";
const T1_EXPIRY_MS = 24 * 60 * 60 * 1000;

function toIso(time: number) {
  return new Date(time).toISOString();
}

function getDayKey(time: number) {
  return toIso(time).slice(0, 10);
}

function parseTime(value: string) {
  return new Date(value).getTime();
}

function makeId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStandingRecord(state: SimulationState) {
  const standing = state.riderStanding.find(
    (entry) => entry.riderId === RIDER_ID,
  );
  if (!standing) {
    throw new Error("Missing rider standing record.");
  }

  return standing;
}

function getWallet(state: SimulationState) {
  const wallet = state.mtcWallets.find((entry) => entry.riderId === RIDER_ID);
  if (!wallet) {
    throw new Error("Missing rider MTC wallet.");
  }

  return wallet;
}

function getStandingTierForValue(
  state: SimulationState,
  totalStanding: number,
) {
  const tiers = [...state.standingTiers].sort(
    (left, right) => left.minimumStanding - right.minimumStanding,
  );
  const eligibleTiers = tiers.filter(
    (candidate) => totalStanding >= candidate.minimumStanding,
  );
  const tier = eligibleTiers[eligibleTiers.length - 1] || tiers[0];

  if (!tier) {
    throw new Error("Missing standing tiers.");
  }

  return tier;
}

function getResourceBalance(
  state: SimulationState,
  resourceCode: keyof StationResourceInventory,
) {
  const resource = state.resourceTypes.find(
    (entry) => entry.code === resourceCode,
  );
  if (!resource) {
    throw new Error(`Missing resource type: ${resourceCode}.`);
  }

  const balance = state.stationResourceBalances.find(
    (entry) =>
      entry.stationId === STATION_ID && entry.resourceTypeId === resource.id,
  );
  if (!balance) {
    throw new Error(`Missing station resource balance: ${resourceCode}.`);
  }

  return balance;
}

function getCorpInventoryEntry(state: SimulationState) {
  const entry = state.corporationInventory.find(
    (candidate) =>
      candidate.corporationId === CORPORATION_ID &&
      candidate.stationId === STATION_ID &&
      candidate.itemTypeId === T1_ITEM_TYPE_ID,
  );
  if (!entry) {
    throw new Error("Missing corporation inventory entry for T1 satellites.");
  }

  return entry;
}

function getRecipe(state: SimulationState) {
  const recipe = state.craftingRecipes.find(
    (entry) => entry.id === T1_RECIPE_ID,
  );
  if (!recipe) {
    throw new Error("Missing T1 recipe.");
  }

  return recipe;
}

function getRecipeRequirements(
  state: SimulationState,
): StationResourceInventory {
  const felsparInput = state.craftingRecipeInputs.find(
    (entry) =>
      entry.recipeId === T1_RECIPE_ID &&
      entry.resourceTypeId === FELSPAR_RESOURCE_ID,
  );
  const platinumInput = state.craftingRecipeInputs.find(
    (entry) =>
      entry.recipeId === T1_RECIPE_ID &&
      entry.resourceTypeId === PLATINUM_RESOURCE_ID,
  );

  return {
    felspar: felsparInput?.quantity ?? 0,
    platinum: platinumInput?.quantity ?? 0,
  };
}

function getTodaysWithdrawalCount(state: SimulationState, time: number) {
  const dayKey = getDayKey(time);
  return state.satelliteWithdrawals.filter(
    (entry) => entry.riderId === RIDER_ID && entry.dayKey === dayKey,
  ).length;
}

function cloneState(state: SimulationState) {
  return structuredClone(state) as SimulationState;
}

function createInitialSimulationState(time = Date.now()): SimulationState {
  const createdAt = toIso(time);
  const standingTiers: StandingTier[] = [
    {
      id: "tier-provisional",
      code: "provisional",
      label: "Provisional Access",
      minimumStanding: 0,
      dailyWithdrawalLimit: 1,
    },
    {
      id: "tier-cleared",
      code: "cleared",
      label: "Cleared Rider",
      minimumStanding: 100,
      dailyWithdrawalLimit: 2,
    },
    {
      id: "tier-recognized",
      code: "recognized",
      label: "Recognized Operative",
      minimumStanding: 250,
      dailyWithdrawalLimit: 3,
    },
    {
      id: "tier-vanguard",
      code: "vanguard",
      label: "Macana Vanguard",
      minimumStanding: 500,
      dailyWithdrawalLimit: 4,
    },
  ];
  const initialStanding = 80;
  const eligibleTiers = [...standingTiers].filter(
    (tier) => initialStanding >= tier.minimumStanding,
  );
  const currentTier =
    eligibleTiers[eligibleTiers.length - 1] || standingTiers[0];

  return {
    version: SIMULATION_STATE_VERSION,
    corporations: [
      {
        id: CORPORATION_ID,
        code: "MACANA",
        name: "Macana Corp",
        createdAt,
      },
    ],
    stations: [
      {
        id: STATION_ID,
        corporationId: CORPORATION_ID,
        code: "MCC",
        name: "Macana Commerce Center",
        createdAt,
      },
    ],
    riders: [
      {
        id: RIDER_ID,
        callsign: "Rider BX-04",
        walletAddress: null,
        createdAt,
      },
    ],
    resourceTypes: [
      {
        id: FELSPAR_RESOURCE_ID,
        code: "felspar",
        label: "Feldspar Crystals",
        sourceTypeId: "77800",
      },
      {
        id: PLATINUM_RESOURCE_ID,
        code: "platinum",
        label: "PlatinumPalladium Matrix",
        sourceTypeId: "77810",
      },
    ],
    stationResourceBalances: [
      {
        id: "balance-felspar",
        stationId: STATION_ID,
        resourceTypeId: FELSPAR_RESOURCE_ID,
        availableUnits: 0,
        updatedAt: createdAt,
        sourceSnapshotAt: null,
      },
      {
        id: "balance-platinum",
        stationId: STATION_ID,
        resourceTypeId: PLATINUM_RESOURCE_ID,
        availableUnits: 0,
        updatedAt: createdAt,
        sourceSnapshotAt: null,
      },
    ],
    itemTypes: [
      {
        id: T1_ITEM_TYPE_ID,
        code: "satellite_t1",
        label: "Survey Satellite T1",
        category: "satellite",
        moveTypeRef: null,
      },
    ],
    craftingRecipes: [
      {
        id: T1_RECIPE_ID,
        stationId: STATION_ID,
        itemTypeId: T1_ITEM_TYPE_ID,
        label: "Survey Satellite T1",
        outputQuantity: 1,
        craftDurationSeconds: 18,
        active: true,
      },
    ],
    craftingRecipeInputs: [
      {
        id: "recipe-input-felspar",
        recipeId: T1_RECIPE_ID,
        resourceTypeId: FELSPAR_RESOURCE_ID,
        quantity: 100,
      },
      {
        id: "recipe-input-platinum",
        recipeId: T1_RECIPE_ID,
        resourceTypeId: PLATINUM_RESOURCE_ID,
        quantity: 25,
      },
    ],
    corporationInventory: [
      {
        id: "corp-inventory-t1",
        corporationId: CORPORATION_ID,
        stationId: STATION_ID,
        itemTypeId: T1_ITEM_TYPE_ID,
        quantity: 2,
        updatedAt: createdAt,
      },
    ],
    riderInventory: [],
    systems: [
      {
        id: "system-halo",
        code: "HALO-7",
        label: "Halo-7 Fringe",
      },
      {
        id: "system-lattice",
        code: "LATTICE-3",
        label: "Transfer Lattice-3",
      },
      {
        id: "system-yara",
        code: "YARA-9",
        label: "YARA-9 Outer Belt",
      },
    ],
    scanTargets: [
      {
        id: "target-perimeter-echo",
        systemId: "system-halo",
        label: "Perimeter Echo Cluster",
        kind: "ore_pocket",
        standingReward: 35,
        mtcReward: 0,
        scanDurationSeconds: 12,
        active: true,
      },
      {
        id: "target-relay-wreck",
        systemId: "system-lattice",
        label: "Relay Wreck Envelope",
        kind: "relay_wreck",
        standingReward: 45,
        mtcReward: 4,
        scanDurationSeconds: 18,
        active: true,
      },
      {
        id: "target-yara-trace",
        systemId: "system-yara",
        label: "YARA-9 Signal Fringe",
        kind: "signal_trace",
        standingReward: 60,
        mtcReward: 6,
        scanDurationSeconds: 24,
        active: true,
      },
    ],
    satelliteWithdrawals: [],
    satelliteDeployments: [],
    scanResults: [],
    standingTiers,
    riderStanding: [
      {
        id: "standing-rider-demo",
        riderId: RIDER_ID,
        corporationId: CORPORATION_ID,
        totalStanding: initialStanding,
        tierId: currentTier.id,
        updatedAt: createdAt,
      },
    ],
    mtcWallets: [
      {
        id: "wallet-rider-demo",
        riderId: RIDER_ID,
        balance: 0,
        updatedAt: createdAt,
      },
    ],
    mtcLedger: [],
    corporationCraftingJobs: [],
  };
}

export function loadSimulationState() {
  if (typeof window === "undefined") {
    return createInitialSimulationState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialSimulationState();
    }

    const parsed = JSON.parse(raw) as Partial<SimulationState>;
    if (
      parsed.version !== SIMULATION_STATE_VERSION ||
      !Array.isArray(parsed.corporations) ||
      !Array.isArray(parsed.scanTargets)
    ) {
      return createInitialSimulationState();
    }

    return parsed as SimulationState;
  } catch {
    return createInitialSimulationState();
  }
}

export function saveSimulationState(state: SimulationState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore local persistence failures and keep the in-memory state live.
  }
}

export function advanceSimulation(state: SimulationState, time: number) {
  let nextState: SimulationState | null = null;

  for (const job of state.corporationCraftingJobs) {
    if (job.status !== "queued" || parseTime(job.completesAt) > time) {
      continue;
    }

    const draft: SimulationState = nextState ?? cloneState(state);
    const draftJob = draft.corporationCraftingJobs.find(
      (candidate) => candidate.id === job.id,
    );
    if (!draftJob || draftJob.status !== "queued") {
      nextState = draft;
      continue;
    }

    draftJob.status = "completed";
    draftJob.completedAt = draftJob.completesAt;

    const corpInventory = getCorpInventoryEntry(draft);
    corpInventory.quantity += draftJob.quantity;
    corpInventory.updatedAt = draftJob.completesAt;
    nextState = draft;
  }

  for (const item of state.riderInventory) {
    if (item.status !== "ready" || parseTime(item.expiresAt) > time) {
      continue;
    }

    const draft: SimulationState = nextState ?? cloneState(state);
    const draftItem = draft.riderInventory.find(
      (candidate) => candidate.id === item.id,
    );
    if (!draftItem || draftItem.status !== "ready") {
      nextState = draft;
      continue;
    }

    draftItem.status = "expired";
    draftItem.updatedAt = draftItem.expiresAt;
    nextState = draft;
  }

  for (const deployment of state.satelliteDeployments) {
    if (
      deployment.status !== "active" ||
      parseTime(deployment.completesAt) > time
    ) {
      continue;
    }

    const draft: SimulationState = nextState ?? cloneState(state);
    const draftDeployment = draft.satelliteDeployments.find(
      (candidate) => candidate.id === deployment.id,
    );
    if (!draftDeployment || draftDeployment.status !== "active") {
      nextState = draft;
      continue;
    }

    draftDeployment.status = "completed";
    draftDeployment.completedAt = draftDeployment.completesAt;

    const riderItem = draft.riderInventory.find(
      (candidate) => candidate.id === draftDeployment.riderInventoryId,
    );
    if (riderItem) {
      riderItem.status = "consumed";
      riderItem.updatedAt = draftDeployment.completesAt;
    }

    const target = draft.scanTargets.find(
      (candidate) => candidate.id === draftDeployment.targetId,
    );
    const existingResult = draft.scanResults.find(
      (candidate) => candidate.deploymentId === draftDeployment.id,
    );
    if (target && !existingResult) {
      draft.scanResults.push({
        id: makeId("scan-result"),
        riderId: RIDER_ID,
        deploymentId: draftDeployment.id,
        targetId: target.id,
        status: "captured",
        dataUnits: 1,
        standingAwarded: target.standingReward,
        mtcAwarded: target.mtcReward,
        completedAt: draftDeployment.completesAt,
        submittedAt: null,
      });

      const standing = getStandingRecord(draft);
      standing.totalStanding += target.standingReward;
      standing.tierId = getStandingTierForValue(
        draft,
        standing.totalStanding,
      ).id;
      standing.updatedAt = draftDeployment.completesAt;
    }

    nextState = draft;
  }

  return nextState ?? state;
}

export function syncStationResourcesFromStorage(
  state: SimulationState,
  inventory: StationResourceInventory,
  time: number,
): SimulationActionResult {
  const nextState = cloneState(advanceSimulation(state, time));
  const updatedAt = toIso(time);
  const felsparBalance = getResourceBalance(nextState, "felspar");
  const platinumBalance = getResourceBalance(nextState, "platinum");

  felsparBalance.availableUnits = inventory.felspar;
  felsparBalance.updatedAt = updatedAt;
  felsparBalance.sourceSnapshotAt = updatedAt;

  platinumBalance.availableUnits = inventory.platinum;
  platinumBalance.updatedAt = updatedAt;
  platinumBalance.sourceSnapshotAt = updatedAt;

  return {
    ok: true,
    message: `Station reserves synced. ${inventory.felspar} FE and ${inventory.platinum} PP ready for corp fabrication.`,
    state: nextState,
  };
}

export function queueSatelliteCraft(
  state: SimulationState,
  time: number,
): SimulationActionResult {
  const nextState = cloneState(advanceSimulation(state, time));
  const recipe = getRecipe(nextState);
  const requirements = getRecipeRequirements(nextState);
  const felsparBalance = getResourceBalance(nextState, "felspar");
  const platinumBalance = getResourceBalance(nextState, "platinum");

  if (!recipe.active) {
    return {
      ok: false,
      message: "Macana fabrication recipe is not active.",
      state: nextState,
    };
  }

  if (felsparBalance.availableUnits < requirements.felspar) {
    return {
      ok: false,
      message: "Insufficient feldspar reserve for a T1 satellite build.",
      state: nextState,
    };
  }

  if (platinumBalance.availableUnits < requirements.platinum) {
    return {
      ok: false,
      message: "Insufficient platinum reserve for a T1 satellite build.",
      state: nextState,
    };
  }

  felsparBalance.availableUnits -= requirements.felspar;
  felsparBalance.updatedAt = toIso(time);
  platinumBalance.availableUnits -= requirements.platinum;
  platinumBalance.updatedAt = toIso(time);

  nextState.corporationCraftingJobs.push({
    id: makeId("corp-craft"),
    corporationId: CORPORATION_ID,
    stationId: STATION_ID,
    recipeId: recipe.id,
    itemTypeId: T1_ITEM_TYPE_ID,
    quantity: recipe.outputQuantity,
    status: "queued",
    startedAt: toIso(time),
    completesAt: toIso(time + recipe.craftDurationSeconds * 1000),
    completedAt: null,
  });

  return {
    ok: true,
    message: `Macana fabrication queue started. One T1 satellite will enter the corp pool in ${recipe.craftDurationSeconds}s.`,
    state: nextState,
  };
}

export function withdrawFreeSatellite(
  state: SimulationState,
  time: number,
): SimulationActionResult {
  const nextState = cloneState(advanceSimulation(state, time));
  const standing = getStandingRecord(nextState);
  const standingTier = getStandingTierForValue(
    nextState,
    standing.totalStanding,
  );
  const corpInventory = getCorpInventoryEntry(nextState);
  const withdrawalsUsed = getTodaysWithdrawalCount(nextState, time);

  if (corpInventory.quantity < 1) {
    return {
      ok: false,
      message:
        "Corp pool exhausted. Queue another Macana build before withdrawing.",
      state: nextState,
    };
  }

  if (withdrawalsUsed >= standingTier.dailyWithdrawalLimit) {
    return {
      ok: false,
      message: `${standingTier.label} quota reached for today. Raise standing or wait for the next station day.`,
      state: nextState,
    };
  }

  const withdrawalId = makeId("withdrawal");
  const riderInventoryId = makeId("rider-satellite");
  const expiresAt = toIso(time + T1_EXPIRY_MS);

  corpInventory.quantity -= 1;
  corpInventory.updatedAt = toIso(time);

  nextState.riderInventory.push({
    id: riderInventoryId,
    riderId: RIDER_ID,
    corporationId: CORPORATION_ID,
    stationId: STATION_ID,
    itemTypeId: T1_ITEM_TYPE_ID,
    sourceWithdrawalId: withdrawalId,
    status: "ready",
    expiresAt,
    updatedAt: toIso(time),
    chainObjectId: null,
  });

  nextState.satelliteWithdrawals.push({
    id: withdrawalId,
    riderId: RIDER_ID,
    corporationId: CORPORATION_ID,
    stationId: STATION_ID,
    itemTypeId: T1_ITEM_TYPE_ID,
    riderInventoryId,
    withdrawnAt: toIso(time),
    dayKey: getDayKey(time),
    standingAtWithdrawal: standing.totalStanding,
    standingTierId: standingTier.id,
    costMtc: 0,
    expiresAt,
  });

  return {
    ok: true,
    message:
      "Free T1 satellite withdrawn from the Macana corp pool. Rider ownership active for 24 hours.",
    state: nextState,
  };
}

export function deploySatelliteToTarget(
  state: SimulationState,
  targetId: string,
  time: number,
): SimulationActionResult {
  const nextState = cloneState(advanceSimulation(state, time));
  const activeDeployment = nextState.satelliteDeployments.find(
    (entry) => entry.riderId === RIDER_ID && entry.status === "active",
  );
  if (activeDeployment) {
    return {
      ok: false,
      message: "A T1 satellite is already active in the field.",
      state: nextState,
    };
  }

  const target = nextState.scanTargets.find(
    (entry) => entry.id === targetId && entry.active,
  );
  if (!target) {
    return {
      ok: false,
      message: "Selected scan target is not available.",
      state: nextState,
    };
  }

  const riderSatellite = [...nextState.riderInventory]
    .filter((entry) => entry.riderId === RIDER_ID && entry.status === "ready")
    .sort(
      (left, right) => parseTime(left.expiresAt) - parseTime(right.expiresAt),
    )[0];

  if (!riderSatellite) {
    return {
      ok: false,
      message:
        "No ready T1 satellites available. Withdraw one from the corp pool first.",
      state: nextState,
    };
  }

  riderSatellite.status = "deployed";
  riderSatellite.updatedAt = toIso(time);

  nextState.satelliteDeployments.push({
    id: makeId("deployment"),
    riderId: RIDER_ID,
    riderInventoryId: riderSatellite.id,
    targetId: target.id,
    status: "active",
    deployedAt: toIso(time),
    completesAt: toIso(time + target.scanDurationSeconds * 1000),
    completedAt: null,
  });

  return {
    ok: true,
    message: `${target.label} locked. T1 scan will resolve in ${target.scanDurationSeconds}s.`,
    state: nextState,
  };
}

export function submitScanResult(
  state: SimulationState,
  resultId: string,
  time: number,
): SimulationActionResult {
  const nextState = cloneState(advanceSimulation(state, time));
  const scanResult = nextState.scanResults.find(
    (entry) => entry.id === resultId,
  );

  if (!scanResult || scanResult.status !== "captured") {
    return {
      ok: false,
      message: "Selected scan packet is no longer awaiting exchange.",
      state: nextState,
    };
  }

  scanResult.status = "submitted";
  scanResult.submittedAt = toIso(time);

  const wallet = getWallet(nextState);
  if (scanResult.mtcAwarded > 0) {
    wallet.balance += scanResult.mtcAwarded;
    wallet.updatedAt = toIso(time);
    nextState.mtcLedger.push({
      id: makeId("mtc-ledger"),
      walletId: wallet.id,
      riderId: RIDER_ID,
      amount: scanResult.mtcAwarded,
      reason: "t1_scan_submission",
      scanResultId: scanResult.id,
      createdAt: toIso(time),
    });
  }

  return {
    ok: true,
    message:
      scanResult.mtcAwarded > 0
        ? `Scan packet submitted. Standing was already credited on completion; exchange added ${scanResult.mtcAwarded} MTC.`
        : "Scan packet submitted. Standing was already credited on completion; no MTC was issued for this T1 result.",
    state: nextState,
  };
}

export function getSimulationView(
  state: SimulationState,
  time: number,
): SimulationView {
  const standing = getStandingRecord(state);
  const standingTier = getStandingTierForValue(state, standing.totalStanding);
  const wallet = getWallet(state);
  const corpInventory = getCorpInventoryEntry(state);
  const stationResources = {
    felspar: getResourceBalance(state, "felspar").availableUnits,
    platinum: getResourceBalance(state, "platinum").availableUnits,
  };
  const recipeRequirements = getRecipeRequirements(state);
  const withdrawalsUsed = getTodaysWithdrawalCount(state, time);
  const riderReadySatelliteCount = state.riderInventory.filter(
    (entry) => entry.riderId === RIDER_ID && entry.status === "ready",
  ).length;
  const riderExpiredSatelliteCount = state.riderInventory.filter(
    (entry) => entry.riderId === RIDER_ID && entry.status === "expired",
  ).length;
  const activeCraftJobs = state.corporationCraftingJobs
    .filter((entry) => entry.status === "queued")
    .sort(
      (left, right) =>
        parseTime(left.completesAt) - parseTime(right.completesAt),
    )
    .map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      remainingSeconds: Math.max(
        0,
        Math.ceil((parseTime(entry.completesAt) - time) / 1000),
      ),
    }));

  const systemMap = new Map(
    state.systems.map((entry) => [entry.id, entry.label]),
  );
  const targetMap = new Map(
    state.scanTargets.map((entry) => [entry.id, entry]),
  );

  const activeDeployment = state.satelliteDeployments
    .filter((entry) => entry.riderId === RIDER_ID && entry.status === "active")
    .sort(
      (left, right) =>
        parseTime(left.completesAt) - parseTime(right.completesAt),
    )[0];

  const activeDeploymentView = activeDeployment
    ? (() => {
        const target = targetMap.get(activeDeployment.targetId);
        if (!target) {
          return null;
        }

        return {
          id: activeDeployment.id,
          targetId: target.id,
          targetLabel: target.label,
          systemLabel: systemMap.get(target.systemId) ?? "Unknown System",
          remainingSeconds: Math.max(
            0,
            Math.ceil((parseTime(activeDeployment.completesAt) - time) / 1000),
          ),
          standingReward: target.standingReward,
          mtcReward: target.mtcReward,
        };
      })()
    : null;

  const pendingResults = state.scanResults
    .filter(
      (entry) => entry.riderId === RIDER_ID && entry.status === "captured",
    )
    .sort(
      (left, right) =>
        parseTime(right.completedAt) - parseTime(left.completedAt),
    )
    .map((entry) => ({
      id: entry.id,
      targetLabel: targetMap.get(entry.targetId)?.label ?? "Unknown Target",
      standingAwarded: entry.standingAwarded,
      mtcAwarded: entry.mtcAwarded,
      completedAt: entry.completedAt,
    }));

  const availableTargets = state.scanTargets
    .filter((entry) => entry.active)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      systemLabel: systemMap.get(entry.systemId) ?? "Unknown System",
      scanDurationSeconds: entry.scanDurationSeconds,
      standingReward: entry.standingReward,
      mtcReward: entry.mtcReward,
    }));

  return {
    corpPoolCount: corpInventory.quantity,
    queuedCraftCount: activeCraftJobs.reduce(
      (total, entry) => total + entry.quantity,
      0,
    ),
    activeCraftJobs,
    stationResources,
    recipeRequirements,
    standing: standing.totalStanding,
    standingTierLabel: standingTier.label,
    standingTierCode: standingTier.code,
    withdrawalLimit: standingTier.dailyWithdrawalLimit,
    withdrawalsUsed,
    withdrawalsRemaining: Math.max(
      0,
      standingTier.dailyWithdrawalLimit - withdrawalsUsed,
    ),
    riderReadySatelliteCount,
    riderExpiredSatelliteCount,
    mtcBalance: wallet.balance,
    activeDeployment: activeDeploymentView,
    pendingResults,
    pendingResultCount: pendingResults.length,
    availableTargets,
    standingTiers: [...state.standingTiers]
      .sort((left, right) => left.minimumStanding - right.minimumStanding)
      .map((tier) => ({
        id: tier.id,
        label: tier.label,
        minimumStanding: tier.minimumStanding,
        dailyWithdrawalLimit: tier.dailyWithdrawalLimit,
        isCurrent: tier.id === standingTier.id,
      })),
  };
}
