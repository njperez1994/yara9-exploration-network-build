# AGENTS.md
## Macana Commerce Center / YARA-9 Exploration Network

This file defines how AI agents (GPT-5.3, Copilot, etc.) must generate code for this project.

----------------------------------------
PROJECT IDENTITY
----------------------------------------

This is NOT a generic web app.

This project represents a sci-fi industrial ecosystem inspired by EVE Frontier:
- orbital stations
- satellite scanning
- resource extraction (YARA-9)
- economic exchange (MTC)

All UI must feel:
- immersive
- cinematic
- futuristic
- industrial

Avoid generic SaaS styles.

----------------------------------------
TECH STACK (MANDATORY)
----------------------------------------

- React (functional components)
- Tailwind CSS
- Framer Motion (animations)

----------------------------------------
GLOBAL UI PRINCIPLES
----------------------------------------

1. DARK MODE ONLY
   Background: black / charcoal

2. ACCENT COLORS
   - Orange: #f97316
   - Cyan: #22d3ee

3. DESIGN STYLE
   - Industrial panels
   - Framed sections (panels with borders)
   - Terminal-style text
   - Subtle glow effects
   - Grid-based layouts

4. NEVER USE:
   - Bright playful colors
   - Rounded "mobile app" styles
   - Generic SaaS UI kits

----------------------------------------
COMPONENT ARCHITECTURE
----------------------------------------

Always structure code like this:

src/
  components/
    layout/
    shared/
    mcc/
    satellite/
  pages/

Each feature must be modular.

----------------------------------------
STATE MANAGEMENT RULE
----------------------------------------

Always define explicit UI states.

Example:
- idle
- loading
- active
- error
- completed

Avoid implicit UI behavior.

----------------------------------------
ANIMATION RULES
----------------------------------------

Use Framer Motion for all animations.

Preferred animations:
- fade + scale (panels)
- slide (panels and transitions)
- split door animation (for station entry)
- sequential text appearance (terminal)

Avoid:
- excessive bounce
- cartoon effects

----------------------------------------
LOGIN EXPERIENCE RULE (CRITICAL)
----------------------------------------

Login is NOT a login.

It is a docking sequence.

Flow must include:
1. Rider authentication
2. Docking request
3. Platform assignment
4. Clearance granted
5. Station gate opening

Use a message array:

[
  "Docking request uplink established...",
  "Scanning station capacity...",
  "Assigning docking platform...",
  "Platform BX-04 reserved...",
  "Verifying identity signature...",
  "Security handshake in progress...",
  "Clearance granted...",
  "Opening station gate..."
]

----------------------------------------
BACKGROUND LAYERING RULE
----------------------------------------

Always use 3 layers:

1. Foreground → UI panels
2. Midground → animated elements (doors, grids)
3. Background → environment (station interior, space)

----------------------------------------
NAMING CONVENTION
----------------------------------------

Use clear sci-fi naming:

- StationDoor
- DockingSequence
- SignalSidebar
- PlanetViewport
- DataExchangePanel

Avoid generic names like:
- Box
- Card
- Container

----------------------------------------
DATA STRATEGY
----------------------------------------

Use mock data from:
- JSON files
- constants

Example:
src/data/

----------------------------------------
CODE QUALITY RULES
----------------------------------------

- Clean readable React code
- No unnecessary complexity
- No inline styles unless required
- Prefer Tailwind utilities
- Reusable components

----------------------------------------
WHAT AGENTS MUST ALWAYS DO
----------------------------------------

When generating UI:

1. Respect sci-fi theme
2. Use proper component structure
3. Include animations
4. Use state-driven UI
5. Avoid generic solutions

----------------------------------------
WHAT AGENTS MUST NEVER DO
----------------------------------------

- Generate plain/basic login forms
- Ignore animations
- Break component structure
- Use random design systems
- Output incomplete code

----------------------------------------
OUTPUT EXPECTATION
----------------------------------------

Agents must return:

1. Component structure
2. Full working code
3. Tailwind styling included
4. Framer Motion usage
5. Minimal explanation

----------------------------------------
END OF FILE
----------------------------------------