export type RegisteredInventoryMaterial =
  | "felspar"
  | "platinum"
  | "circuits"
  | "salvaged";

export type RegisteredResource = {
  typeId: string;
  name: string;
  icon?: string;
  aliases: string[];
  inventoryMaterial?: RegisteredInventoryMaterial;
};

export const REGISTERED_RESOURCES: RegisteredResource[] = [
  {
    typeId: "77800",
    name: "Feldspar Crystals",
    icon: "/assets/resources/Feldspar Crystals.ico",
    aliases: ["feldspar crystals", "feldspar", "felspar crystals", "felspar"],
    inventoryMaterial: "felspar",
  },
  {
    typeId: "77801",
    name: "Nickel-Iron Veins",
    icon: "/assets/resources/Nickel-Iron Veins.ico",
    aliases: ["nickel-iron veins", "nickel iron veins"],
  },
  {
    typeId: "77803",
    name: "Silicon Dust",
    icon: "/assets/resources/Silicon Dust.ico",
    aliases: ["silicon dust"],
  },
  {
    typeId: "77805",
    name: "Platinum-Group Veins",
    icon: "/assets/resources/Platinum-Group Veins.ico",
    aliases: ["platinum-group veins", "platinum group veins"],
  },
  {
    typeId: "77810",
    name: "Platinum-Palladium Matrix",
    icon: "/assets/resources/Platinium-Palladium Matrix.ico",
    aliases: [
      "platinum-palladium matrix",
      "platinum palladium matrix",
      "platinumpalladium matrix",
      "platinum matrix",
      "platinum-matrix",
    ],
    inventoryMaterial: "platinum",
  },
  {
    typeId: "77811",
    name: "Hydrated Sulfide Matrix",
    icon: "/assets/resources/Hydrated Sulfide Matrix.ico",
    aliases: ["hydrated sulfide matrix"],
  },
  {
    typeId: "78423",
    name: "Water Ice",
    icon: "/assets/resources/Whater Ice.ico",
    aliases: ["water ice"],
  },
  {
    typeId: "78426",
    name: "Iridosmine Nodules",
    icon: "/assets/resources/Iridosmine Nodules.ico",
    aliases: ["iridosmine nodules"],
  },
  {
    typeId: "83839",
    name: "Salt",
    icon: "/assets/resources/Salt.ico",
    aliases: ["salt"],
  },
  {
    typeId: "84180",
    name: "Printed Circuits",
    icon: "/assets/resources/Printed Circuits.ico",
    aliases: ["printed circuit", "printed circuits"],
    inventoryMaterial: "circuits",
  },
  {
    typeId: "88235",
    name: "Feldspar Crystal Shards",
    icon: "/assets/resources/Silica Grains.ico",
    aliases: ["feldspar crystal shards", "felspar crystal shards"],
  },
  {
    typeId: "88335",
    name: "Fuel",
    aliases: ["fuel", "hydrogen fuel"],
  },
  {
    typeId: "88764",
    name: "Salvaged Materials",
    icon: "/assets/resources/Salvaged Materials.ico",
    aliases: ["salvaged material", "salvaged materials"],
    inventoryMaterial: "salvaged",
  },
  {
    typeId: "88765",
    name: "Mummified Clone",
    icon: "/assets/resources/Mummified Clone.ico",
    aliases: ["mummified clone"],
  },
  {
    typeId: "89258",
    name: "Hydrocarbon Residue",
    icon: "/assets/resources/Hydrocarbon Residue.ico",
    aliases: ["hydrocarbon residue"],
  },
  {
    typeId: "89259",
    name: "Silica Grains",
    icon: "/assets/resources/Silica Grains.ico",
    aliases: ["silica grains"],
  },
  {
    typeId: "89260",
    name: "Iron-Rich Nodules",
    icon: "/assets/resources/Iron-Rich Nodules.ico",
    aliases: ["iron-rich nodules", "iron rich nodules"],
  },
  {
    typeId: "99001",
    name: "Palladium",
    icon: "/assets/resources/Palladium.ico",
    aliases: ["palladium"],
  },
];

export const REGISTERED_RESOURCE_LABELS: Record<string, string> =
  Object.fromEntries(
    REGISTERED_RESOURCES.map((resource) => [resource.typeId, resource.name]),
  );

const REGISTERED_RESOURCES_BY_TYPE_ID = new Map(
  REGISTERED_RESOURCES.map((resource) => [resource.typeId, resource] as const),
);

export function normalizeRegisteredResourceName(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function getRegisteredResource(
  typeId: string,
  label?: string,
): RegisteredResource | null {
  const normalizedTypeId = typeId.trim();
  if (normalizedTypeId) {
    const byTypeId = REGISTERED_RESOURCES_BY_TYPE_ID.get(normalizedTypeId);
    if (byTypeId) {
      return byTypeId;
    }
  }

  if (!label) {
    return null;
  }

  const normalizedLabel = normalizeRegisteredResourceName(label);
  return (
    REGISTERED_RESOURCES.find((resource) =>
      [resource.name, ...resource.aliases].some(
        (candidate) =>
          normalizeRegisteredResourceName(candidate) === normalizedLabel,
      ),
    ) ?? null
  );
}

export function getRegisteredInventoryMaterial(
  typeId: string,
  label: string,
): RegisteredInventoryMaterial | null {
  return getRegisteredResource(typeId, label)?.inventoryMaterial ?? null;
}
