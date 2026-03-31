# AGENTS.md
## Macana Commerce Center / Hackathon Build Rules

This file defines how AI agents must operate in this project.

----------------------------------------
MISSION
----------------------------------------

This project is being built for the EVE Frontier × Sui Hackathon.

The goal is NOT to build a giant full-featured platform.
The goal is to deliver one focused, polished, believable system that can impress judges through:
- clear utility
- coherent UX
- immersive presentation
- real or credible live integration

Primary target:
Macana Commerce Center as a compact station hub for:
- rider access
- scan data intake
- data exchange
- value display in MTC

----------------------------------------
HACKATHON PRODUCT SCOPE
----------------------------------------

Agents must optimize for this core loop:

1. Rider enters through docking sequence
2. Wallet/session is connected
3. Station shell becomes visible
4. Rider can view scan-related data
5. Rider can submit / exchange scan data
6. UI shows resulting value or state update

Do NOT expand the project beyond this core loop unless explicitly requested.

----------------------------------------
DO NOT OVERBUILD
----------------------------------------

Avoid adding large incomplete systems such as:
- full marketplace logic
- deep crafting systems
- complex licensing flows
- unnecessary dashboards
- abstract architecture without visible demo value

Always prefer:
- fewer features
- higher polish
- stronger demo clarity

----------------------------------------
TECHNICAL WORKING RULE
----------------------------------------

Respect the current project stack first.

If the current starter uses existing CSS/components, do NOT force a migration unless explicitly requested.

Agents may:
- reuse the current UI kit
- adapt styles to fit Macana identity
- introduce better structure gradually

Do NOT create unnecessary migration work.

----------------------------------------
UI / UX PRINCIPLES
----------------------------------------

The UI must feel:
- industrial
- immersive
- technical
- functional
- compact enough to work inside in-game constraints

Avoid:
- generic SaaS layouts
- oversized desktop-only dashboards
- playful UI
- disconnected visual experiments

----------------------------------------
DOCKING RULE
----------------------------------------

Login is a docking protocol.

The docking sequence is part of the product identity and should remain a polished entry ritual.

----------------------------------------
STATE RULE
----------------------------------------

Always use explicit states.

Preferred examples:
- idle
- connectingWallet
- authenticating
- ready
- opening
- active
- error

----------------------------------------
COMPONENT RULE
----------------------------------------

Keep components modular and named by function.

Examples:
- DockingGate
- StationShell
- AccessPanel
- DataExchangePanel
- WalletStatusPanel
- ScanOverviewPanel

Avoid vague names like:
- Box
- Wrapper
- PanelOne

----------------------------------------
AGENT PRIORITIES
----------------------------------------

When generating work, prioritize in this order:

1. demo clarity
2. functional UX
3. in-game readability
4. visual consistency
5. code cleanliness
6. future extensibility

----------------------------------------
OUTPUT EXPECTATION
----------------------------------------

When responding with implementation work, agents should provide:
1. what feature is being built
2. what files are affected
3. complete code or precise patch
4. short explanation
5. next recommended step

----------------------------------------
MEMORY RULE
----------------------------------------

Before doing any new work, always read:
- CONTEXT.md
- ROADMAP.md
- LORE.md
- UI_RULES.md

If a task is completed, suggest how CONTEXT.md should be updated.

----------------------------------------
END OF FILE
----------------------------------------