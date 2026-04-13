import {
  FunctionsHttpError,
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

export type RiderRole = "normal" | "owner";

export type MacanaLoopState = {
  station: {
    luxBalance: number;
    mtcTreasuryBalance: number;
  };
  registration: {
    required: boolean;
    walletAddress: string;
    suggestedAlias: string | null;
  };
  rider: {
    id: string;
    riderName: string;
    walletAddress: string;
    role: RiderRole;
    standingPoints: number;
    mtcBalance: number;
    totalScanPoints: number;
  };
  quota: {
    quotaDate: string;
    limit: number;
    used: number;
    remaining: number;
  };
  inventory: {
    t1: number;
    t2: number;
  };
  fabricationQueue: {
    jobs: Array<{
      id: string;
      itemId: string;
      itemLabel: string;
      buildAction: "live" | "mock";
      buildDurationSeconds: number;
      startedAt: string;
      readyAt: string;
    }>;
  };
  registeredRiders: Array<{
    id: string;
    riderName: string;
    riderRole: RiderRole;
    standingPoints: number;
    firstDockedAt: string;
    activeLicenses: {
      t1: number;
      t2: number;
      t3: number;
      total: number;
    };
  }>;
  activeScan: {
    id: string;
    targetId: string;
    targetLabel: string;
    systemLabel: string;
    targetBodyType: string;
    scanDurationSeconds: number;
    startedAt: string;
    completesAt: string;
    probeTier: "T1" | "T2";
    potentialStanding: number;
    potentialMtc: number;
  } | null;
  pendingDataItems: Array<{
    id: string;
    targetId: string;
    targetLabel: string;
    systemLabel: string;
    rarity: string;
    qualityScore: number;
    itemIntegrity: number;
    createdAt: string;
    potentialStanding: number;
    potentialMtc: number;
  }>;
  availableTargets: Array<{
    id: string;
    label: string;
    systemLabel: string;
    targetBodyType: string;
    brief: string;
    scanDurationSeconds: number;
    potentialStanding: number;
    potentialMtc: number;
  }>;
};

export type MacanaActionResult = {
  ok: boolean;
  message: string;
  state: MacanaLoopState;
};

type MacanaAction =
  | {
      action: "get_state";
      walletAddress: string;
    }
  | {
      action: "register_rider";
      walletAddress: string;
      riderAlias: string;
    }
  | {
      action: "claim_t1_probe";
      walletAddress: string;
    }
  | {
      action: "queue_build";
      walletAddress: string;
      itemId: string;
    }
  | {
      action: "start_scan";
      walletAddress: string;
      targetId: string;
    }
  | {
      action: "redeem_data_item";
      walletAddress: string;
      dataItemId: string;
    };

let browserClient: SupabaseClient | null = null;

async function getFunctionErrorMessage(error: unknown) {
  if (!(error instanceof FunctionsHttpError)) {
    return error instanceof Error
      ? error.message
      : "Macana backend request failed.";
  }

  try {
    const payload = (await error.context.json()) as { message?: string };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Fall through to the generic error text if the response body is not JSON.
  }

  return error.message || "Macana backend request failed.";
}

function normalizeLoopState(state: MacanaLoopState) {
  return {
    ...state,
    fabricationQueue: {
      jobs: state.fabricationQueue?.jobs ?? [],
    },
    registration: {
      required: state.registration?.required ?? false,
      walletAddress:
        state.registration?.walletAddress ?? state.rider?.walletAddress ?? "",
      suggestedAlias:
        state.registration?.suggestedAlias ?? state.rider?.riderName ?? null,
    },
    registeredRiders: state.registeredRiders ?? [],
  } satisfies MacanaLoopState;
}

function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_K ??
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase frontend configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_K (or VITE_SUPABASE_ANON_KEY).",
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
}

async function invokeMacanaLoop(action: MacanaAction) {
  const supabase = getSupabaseClient();

  // Current demo mode still sends the resolved wallet address in the payload.
  // The EVE Vault login step should replace this trust model by attaching a
  // verified rider session to the function call and deriving identity server-side.
  const { data, error } = await supabase.functions.invoke("macana-loop", {
    body: action,
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  const result = data as MacanaActionResult | { ok: false; message: string };
  if (!result.ok || !("state" in result)) {
    throw new Error(result.message || "Macana backend request failed.");
  }

  return {
    ...result,
    state: normalizeLoopState(result.state),
  };
}

export function fetchMacanaState(walletAddress: string) {
  return invokeMacanaLoop({ action: "get_state", walletAddress });
}

export function claimT1Probe(walletAddress: string) {
  return invokeMacanaLoop({ action: "claim_t1_probe", walletAddress });
}

export function registerRider(walletAddress: string, riderAlias: string) {
  return invokeMacanaLoop({
    action: "register_rider",
    walletAddress,
    riderAlias,
  });
}

export function queueFabricationBuild(walletAddress: string, itemId: string) {
  return invokeMacanaLoop({ action: "queue_build", walletAddress, itemId });
}

export function startScan(walletAddress: string, targetId: string) {
  return invokeMacanaLoop({ action: "start_scan", walletAddress, targetId });
}

export function redeemDataItem(walletAddress: string, dataItemId: string) {
  return invokeMacanaLoop({
    action: "redeem_data_item",
    walletAddress,
    dataItemId,
  });
}
