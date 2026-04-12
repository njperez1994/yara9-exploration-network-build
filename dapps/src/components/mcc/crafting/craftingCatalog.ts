import type { CraftingItem } from "./types";

type CraftingCatalogInput = {
  felspar: number;
  platinum: number;
  circuits: number;
  salvaged: number;
  riderRole: "normal" | "owner";
};

function hasRequiredResources(item: Pick<CraftingItem, "resources">) {
  // Amount 0 means the slot stays visible in the recipe UI but does not block
  // the build, so availability checks only apply to materials that are consumed.
  return item.resources.every((resource) =>
    resource.amount > 0 ? resource.available : true,
  );
}

export function buildCraftingCatalog({
  felspar,
  platinum,
  circuits,
  salvaged,
  riderRole,
}: CraftingCatalogInput): CraftingItem[] {
  // T1 stays visibly locked for non-owners so the demo communicates that
  // fabrication access belongs to the station owner role, not to every rider.
  const t1BlockedReason =
    riderRole !== "owner"
      ? "Owner access required to build T1"
      : felspar < 100 || platinum < 25
        ? "Insufficient resources"
        : undefined;

  const t1Resources = [
    {
      id: "felspar",
      name: "Felspar Crystals",
      icon: "/assets/resources/Feldspar Crystals.ico",
      amount: 100,
      available: felspar >= 100,
      availableAmount: felspar,
    },
    {
      id: "platinum",
      name: "Platinum-Matrix",
      icon: "/assets/resources/Platinium-Palladium Matrix.ico",
      amount: 25,
      available: platinum >= 25,
      availableAmount: platinum,
    },
    {
      id: "printed",
      name: "Printed Circuits",
      icon: "/assets/resources/Printed Circuits.ico",
      amount: 0,
      available: true,
      availableAmount: circuits,
    },
    {
      id: "salvaged",
      name: "Salvaged Materials",
      icon: "/assets/resources/Salvaged Materials.ico",
      amount: 0,
      available: true,
      availableAmount: salvaged,
    },
  ] as const;

  const t2Resources = [
    {
      id: "felspar",
      name: "Felspar Crystals",
      icon: "/assets/resources/Feldspar Crystals.ico",
      amount: 140,
      available: felspar >= 140,
      availableAmount: felspar,
    },
    {
      id: "platinum",
      name: "Platinum-Matrix",
      icon: "/assets/resources/Platinium-Palladium Matrix.ico",
      amount: 60,
      available: platinum >= 60,
      availableAmount: platinum,
    },
    {
      id: "printed",
      name: "Printed Circuits",
      icon: "/assets/resources/Printed Circuits.ico",
      amount: 10,
      available: circuits >= 10,
      availableAmount: circuits,
    },
    {
      id: "salvaged",
      name: "Salvaged Materials",
      icon: "/assets/resources/Salvaged Materials.ico",
      amount: 0,
      available: true,
      availableAmount: salvaged,
    },
  ] as const;

  const t3Resources = [
    {
      id: "felspar",
      name: "Felspar Crystals",
      icon: "/assets/resources/Feldspar Crystals.ico",
      amount: 220,
      available: felspar >= 220,
      availableAmount: felspar,
    },
    {
      id: "platinum",
      name: "Platinum-Matrix",
      icon: "/assets/resources/Platinium-Palladium Matrix.ico",
      amount: 90,
      available: platinum >= 90,
      availableAmount: platinum,
    },
    {
      id: "printed",
      name: "Printed Circuits",
      icon: "/assets/resources/Printed Circuits.ico",
      amount: 20,
      available: circuits >= 20,
      availableAmount: circuits,
    },
    {
      id: "salvaged",
      name: "Salvaged Materials",
      icon: "/assets/resources/Salvaged Materials.ico",
      amount: 6,
      available: salvaged >= 6,
      availableAmount: salvaged,
    },
  ] as const;

  const t2CanBuild = hasRequiredResources({ resources: [...t2Resources] });
  const t3CanBuild = hasRequiredResources({ resources: [...t3Resources] });

  return [
    {
      id: "t1-survey",
      name: "Survey Core Tier 1",
      tierLabel: "T1",
      image: "/assets/others/t1_licence.png",
      cost: "100 FE / 25 PM",
      statusColor: riderRole === "owner" ? "green" : "amber",
      statusLabel: riderRole === "owner" ? "Ready" : "Owner Locked",
      buildTime: 45 * 60,
      description:
        "Primary Macana industrial output for short-range survey routing. This is the only tier currently crafted by Macana Corporation by free for the Riders.",
      requirements: [
        "Owner-grade fabrication clearance",
        "Live Smart Storage intake",
        "Macana backend issuance",
      ],
      canBuild: t1BlockedReason === undefined,
      blockedReason: t1BlockedReason,
      buildAction: "live",
      resources: [...t1Resources],
    },
    {
      id: "t2-survey",
      name: "Survey Core Tier 2",
      tierLabel: "T2",
      image: "/assets/others/t2_licence.png",
      cost: "140 FE / 60 PM / 22 PC",
      statusColor: "cyan",
      statusLabel: "Mock Build",
      buildTime: 2 * 60 * 60 + 10 * 60,
      description:
        "Extended scan chassis for longer route stability. This is a visual mock tier used to establish the full industrial ladder for the module.",
      requirements: [
        "Tier-2 fabrication schema",
        "Printed circuit routing",
        "Mid-range station queue",
      ],
      canBuild: t2CanBuild,
      blockedReason: t2CanBuild ? undefined : "Insufficient resources",
      buildAction: "mock",
      resources: [...t2Resources],
    },
    {
      id: "t3-survey",
      name: "Survey Core Tier 3",
      tierLabel: "T3",
      image: "/assets/others/t3_licence.png",
      cost: "220 FE / 90 PM / 40 PC / 18 SM",
      statusColor: "cyan",
      statusLabel: "Mock Build",
      buildTime: 4 * 60 * 60 + 30 * 60,
      description:
        "Heavy industrial survey frame intended for deep-space data extraction. It completes the vertical visual progression of the station fabrication line.",
      requirements: [
        "Tier-3 lattice authorization",
        "Printed circuit stack",
        "Salvage consolidation feed",
      ],
      canBuild: t3CanBuild,
      blockedReason: t3CanBuild ? undefined : "Insufficient resources",
      buildAction: "mock",
      resources: [...t3Resources],
    },
  ];
}
