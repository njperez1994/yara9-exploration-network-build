import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type RiderRole = "normal" | "owner";

export type MacanaLoopState = {
  station: {
    luxBalance: number;
    mtcTreasuryBalance: number;
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
      action: "claim_t1_probe";
      walletAddress: string;
    }
  | {
      action: "craft_owner_batch";
      walletAddress: string;
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
    throw new Error(error.message || "Macana backend request failed.");
  }

  const result = data as MacanaActionResult | { ok: false; message: string };
  if (!result.ok || !("state" in result)) {
    throw new Error(result.message || "Macana backend request failed.");
  }

  return result;
}

export function fetchMacanaState(walletAddress: string) {
  return invokeMacanaLoop({ action: "get_state", walletAddress });
}

export function claimT1Probe(walletAddress: string) {
  return invokeMacanaLoop({ action: "claim_t1_probe", walletAddress });
}

export function craftOwnerProbeBatch(walletAddress: string) {
  return invokeMacanaLoop({ action: "craft_owner_batch", walletAddress });
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
