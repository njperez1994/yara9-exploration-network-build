import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { MACANA_TARGETS, MACANA_TARGETS_BY_ID, type MacanaTarget } from "../_shared/targets.ts";

declare const Deno: {
    env: {
        get(name: string): string | undefined;
    };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type RiderRole = "normal" | "owner";

type LoopAction =
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

type MccRow = {
    id: string;
    lux_balance: number;
    mtc_treasury_balance: number;
};

type RiderRow = {
    id: string;
    rider_name: string;
    wallet_address: string;
    role: RiderRole;
    standing_points: number;
    mtc_balance: number;
    total_scan_points: number;
};

type ProbeInventoryRow = {
    id: string;
    probe_tier: "T1" | "T2";
    quantity: number;
};

type QuotaRow = {
    id: string;
    quota_limit: number;
    quota_used: number;
};

const PENDING_SCAN_NOTE = "scan_pending";
const FINALIZED_SCAN_NOTE = "scan_finalized";

const jsonHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
};

function json(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status,
        headers: jsonHeaders,
    });
}

function normaliseWalletAddress(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

function requireEnv(name: string) {
    const value = Deno.env.get(name);
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getQuotaLimit(standingPoints: number) {
    if (standingPoints >= 250) {
        return 15;
    }

    if (standingPoints >= 100) {
        return 10;
    }

    return 5;
}

function createRiderName(walletAddress: string) {
    return `Rider ${walletAddress.slice(2, 8).toUpperCase()}`;
}

function createVariance(seed: string) {
    const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return ((total % 11) - 5) / 10;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function duplicatePenaltyForRank(rank: number) {
    if (rank <= 1) {
        return 1;
    }

    if (rank === 2) {
        return 0.6;
    }

    return 0.3;
}

function targetResultValue(target: MacanaTarget) {
    return target.rarity === "rare" ? "rare_data" : "common_data";
}

function targetBodyTypeValue(target: MacanaTarget) {
    return target.rarity === "rare" ? "moon" : "planet";
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === "object" && "message" in error) {
        const message = Reflect.get(error, "message");
        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return "Macana backend failure.";
}

function isMissingSchemaFieldError(error: unknown) {
    const message = getErrorMessage(error);
    return (
        message.includes("Could not find the") ||
        message.includes("schema cache") ||
        message.includes("column")
    );
}

async function ensureMcc(service: ReturnType<typeof createClient>) {
    const { data: existing, error } = await service
        .from("mcc")
        .select("id, lux_balance, mtc_treasury_balance")
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (existing) {
        return existing as MccRow;
    }

    const { data, error: insertError } = await service
        .from("mcc")
        .insert({
            name: "Macana Commerce Center",
            lux_balance: 12480,
            mtc_treasury_balance: 250000,
        })
        .select("id, lux_balance, mtc_treasury_balance")
        .single();

    if (insertError) {
        throw insertError;
    }

    return data as MccRow;
}

async function ensureRider(
    service: ReturnType<typeof createClient>,
    mccId: string,
    walletAddress: string,
    ownerWallet: string
) {
    // Wallet registration currently happens lazily on first station access.
    // When EVE Vault login is wired in, this path should continue to create the
    // rider row, but the wallet address must come from verified session claims.
    const { data: existing, error } = await service
        .from("riders")
        .select(
            "id, rider_name, wallet_address, role, standing_points, mtc_balance, total_scan_points"
        )
        .eq("wallet_address", walletAddress)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (existing) {
        return existing as RiderRow;
    }

    const role: RiderRole = walletAddress === ownerWallet ? "owner" : "normal";
    const { data, error: insertError } = await service
        .from("riders")
        .insert({
            mcc_id: mccId,
            rider_name: createRiderName(walletAddress),
            wallet_address: walletAddress,
            role,
            standing_points: 80,
            mtc_balance: 0,
            total_scan_points: 0,
        })
        .select(
            "id, rider_name, wallet_address, role, standing_points, mtc_balance, total_scan_points"
        )
        .single();

    if (insertError) {
        throw insertError;
    }

    return data as RiderRow;
}

async function ensureLicense(service: ReturnType<typeof createClient>, riderId: string) {
    const { data: existing, error } = await service
        .from("rider_licenses")
        .select("id")
        .eq("rider_id", riderId)
        .eq("tier", "T1")
        .eq("status", "active")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (existing) {
        return;
    }

    const { error: insertError } = await service.from("rider_licenses").insert({
        rider_id: riderId,
        tier: "T1",
        status: "active",
        notes: "Bootstrap access for the Macana MVP scan loop.",
    });

    if (insertError) {
        throw insertError;
    }
}

async function ensureProbeInventory(service: ReturnType<typeof createClient>, riderId: string) {
    const { error } = await service.from("rider_probe_inventory").upsert(
        [
            { rider_id: riderId, probe_tier: "T1", quantity: 0 },
            { rider_id: riderId, probe_tier: "T2", quantity: 0 },
        ],
        {
            onConflict: "rider_id,probe_tier",
            ignoreDuplicates: true,
        }
    );

    if (error) {
        throw error;
    }
}

async function ensureQuota(service: ReturnType<typeof createClient>, rider: RiderRow) {
    const quotaDate = getTodayDate();
    const quotaLimit = getQuotaLimit(rider.standing_points);

    const { data: existing, error } = await service
        .from("rider_daily_t1_quota")
        .select("id, quota_limit, quota_used")
        .eq("rider_id", rider.id)
        .eq("quota_date", quotaDate)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (existing) {
        if (existing.quota_limit !== quotaLimit) {
            const { error: updateError } = await service
                .from("rider_daily_t1_quota")
                .update({ quota_limit: quotaLimit })
                .eq("id", existing.id);

            if (updateError) {
                throw updateError;
            }

            return { ...(existing as QuotaRow), quota_limit: quotaLimit };
        }

        return existing as QuotaRow;
    }

    const { data, error: insertError } = await service
        .from("rider_daily_t1_quota")
        .insert({
            rider_id: rider.id,
            quota_date: quotaDate,
            quota_limit: quotaLimit,
            quota_used: 0,
        })
        .select("id, quota_limit, quota_used")
        .single();

    if (insertError) {
        throw insertError;
    }

    return data as QuotaRow;
}

async function ensureBudget(service: ReturnType<typeof createClient>, mcc: MccRow) {
    const budgetDate = getTodayDate();
    const { data, error } = await service
        .from("daily_mtc_budgets")
        .upsert(
            {
                mcc_id: mcc.id,
                budget_date: budgetDate,
                net_lux_performance: mcc.lux_balance,
                mint_budget_mtc: 500,
                policy_name: "macana-default-policy",
                policy_snapshot: {
                    standingThresholds: { low: 5, medium: 10, high: 15 },
                    duplicateWindow: { first: 1, second: 0.6, later: 0.3 },
                },
            },
            {
                onConflict: "mcc_id,budget_date",
            }
        )
        .select("id, total_accepted_reward_points, mint_budget_mtc")
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function ensureRiderContext(
    service: ReturnType<typeof createClient>,
    walletAddress: string,
    ownerWallet: string
) {
    const mcc = await ensureMcc(service);
    const rider = await ensureRider(service, mcc.id, walletAddress, ownerWallet);
    await ensureLicense(service, rider.id);
    await ensureProbeInventory(service, rider.id);
    const quota = await ensureQuota(service, rider);
    const budget = await ensureBudget(service, mcc);

    return { mcc, rider, quota, budget };
}

async function loadProbeInventory(service: ReturnType<typeof createClient>, riderId: string) {
    const { data, error } = await service
        .from("rider_probe_inventory")
        .select("id, probe_tier, quantity")
        .eq("rider_id", riderId);

    if (error) {
        throw error;
    }

    const entries = (data ?? []) as ProbeInventoryRow[];
    const t1 = entries.find((entry) => entry.probe_tier === "T1")?.quantity ?? 0;
    const t2 = entries.find((entry) => entry.probe_tier === "T2")?.quantity ?? 0;

    return { t1, t2 };
}

async function finalizeCompletedScans(service: ReturnType<typeof createClient>, riderId: string) {
    const { data: scans, error } = await service
        .from("scan_events")
        .select("id, source_target_id, scan_duration_seconds, created_at, random_variance, result")
        .eq("rider_id", riderId)
        .eq("notes", PENDING_SCAN_NOTE)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    const now = Date.now();

    for (const scan of scans ?? []) {
        const completesAt = new Date(scan.created_at).getTime() + scan.scan_duration_seconds * 1000;
        if (completesAt > now) {
            continue;
        }

        const target = MACANA_TARGETS_BY_ID.get(scan.source_target_id);
        if (!target) {
            const { error: updateError } = await service
                .from("scan_events")
                .update({
                    result: "failed",
                    notes: FINALIZED_SCAN_NOTE,
                })
                .eq("id", scan.id);

            if (updateError) {
                throw updateError;
            }

            continue;
        }

        const qualityScore = clamp(
            Math.round(target.baseQuality + Number(scan.random_variance ?? 0) * 10),
            1,
            100
        );
        const rawSignalStrength = Number(
            (target.signalStrength + Number(scan.random_variance ?? 0) / 10).toFixed(3)
        );

        const { error: updateError } = await service
            .from("scan_events")
            .update({
                result: targetResultValue(target),
                quality_score: qualityScore,
                raw_signal_strength: rawSignalStrength,
                notes: FINALIZED_SCAN_NOTE,
            })
            .eq("id", scan.id);

        if (updateError) {
            throw updateError;
        }

        const { data: existingItem, error: existingItemError } = await service
            .from("data_items")
            .select("id")
            .eq("scan_event_id", scan.id)
            .maybeSingle();

        if (existingItemError) {
            throw existingItemError;
        }

        if (!existingItem) {
            const { error: itemError } = await service.from("data_items").insert({
                scan_event_id: scan.id,
                owner_rider_id: riderId,
                source_target_id: target.id,
                rarity: target.rarity,
                quality_score: qualityScore,
                item_integrity: target.integrity,
                target_valid: true,
                metadata: {
                    targetLabel: target.label,
                    systemLabel: target.systemLabel,
                    brief: target.brief,
                    potentialStanding: target.potentialStanding,
                    potentialMtc: target.potentialMtc,
                },
                minted_from_scan_at: new Date(completesAt).toISOString(),
            });

            if (itemError) {
                throw itemError;
            }
        }
    }
}

async function getActiveScan(service: ReturnType<typeof createClient>, riderId: string) {
    const { data, error } = await service
        .from("scan_events")
        .select(
            "id, source_target_id, target_body_type, scan_duration_seconds, created_at, probe_tier"
        )
        .eq("rider_id", riderId)
        .eq("notes", PENDING_SCAN_NOTE)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    const target = MACANA_TARGETS_BY_ID.get(data.source_target_id);
    if (!target) {
        return null;
    }

    const completesAt = new Date(
        new Date(data.created_at).getTime() + data.scan_duration_seconds * 1000
    ).toISOString();

    return {
        id: data.id,
        targetId: target.id,
        targetLabel: target.label,
        systemLabel: target.systemLabel,
        targetBodyType: data.target_body_type,
        scanDurationSeconds: data.scan_duration_seconds,
        startedAt: data.created_at,
        completesAt,
        probeTier: data.probe_tier,
        potentialStanding: target.potentialStanding,
        potentialMtc: target.potentialMtc,
    };
}

async function getPendingDataItems(service: ReturnType<typeof createClient>, riderId: string) {
    const { data: items, error } = await service
        .from("data_items")
        .select("id, source_target_id, rarity, quality_score, item_integrity, created_at")
        .eq("owner_rider_id", riderId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    if (!items?.length) {
        return [];
    }

    const { data: redemptions, error: redemptionError } = await service
        .from("redemptions")
        .select("data_item_id")
        .in(
            "data_item_id",
            items.map((item) => item.id)
        );

    if (redemptionError) {
        throw redemptionError;
    }

    const redeemedIds = new Set((redemptions ?? []).map((entry) => entry.data_item_id));

    return items
        .filter((item) => !redeemedIds.has(item.id))
        .map((item) => {
            const target = MACANA_TARGETS_BY_ID.get(item.source_target_id);

            return {
                id: item.id,
                targetId: item.source_target_id,
                targetLabel: target?.label ?? item.source_target_id,
                systemLabel: target?.systemLabel ?? "Unknown System",
                rarity: item.rarity,
                qualityScore: item.quality_score,
                itemIntegrity: item.item_integrity,
                createdAt: item.created_at,
                potentialStanding: target?.potentialStanding ?? 0,
                potentialMtc: target?.potentialMtc ?? 0,
            };
        });
}

async function loadLoopState(
    service: ReturnType<typeof createClient>,
    walletAddress: string,
    ownerWallet: string
) {
    const { mcc, rider, quota } = await ensureRiderContext(service, walletAddress, ownerWallet);

    await finalizeCompletedScans(service, rider.id);

    const inventory = await loadProbeInventory(service, rider.id);
    const pendingDataItems = await getPendingDataItems(service, rider.id);
    const activeScan = await getActiveScan(service, rider.id);

    return {
        station: {
            luxBalance: Number(mcc.lux_balance),
            mtcTreasuryBalance: Number(mcc.mtc_treasury_balance),
        },
        rider: {
            id: rider.id,
            riderName: rider.rider_name,
            walletAddress: rider.wallet_address,
            role: rider.role,
            standingPoints: rider.standing_points,
            mtcBalance: rider.mtc_balance,
            totalScanPoints: rider.total_scan_points,
        },
        quota: {
            quotaDate: getTodayDate(),
            limit: quota.quota_limit,
            used: quota.quota_used,
            remaining: Math.max(0, quota.quota_limit - quota.quota_used),
        },
        inventory,
        activeScan,
        pendingDataItems,
        availableTargets: MACANA_TARGETS.map((target) => ({
            id: target.id,
            label: target.label,
            systemLabel: target.systemLabel,
            targetBodyType: target.targetBodyType,
            brief: target.brief,
            scanDurationSeconds: target.scanDurationSeconds,
            potentialStanding: target.potentialStanding,
            potentialMtc: target.potentialMtc,
        })),
    };
}

async function claimT1ProbeAction(
    service: ReturnType<typeof createClient>,
    rider: RiderRow,
    quota: QuotaRow
) {
    if (quota.quota_used >= quota.quota_limit) {
        throw new Error(`Daily T1 claim quota reached. Current limit: ${quota.quota_limit}.`);
    }

    const { data: t1Inventory, error: inventoryError } = await service
        .from("rider_probe_inventory")
        .select("id, quantity")
        .eq("rider_id", rider.id)
        .eq("probe_tier", "T1")
        .single();

    if (inventoryError) {
        throw inventoryError;
    }

    const { error: updateInventoryError } = await service
        .from("rider_probe_inventory")
        .update({ quantity: t1Inventory.quantity + 1 })
        .eq("id", t1Inventory.id);

    if (updateInventoryError) {
        throw updateInventoryError;
    }

    const { error: updateQuotaError } = await service
        .from("rider_daily_t1_quota")
        .update({ quota_used: quota.quota_used + 1 })
        .eq("id", quota.id);

    if (updateQuotaError) {
        throw updateQuotaError;
    }
}

async function craftOwnerBatchAction(service: ReturnType<typeof createClient>, rider: RiderRow) {
    if (rider.role !== "owner") {
        throw new Error("Owner clearance required for backend T1 fabrication.");
    }

    const { data: t1Inventory, error: inventoryError } = await service
        .from("rider_probe_inventory")
        .select("id, quantity")
        .eq("rider_id", rider.id)
        .eq("probe_tier", "T1")
        .single();

    if (inventoryError) {
        throw inventoryError;
    }

    const { error: updateInventoryError } = await service
        .from("rider_probe_inventory")
        .update({ quantity: t1Inventory.quantity + 3 })
        .eq("id", t1Inventory.id);

    if (updateInventoryError) {
        throw updateInventoryError;
    }
}

async function startScanAction(
    service: ReturnType<typeof createClient>,
    rider: RiderRow,
    target: MacanaTarget
) {
    const { data: activeScan, error: activeScanError } = await service
        .from("scan_events")
        .select("id")
        .eq("rider_id", rider.id)
        .eq("notes", PENDING_SCAN_NOTE)
        .limit(1)
        .maybeSingle();

    if (activeScanError) {
        throw activeScanError;
    }

    if (activeScan) {
        throw new Error("A scan is already active for this rider.");
    }

    const { data: t1Inventory, error: inventoryError } = await service
        .from("rider_probe_inventory")
        .select("id, quantity")
        .eq("rider_id", rider.id)
        .eq("probe_tier", "T1")
        .single();

    if (inventoryError) {
        throw inventoryError;
    }

    if (t1Inventory.quantity < 1) {
        throw new Error("No T1 probes available. Claim or craft another probe first.");
    }

    const { data: insertedScan, error: insertError } = await service
        .from("scan_events")
        .insert({
            rider_id: rider.id,
            probe_tier: "T1",
            source_target_id: target.id,
            target_body_type: targetBodyTypeValue(target),
            scan_duration_seconds: target.scanDurationSeconds,
            interruption_flag: false,
            random_variance: createVariance(`${rider.wallet_address}:${target.id}`),
            result: targetResultValue(target),
            notes: PENDING_SCAN_NOTE,
        })
        .select("id")
        .single();

    if (insertError) {
        throw insertError;
    }

    const { error: updateInventoryError } = await service
        .from("rider_probe_inventory")
        .update({ quantity: t1Inventory.quantity - 1 })
        .eq("id", t1Inventory.id);

    if (updateInventoryError) {
        await service.from("scan_events").delete().eq("id", insertedScan.id);
        throw updateInventoryError;
    }
}

async function redeemDataItemAction(
    service: ReturnType<typeof createClient>,
    mcc: MccRow,
    rider: RiderRow,
    budget: { id: string; total_accepted_reward_points: number; mint_budget_mtc: number },
    dataItemId: string
) {
    const { data: dataItem, error } = await service
        .from("data_items")
        .select("id, source_target_id, quality_score, item_integrity, target_valid, created_at")
        .eq("id", dataItemId)
        .eq("owner_rider_id", rider.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!dataItem) {
        throw new Error("Selected data item is not available for this rider.");
    }

    const { data: existingRedemption, error: redemptionError } = await service
        .from("redemptions")
        .select("id")
        .eq("data_item_id", dataItem.id)
        .maybeSingle();

    if (redemptionError) {
        throw redemptionError;
    }

    if (existingRedemption) {
        throw new Error("This data item has already been redeemed.");
    }

    const target = MACANA_TARGETS_BY_ID.get(dataItem.source_target_id);
    if (!target) {
        throw new Error("Missing target definition for this data item.");
    }

    const { data: peerItems, error: peerItemsError } = await service
        .from("data_items")
        .select("id")
        .eq("source_target_id", dataItem.source_target_id);

    if (peerItemsError) {
        throw peerItemsError;
    }

    const peerItemIds = (peerItems ?? []).map((item) => item.id);
    let duplicateRank = 1;
    if (peerItemIds.length > 0) {
        const { data: acceptedRedemptions, error: acceptedError } = await service
            .from("redemptions")
            .select("id")
            .in("data_item_id", peerItemIds)
            .eq("status", "accepted")
            .gte("processed_at", `${getTodayDate()}T00:00:00.000Z`);

        if (acceptedError) {
            throw acceptedError;
        }

        duplicateRank = (acceptedRedemptions?.length ?? 0) + 1;
    }

    const duplicatePenalty = duplicatePenaltyForRank(duplicateRank);
    const qualityMultiplier = Number(
        Math.max(0.7, dataItem.quality_score / target.baseQuality).toFixed(2)
    );
    const freshnessHours =
        (Date.now() - new Date(dataItem.created_at).getTime()) / (1000 * 60 * 60);
    const freshnessMultiplier = freshnessHours <= 12 ? 1 : 0.85;
    const integrityValid = dataItem.item_integrity >= 50;
    const targetValid = Boolean(dataItem.target_valid);
    const freshnessValid = freshnessHours <= 48;
    const accepted = targetValid && integrityValid && freshnessValid;

    const rewardPoints = accepted
        ? Math.max(1, Math.round(target.potentialStanding * qualityMultiplier * duplicatePenalty))
        : 0;
    const mtcReward = accepted
        ? Math.max(0, Math.round(target.potentialMtc * qualityMultiplier * duplicatePenalty))
        : 0;
    const standingAwarded = accepted
        ? Math.max(1, Math.round(target.potentialStanding * duplicatePenalty))
        : 0;

    const rarityValue = target.rarity === "rare" ? 1.35 : target.rarity === "uncommon" ? 1.15 : 1;
    const primaryRedemptionPayload = {
        data_item_id: dataItem.id,
        rider_id: rider.id,
        budget_id: budget.id,
        status: accepted ? "accepted" : "rejected",
        target_valid: targetValid,
        integrity_valid: integrityValid,
        freshness_valid: freshnessValid,
        duplicate_rank: duplicateRank,
        duplicate_penalty: duplicatePenalty,
        rarity_multiplier: rarityValue,
        quality_multiplier: qualityMultiplier,
        tier_multiplier: 1,
        demand_multiplier: 1,
        freshness_multiplier: freshnessMultiplier,
        reward_points: rewardPoints,
        mtc_reward: mtcReward,
        standing_points_awarded: standingAwarded,
        rejection_reason: accepted ? null : "Validation failed.",
    };

    let { error: insertRedemptionError } = await service
        .from("redemptions")
        .insert(primaryRedemptionPayload);

    if (insertRedemptionError && isMissingSchemaFieldError(insertRedemptionError)) {
        const fallbackRedemptionPayload = {
            data_item_id: dataItem.id,
            rider_id: rider.id,
            budget_id: budget.id,
            status: accepted ? "accepted" : "rejected",
            ownership_valid: true,
            integrity_valid: integrityValid,
            age_window_valid: freshnessValid,
            target_valid: targetValid,
            duplicate_window_valid: true,
            anti_spam_valid: true,
            duplicate_rank: duplicateRank,
            duplicate_penalty: duplicatePenalty,
            rarity_base: rarityValue,
            quality_mult: qualityMultiplier,
            tier_mult: 1,
            demand_mult: 1,
            freshness_mult: freshnessMultiplier,
            reward_points: rewardPoints,
            mtc_reward: mtcReward,
            standing_points_awarded: standingAwarded,
            rejection_reason: accepted ? null : "Validation failed.",
        };

        ({ error: insertRedemptionError } = await service
            .from("redemptions")
            .insert(fallbackRedemptionPayload));
    }

    if (insertRedemptionError) {
        throw insertRedemptionError;
    }

    if (accepted) {
        const { error: riderUpdateError } = await service
            .from("riders")
            .update({
                mtc_balance: rider.mtc_balance + mtcReward,
                standing_points: rider.standing_points + standingAwarded,
                total_scan_points: rider.total_scan_points + rewardPoints,
            })
            .eq("id", rider.id);

        if (riderUpdateError) {
            throw riderUpdateError;
        }

        const { error: budgetUpdateError } = await service
            .from("daily_mtc_budgets")
            .update({
                total_accepted_reward_points: budget.total_accepted_reward_points + rewardPoints,
            })
            .eq("id", budget.id);

        if (budgetUpdateError) {
            throw budgetUpdateError;
        }

        const { error: mccUpdateError } = await service
            .from("mcc")
            .update({
                mtc_treasury_balance: Math.max(0, Number(mcc.mtc_treasury_balance) - mtcReward),
            })
            .eq("id", mcc.id);

        if (mccUpdateError) {
            throw mccUpdateError;
        }
    }

    return {
        accepted,
        mtcReward,
        standingAwarded,
    };
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const action = (await request.json()) as LoopAction;
        const walletAddress = normaliseWalletAddress(action.walletAddress);
        if (!walletAddress) {
            return json(400, { ok: false, message: "walletAddress is required." });
        }

        const supabaseUrl = requireEnv("SUPABASE_URL");
        const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
        const ownerWallet = normaliseWalletAddress(Deno.env.get("OWNER_WALLET"));

        const service = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        const { mcc, rider, quota, budget } = await ensureRiderContext(
            service,
            walletAddress,
            ownerWallet
        );

        let message = "Macana state synced.";

        switch (action.action) {
            case "get_state":
                break;
            case "claim_t1_probe":
                await claimT1ProbeAction(service, rider, quota);
                message = "T1 probe claimed. Rider inventory updated in Supabase.";
                break;
            case "craft_owner_batch":
                await craftOwnerBatchAction(service, rider);
                message = "Owner T1 batch issued. Three probes were added to inventory.";
                break;
            case "start_scan": {
                const target = MACANA_TARGETS_BY_ID.get(action.targetId);
                if (!target) {
                    return json(400, { ok: false, message: "Unknown Macana scan target." });
                }

                await startScanAction(service, rider, target);
                message = `${target.label} locked. Backend scan timer is now active.`;
                break;
            }
            case "redeem_data_item": {
                const redemption = await redeemDataItemAction(
                    service,
                    mcc,
                    rider,
                    budget,
                    action.dataItemId
                );
                message = redemption.accepted
                    ? `Data item redeemed. Standing +${redemption.standingAwarded}, MTC +${redemption.mtcReward}.`
                    : "Data item rejected by backend validation.";
                break;
            }
            default:
                return json(400, { ok: false, message: "Unsupported Macana action." });
        }

        const state = await loadLoopState(service, walletAddress, ownerWallet);
        return json(200, { ok: true, message, state });
    } catch (error) {
        const message = getErrorMessage(error);
        return json(500, { ok: false, message });
    }
});
