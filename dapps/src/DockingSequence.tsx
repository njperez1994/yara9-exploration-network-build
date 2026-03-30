import { Text } from "@radix-ui/themes";

type DockingSequenceProps = {
  visible: boolean;
  messages: string[];
  currentStep: number;
  isOpeningGate: boolean;
  errorMessage: string | null;
  onClose: () => void;
};

export function DockingSequence({
  visible,
  messages,
  currentStep,
  isOpeningGate,
  errorMessage,
  onClose,
}: DockingSequenceProps) {
  if (!visible) return null;

  return (
    <div className="docking-overlay" role="dialog" aria-modal="true">
      <div className="docking-panel">
        <Text className="kicker">Docking Sequence</Text>

        <div className={`station-gate ${isOpeningGate ? "opening" : ""}`}>
          <div className="gate-door left" />
          <div className="gate-door right" />
          <div className="gate-core" />
        </div>

        <div className="terminal-log">
          {messages.map((message, index) => {
            const state =
              index < currentStep
                ? "done"
                : index === currentStep
                  ? "active"
                  : "idle";

            return (
              <p key={message} className={`terminal-line ${state}`}>
                {message}
              </p>
            );
          })}
        </div>

        {errorMessage ? (
          <>
            <Text className="status-chip error">{errorMessage}</Text>
            <button className="wallet-button" onClick={onClose}>
              Close
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
