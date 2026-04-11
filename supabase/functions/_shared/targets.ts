export type MacanaTarget = {
    id: string;
    label: string;
    systemLabel: string;
    targetBodyType: string;
    brief: string;
    scanDurationSeconds: number;
    potentialStanding: number;
    potentialMtc: number;
    rarity: string;
    baseQuality: number;
    signalStrength: number;
    integrity: number;
};

export const MACANA_TARGETS: MacanaTarget[] = [
    {
        id: "target-perimeter-echo",
        label: "Perimeter Echo Cluster",
        systemLabel: "Halo-7 Fringe",
        targetBodyType: "ore_pocket",
        brief: "Low-risk fringe sweep with standing-heavy output.",
        scanDurationSeconds: 12,
        potentialStanding: 35,
        potentialMtc: 0,
        rarity: "common",
        baseQuality: 68,
        signalStrength: 0.72,
        integrity: 88,
    },
    {
        id: "target-relay-wreck",
        label: "Relay Wreck Envelope",
        systemLabel: "Transfer Lattice-3",
        targetBodyType: "relay_wreck",
        brief: "Recovered relay shards with balanced standing and MTC output.",
        scanDurationSeconds: 18,
        potentialStanding: 45,
        potentialMtc: 4,
        rarity: "uncommon",
        baseQuality: 79,
        signalStrength: 0.84,
        integrity: 91,
    },
    {
        id: "target-yara-trace",
        label: "YARA-9 Signal Fringe",
        systemLabel: "YARA-9 Outer Belt",
        targetBodyType: "signal_trace",
        brief: "High-value trace with stronger MTC upside and duplicate decay.",
        scanDurationSeconds: 24,
        potentialStanding: 60,
        potentialMtc: 6,
        rarity: "rare",
        baseQuality: 90,
        signalStrength: 0.93,
        integrity: 95,
    },
];

export const MACANA_TARGETS_BY_ID = new Map(MACANA_TARGETS.map((target) => [target.id, target]));
