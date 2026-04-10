# CONTEXT.md
## Current Working Context

----------------------------------------
PROJECT
----------------------------------------

Project name:
Macana Commerce Center

Hackathon target:
EVE Frontier × Sui Hackathon

Working strategy:
focus on one clear, polished utility flow instead of a large unfinished platform

----------------------------------------
CURRENT PRODUCT DIRECTION
----------------------------------------

Core demo loop:
Docking → Wallet/Auth → Station Shell → Scan Data Flow → Data Exchange → MTC Result

Main judging targets:
- Most Utility
- Best Live Frontier Integration
- possibly Most Creative through presentation quality

----------------------------------------
CURRENT STATUS
----------------------------------------

Completed or mostly completed:
- cinematic docking entry experience
- closed door layered system
- connection sequence text
- door opening animation
- sound-supported station reveal
- compact station shell with top banner and tab navigation
- live storage inventory read from Smart Storage Unit in the dapp
- on-chain T1 crafting extension plus TypeScript scripts for authorise/configure/craft/read availability

In progress:
- real wallet integration inside the docking flow
- replacing local React-only crafting/scan/reward state with on-chain transactions
- narrowing the station UI to the strongest 3-minute demo loop

Not yet locked:
- final Data Exchange interaction details
- final Sui object integration flow
- exact hackathon demo script
- exact on-chain representation of scan redemption and MTC result

----------------------------------------
TECHNICAL CONTEXT
----------------------------------------

Known environment:
- Sui testnet
- VITE_SUI_NETWORK=testnet
- VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
- active development has migrated from Windows to WSL Ubuntu because Sui tooling was more reliable there
- WSL should use Linux-native Node.js 24.13.0 for frontend work instead of Windows nvm/nvm4w wrappers

Known issue:
- in-game viewport is smaller than full web layout
- UI must prioritize compact mode and readability
- wallet/auth in the current dapp shell is still mostly mocked even though live storage reads and on-chain crafting support already exist

Important working rule:
- do not force broad UI migration unless necessary
- use current starter structure when possible

----------------------------------------
NEXT PRIORITIES
----------------------------------------

1. Finish station shell
2. Build strong Data Exchange module
3. Connect real wallet and on-chain actions inside the dapp loop
4. Prepare stable demo path

----------------------------------------
LATEST CHECKPOINT
----------------------------------------

Current repo checkpoint:
- latest pushed commit on main: `109810e` - `prepare WSL workspace for contract rebuild`
- GitHub remote confirmed working from WSL
- Vercel should now be able to read the current GitHub state

Environment checkpoint:
- WSL Ubuntu is now the primary development environment
- Linux-native Node.js 24.13.0 was installed in WSL for local frontend work
- dapp dependencies install correctly in WSL
- dapp production build completes successfully in WSL
- root TypeScript scripts type-check successfully in WSL
- `sui move test` for `move-contracts/storage_unit_extension` completes successfully

Open technical note:
- `dapps` lint is not yet wired for ESLint 9 because the repo does not currently include an `eslint.config.*` file
- `storage_unit_extension` lock/test cleanup was intentional to prepare for recompilation and further contract changes

Recommended resume point:
- start with real wallet integration inside the docking flow
- then connect `craft_t1_from_storage` and scan consumption into the dapp UI

----------------------------------------
REFERENCE REPOSITORIES
----------------------------------------

Official hackathon references to reuse as needed:
- https://github.com/evefrontier/world-contracts
- https://github.com/evefrontier/evevault
- https://github.com/evefrontier/builder-scaffold
- https://github.com/evefrontier/builder-documentation
- https://github.com/evefrontier/eve-frontier-proximity-zk-poc
- https://github.com/evefrontier/sui-go-sdk

Project repository:
- https://github.com/njperez1994/yara9-exploration-network-build.git

----------------------------------------
IF SESSION IS LOST
----------------------------------------

Before resuming work:
1. read ROADMAP.md
2. read AGENTS.md
3. read UI_RULES.md
4. read LORE.md
5. continue from the current highest-priority unfinished task

----------------------------------------
END OF FILE
----------------------------------------
