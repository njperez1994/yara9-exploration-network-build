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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4 sm:gap-5 xl:gap-6">
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
