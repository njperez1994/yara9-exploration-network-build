import { useEffect, useState, type FormEvent } from "react";

type RidersViewProps = {
  riders: Array<{
    id: string;
    riderName: string;
    riderRole: "normal" | "owner";
    standingPoints: number;
    firstDockedAt: string;
    activeLicenses: {
      t1: number;
      t2: number;
      t3: number;
      total: number;
    };
  }>;
  registration?: {
    required: boolean;
    walletAddress: string;
    suggestedAlias: string | null;
  };
  registrationBusy?: boolean;
  onRegisterAlias?: (alias: string) => Promise<{
    ok: boolean;
    message: string;
  }>;
};

function formatDockedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RidersView({
  riders,
  registration,
  registrationBusy = false,
  onRegisterAlias,
}: RidersViewProps) {
  const [alias, setAlias] = useState(registration?.suggestedAlias ?? "");
  const [registrationNote, setRegistrationNote] = useState<{
    message: string;
    state: "active" | "error";
  } | null>(null);

  useEffect(() => {
    setAlias(registration?.suggestedAlias ?? "");
    setRegistrationNote(null);
  }, [registration?.suggestedAlias, registration?.required]);

  const ownerCount = riders.filter(
    (rider) => rider.riderRole === "owner",
  ).length;
  const activeLicenseCount = riders.reduce(
    (total, rider) => total + rider.activeLicenses.total,
    0,
  );

  const handleAliasSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registration?.required || !onRegisterAlias) {
      return;
    }

    const result = await onRegisterAlias(alias);
    setRegistrationNote({
      message: result.message,
      state: result.ok ? "active" : "error",
    });
  };

  return (
    <section className="module-view riders-view">
      <h2>Riders</h2>
      <p>
        Flight log of riders who have docked at Macana Commerce Center. Only
        non-sensitive registry data is exposed here: standing and active tier
        licenses.
      </p>

      <div className="module-grid opacity-70">
        {registration?.required ? (
          <article className="module-card exchange-hero-card rider-registration-card">
            <div className="exchange-hero-header">
              <div>
                <p className="module-label">Station Intake</p>
                <h3>Register Rider Alias</h3>
              </div>
              <span className="signal-chip medium">ACCESS REQUIRED</span>
            </div>

            <p className="rider-registration-copy">
              This wallet has not been registered at Macana Commerce Center yet.
              Set your rider alias to finalize dock access and create your
              station profile.
            </p>

            <div className="kv-grid rider-registration-wallet">
              <p>Wallet</p>
              <p>{registration.walletAddress}</p>
              <p>Standing / MTC / Licenses</p>
              <p>0 / 0 / 0</p>
            </div>

            <form
              className="rider-registration-form"
              onSubmit={handleAliasSubmit}
            >
              <label htmlFor="rider-alias">Pilot Alias</label>
              <input
                id="rider-alias"
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                minLength={3}
                maxLength={24}
                autoComplete="nickname"
                placeholder="Enter rider alias"
                disabled={registrationBusy}
              />
              <button
                type="submit"
                disabled={registrationBusy || !alias.trim()}
              >
                {registrationBusy ? "Registering..." : "Register Alias"}
              </button>
            </form>

            {registrationNote ? (
              <p className={`craft-note ${registrationNote.state}`}>
                {registrationNote.message}
              </p>
            ) : null}
          </article>
        ) : null}

        <article className="module-card exchange-hero-card">
          <div className="exchange-hero-header">
            <div>
              <p className="module-label">Flight Registry</p>
              <h3>Docked Rider Ledger</h3>
            </div>
            <span className="signal-chip active">PRIVATE VIEW</span>
          </div>

          <div className="exchange-hero-metrics">
            <div className="exchange-metric-card">
              <span>Registered Riders</span>
              <strong>{riders.length}</strong>
              <small>all riders seen by station intake</small>
            </div>
            <div className="exchange-metric-card">
              <span>Owner Clearances</span>
              <strong>{ownerCount}</strong>
              <small>owner-grade records on file</small>
            </div>
            <div className="exchange-metric-card">
              <span>Active Licenses</span>
              <strong>{activeLicenseCount}</strong>
              <small>combined T1 to T3 access ledger</small>
            </div>
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Dock Book</p>
          <h3>Recorded Riders</h3>

          {riders.length === 0 ? (
            <p className="craft-note">No riders have docked at MCC yet.</p>
          ) : (
            <div
              className="rider-log-table"
              role="table"
              aria-label="Registered riders"
            >
              <div className="rider-log-row rider-log-row--head" role="row">
                <span role="columnheader">Rider</span>
                <span role="columnheader">Role</span>
                <span role="columnheader">Standing</span>
                <span role="columnheader">First Dock</span>
                <span role="columnheader">T1</span>
                <span role="columnheader">T2</span>
                <span role="columnheader">T3</span>
              </div>

              {riders.map((rider) => (
                <div key={rider.id} className="rider-log-row" role="row">
                  <strong role="cell">{rider.riderName}</strong>
                  <span role="cell">
                    {rider.riderRole === "owner" ? "Owner" : "Rider"}
                  </span>
                  <span role="cell">{rider.standingPoints}</span>
                  <span role="cell">{formatDockedAt(rider.firstDockedAt)}</span>
                  <span role="cell">{rider.activeLicenses.t1}</span>
                  <span role="cell">{rider.activeLicenses.t2}</span>
                  <span role="cell">{rider.activeLicenses.t3}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
