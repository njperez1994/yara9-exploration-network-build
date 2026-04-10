# DB_RULES.md
## Macana Commerce Center / Hackathon Data Model Rules

----------------------------------------
PURPOSE
----------------------------------------

This file defines the gameplay simulation layer for the hackathon build.

The current goal is NOT full on-chain execution of the loop.
The goal is to simulate the intended station economy and rider progression using a database-backed system that can later be migrated or partially connected to Sui / Move contracts.

----------------------------------------
CORE GAMEPLAY LOOP
----------------------------------------

Macana Commerce Center operates this gameplay loop:

1. Macana Corp holds a pool of station resources
2. Macana Corp crafts T1 satellites using its own resources
3. Crafted T1 satellites are added to the corporation pool
4. Riders may withdraw T1 satellites from that pool for free
5. Withdrawal is limited by standing / faction relationship
6. Withdrawn T1 satellites become rider-owned
7. Each withdrawn T1 satellite has a 1-day usable lifetime
8. Riders deploy satellites on valid scan targets
9. Scans generate scan data and standing
10. T1 satellites generate little or no MTC directly
11. Standing unlocks future access, limits, and progression

----------------------------------------
IMPORTANT BUSINESS RULES
----------------------------------------

1. T1 satellites are free for riders
2. T1 satellites are not infinite
3. T1 satellites must come from Macana Corp inventory
4. Macana inventory is replenished through virtual crafting
5. Virtual crafting consumes station resources from Smart Storage snapshots or simulated station storage
6. Rider daily withdrawal limits are based on standing tier
7. Once withdrawn, a satellite belongs to the rider until:
   - deployed
   - expired
   - consumed
8. T1 satellite lifetime after withdrawal is 24 hours
9. T1 scan rewards are primarily standing, not MTC
10. MTC may be very rare or zero for T1 depending on balancing rules

----------------------------------------
DATA MODEL PHILOSOPHY
----------------------------------------

Separate the system into:
- corporation assets
- rider assets
- resources
- crafted items
- deployments
- scan outputs
- progression / standing

Do NOT collapse everything into a single inventory table.

----------------------------------------
REQUIRED CORE ENTITIES
----------------------------------------

1. riders
2. corporations
3. stations
4. resource_types
5. station_resource_balances
6. item_types
7. crafting_recipes
8. crafting_recipe_inputs
9. corporation_inventory
10. rider_inventory
11. systems
12. scan_targets
13. satellite_withdrawals
14. satellite_deployments
15. scan_results
16. rider_standing
17. standing_tiers
18. mtc_wallets
19. mtc_ledger

----------------------------------------
ENTITY INTENT
----------------------------------------

riders:
stores rider identity and wallet linkage

corporations:
stores Macana Corp and future organizations

stations:
stores station-level context, including Macana Commerce Center

station_resource_balances:
tracks resources available to the station for virtual crafting

item_types:
defines items such as T1 satellites

corporation_inventory:
tracks Macana-owned stock of crafted satellites and future items

rider_inventory:
tracks rider-owned satellites after withdrawal

satellite_withdrawals:
records when a rider takes a satellite from the corp pool

satellite_deployments:
records when a rider deploys a satellite

scan_results:
stores generated scan outputs and metadata

rider_standing:
tracks progression earned through T1 scanning activity

standing_tiers:
defines access levels and daily withdrawal caps

mtc_wallets / mtc_ledger:
keeps MTC economy structured even if T1 rarely produces MTC

----------------------------------------
PROGRESSION RULE
----------------------------------------

Standing is the main reward for T1 scanning.

Standing should control:
- daily T1 withdrawal cap
- future feature unlocks
- access to better systems / tools
- future licensing benefits

Do NOT make T1 primarily about MTC farming.

----------------------------------------
XNOVA GUIDANCE
----------------------------------------

The agent may use xNova-style browser game logic as inspiration for:
- production loops
- timed crafting
- inventory availability
- progression unlocks
- mission / deployment flow

But the implementation must be adapted to Macana’s station logic, not copied blindly.

Relevant xNova-style inspirations:
- resource consumption
- unit production
- ownership tracking
- timers
- progression-gated access

----------------------------------------
IMPLEMENTATION PRIORITY
----------------------------------------

The database must first support:
1. crafting T1 satellites into corp inventory
2. rider withdrawal with daily cap and expiration
3. deployment of T1 satellites
4. generation of scan results
5. standing gain from scan completion

Only after these are stable should the system expand further.

----------------------------------------
BLOCKCHAIN INTEGRATION RULE
----------------------------------------

Current implementation may simulate:
- resource consumption
- inventory changes
- standing gain
- scan reward generation

These systems should be designed so they can later be connected to:
- Smart Storage state
- Sui object state
- Move contract actions
- live Frontier APIs

Do NOT block the MVP on full blockchain correctness.

----------------------------------------
END OF FILE
----------------------------------------