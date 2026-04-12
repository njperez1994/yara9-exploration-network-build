import { CraftingCard } from "./CraftingCard";
import type { CraftingItem } from "./types";

type CraftingGridProps = {
  items: CraftingItem[];
  busyItemId: string | null;
  onBuild: (item: CraftingItem) => void;
};

export function CraftingGrid({
  items,
  busyItemId,
  onBuild,
}: CraftingGridProps) {
  return (
    <div className="grid mt-10 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
      {items.map((item) => (
        <CraftingCard
          key={item.id}
          item={item}
          busy={busyItemId === item.id}
          onBuild={onBuild}
        />
      ))}
    </div>
  );
}
