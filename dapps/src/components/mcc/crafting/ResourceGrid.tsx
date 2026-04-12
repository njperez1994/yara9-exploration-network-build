import { ResourceTooltip } from "./ResourceTooltip";
import type { CraftingResource } from "./types";

type ResourceGridProps = {
  resources: CraftingResource[];
};

export function ResourceGrid({ resources }: ResourceGridProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {resources.map((resource) => {
        const isRequired = resource.amount > 0;
        const showAsAvailable = isRequired && resource.available;

        return (
          <div
            key={resource.id}
            className={`group/resource relative flex min-h-[60px] flex-col items-center justify-center rounded-xl bg-slate-950/40 px-1 py-1.5 sm:min-h-[68px] sm:py-2 ${
              showAsAvailable ? "opacity-100" : "pointer-events-none opacity-35"
            }`}
          >
            {/* Recipe slots with amount 0 stay visible for layout consistency,
                but they render as inactive because that material is not part of
                the current tier recipe. */}
            <img
              src={resource.icon}
              alt={resource.name}
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
            <span
              className={`mt-1 text-[10px] font-semibold sm:text-[11px] ${
                showAsAvailable ? "text-cyan-100" : "text-red-300"
              }`}
            >
              {resource.amount}
            </span>
            {isRequired ? (
              <ResourceTooltip
                name={resource.name}
                amount={resource.amount}
                available={resource.available}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
