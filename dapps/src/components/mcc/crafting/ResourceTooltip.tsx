type ResourceTooltipProps = {
  name: string;
  amount: number;
  available: boolean;
};

export function ResourceTooltip({
  name,
  amount,
  available,
}: ResourceTooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap border border-black px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] shadow-lg group-hover/resource:block">
      <span className="text-white">{name}:</span>{" "}
      <span className={available ? "text-emerald-300" : "text-red-300"}>
        {amount}
      </span>
    </div>
  );
}
