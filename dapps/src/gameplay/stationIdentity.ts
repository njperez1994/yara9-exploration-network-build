export type StationIdentityMode = "demo" | "wallet" | "eve_vault";

export type StationIdentity = {
  authMode: StationIdentityMode;
  connectedWalletAddress: string | null;
  resolvedWalletAddress: string;
  isDemoIdentity: boolean;
};

export const DEMO_WALLET_ADDRESS = "demo-rider-bx04";

export function resolveStationIdentity(
  connectedWalletAddress: string | null,
): StationIdentity {
  const normalizedWalletAddress = connectedWalletAddress?.trim() || null;

  // The station always works with a resolved wallet string so the current demo
  // loop keeps running. When EVE Vault login lands, this helper becomes the
  // single place where verified session claims can replace the demo fallback.
  return {
    authMode: normalizedWalletAddress ? "wallet" : "demo",
    connectedWalletAddress: normalizedWalletAddress,
    resolvedWalletAddress: normalizedWalletAddress ?? DEMO_WALLET_ADDRESS,
    isDemoIdentity: normalizedWalletAddress === null,
  };
}
