export type CraftingResource = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  available: boolean;
  availableAmount?: number;
};

export type CraftingItem = {
  id: string;
  name: string;
  tierLabel: string;
  image: string;
  cost: string;
  statusColor: "cyan" | "green" | "amber" | "red";
  statusLabel: string;
  buildTime: number;
  description: string;
  resources: CraftingResource[];
  requirements?: string[];
  canBuild: boolean;
  blockedReason?: string;
  buildAction: "live" | "mock";
};
