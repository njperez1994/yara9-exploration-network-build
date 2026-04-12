# EVE Vault Login Prep

## Purpose

This note captures the current auth boundary and the exact handoff needed for the next implementation step: a real station login backed by EVE Vault plus Supabase persistence.

## Current State

- The station shell currently resolves rider identity from a frontend wallet address.
- If no wallet is connected, the station falls back to `demo-rider-bx04` so the hackathon loop remains usable.
- `macana-loop` auto-registers a rider row in `public.riders` the first time a new wallet enters the station.
- The current trust boundary is still weak because the frontend submits `walletAddress` directly in the function payload.

## What Is Already Prepared

- `dapps/src/gameplay/stationIdentity.ts` centralizes station identity resolution.
- `StationShell` now consumes a `StationIdentity` object instead of raw wallet props.
- `WalletView` exposes the active auth path so demo mode and live auth are visually distinct.
- `macanaApi.ts` and `supabase/functions/macana-loop/index.ts` now mark the exact trust boundary that EVE Vault login must replace.
- `App.tsx` now gates station entry through CCP wallet discovery via `useConnection()`, which already supports both `Eve Vault` and `EVE Frontier Client Wallet`.

## Next Implementation Target

The next auth pass should do these things in order:

1. Use CCP/EVE Vault login tooling to authenticate the rider.
2. Derive a verified wallet identity from the authenticated session.
3. Attach that verified session to Supabase requests instead of trusting a raw wallet string from the client.
4. Keep `public.riders.wallet_address` as the canonical unique wallet field for station membership.
5. On first successful login, create or update the rider row in Supabase.

## Current UX Rule

- The station entry CTA should not branch on a manual "inside game vs outside game" detector.
- Instead, use CCP wallet discovery from `@evefrontier/dapp-kit`.
- If a compatible wallet is present, `handleConnect()` should be the only entry path.
- If no compatible wallet is present in an external browser, guide the rider to the EVE Vault extension release page, not only to the Eve Vault web app.

## Expected Touch Points

Frontend:

- `dapps/src/App.tsx`
- `dapps/src/gameplay/stationIdentity.ts`
- `dapps/src/gameplay/macanaApi.ts`
- `dapps/src/components/layout/StationShell.tsx`
- `dapps/src/components/mcc/views/WalletView.tsx`

Backend:

- `supabase/functions/macana-loop/index.ts`
- Supabase auth/session configuration
- rider registration policy around `public.riders`

## Database Notes

- Wallet registration is already modeled by `public.riders.wallet_address text not null unique`.
- For the next pass, prefer keeping wallet uniqueness in `riders` and deriving the rider row from verified auth rather than creating a separate duplicate wallet registry table unless CCP tooling requires it.
- If we later need auditability, add login metadata fields after the real auth flow is confirmed.

## Important Rule For The Next Step

Do not keep the current pattern where the frontend can impersonate any rider by posting an arbitrary wallet address to `macana-loop`.

The next login step should make the backend trust:

- verified EVE Vault session identity
- or Supabase session claims derived from that login

and not the raw request body alone.
