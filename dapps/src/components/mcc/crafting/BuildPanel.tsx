type BuildPanelProps = {
  activeItemLabel: string | null;
  timeLabel: string;
  message: string;
  queueCount: number;
  state: "idle" | "active" | "error" | "completed";
};

function panelTone(state: BuildPanelProps["state"]) {
  switch (state) {
    case "active":
      return "border-cyan-300/45 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]";
    case "error":
      return "border-red-400/40 text-red-200";
    case "completed":
      return "border-emerald-400/35 text-emerald-200";
    default:
      return "border-cyan-300/20 text-slate-100";
  }
}

export function BuildPanel({
  activeItemLabel,
  timeLabel,
  message,
  queueCount,
  state,
}: BuildPanelProps) {
  return (
    <div
      className={`w-full max-w-[220px] rounded-xl border bg-black/30 px-3 py-3 backdrop-blur-sm ${panelTone(
        state,
      )}`}
    >
      <div className="grid grid-cols-2 gap-1.5">
        <div className="px-1 py-[1px] text-center">
          <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-100/70">
            In Queue
          </div>
          <div className="mt-[1px] text-[12px] font-semibold tracking-[0.08em]">
            {queueCount}
          </div>
        </div>

        <div className="px-1 py-[1px] text-center">
          <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-100/70">
            Time
          </div>
          <div className="mt-[1px] text-[12px] font-semibold tracking-[0.08em]">
            {timeLabel}
          </div>
        </div>
      </div>

      <div className="mt-1 text-center text-[8px] uppercase tracking-[0.1em] text-cyan-50/75">
        {activeItemLabel ? `${activeItemLabel} · ${message}` : message}
      </div>
    </div>
  );
}
