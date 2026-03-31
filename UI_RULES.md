# UI_RULES.md
## Macana Commerce Center / Hackathon UI System

----------------------------------------
GOAL
----------------------------------------

This UI is for a hackathon demo inside the EVE Frontier universe.

The interface must be:
- believable
- compact
- readable
- immersive
- demo-friendly

The design should support a small in-game viewport.

----------------------------------------
VISUAL IDENTITY
----------------------------------------

Style:
- dark sci-fi industrial
- station control interface
- technical and serious
- not flashy for its own sake

Core mood:
- a real orbital trade/data terminal
- a station system, not a website

----------------------------------------
COLOR SYSTEM
----------------------------------------

Backgrounds:
- #0a0a0a
- #111111

Accents:
- Orange: #f97316
- Cyan: #22d3ee

Support:
- Border gray: #2a2a2a
- Text muted: #9ca3af

Avoid:
- strong neon overload
- random gradients
- bright playful palettes

----------------------------------------
IN-GAME LAYOUT RULE
----------------------------------------

Because the UI may appear inside the game client, prioritize compact layouts.

Preferred shell:
1. top banner
2. compact tab navigation
3. one active module visible at a time

Avoid:
- large multi-column dashboard layouts inside the game viewport
- heavy left sidebars that consume too much space
- multiple dense modules shown at once

----------------------------------------
TOP BANNER RULE
----------------------------------------

The top banner should include:
- Macana branding/logo
- corporation resources:
  - LUX
  - MTC
  - scan data received

The banner must feel like a station command/status strip.

----------------------------------------
MODULE RULE
----------------------------------------

Only one major content module should be active at a time.

Primary modules for the hackathon:
- Data Exchange
- Wallet / Rider Status
- Scan Overview

Secondary modules may exist visually, but should not distract from the core loop.

----------------------------------------
PANEL RULE
----------------------------------------

Each module should use panel structure:
- title
- subtitle or status
- content area
- action area

Panel style:
- solid dark background
- thin industrial border
- subtle inner shadow or glow
- compact spacing

----------------------------------------
TYPOGRAPHY
----------------------------------------

Readable first.

Inside the game viewport:
- keep body text compact
- prioritize legibility over drama

Recommended:
- Inter for body
- Orbitron only for selective headings

----------------------------------------
ANIMATION RULE
----------------------------------------

Animations should support clarity, not spectacle.

Allowed:
- fade
- slide
- soft panel transitions
- sequential system text
- door split reveal

Avoid:
- bounce
- elastic motion
- cartoon timing

----------------------------------------
DOCKING TEXT STYLE
----------------------------------------

System text should feel like a station console:
- centered when needed
- progressive reveal
- minimal, technical, clean

----------------------------------------
RESPONSIVENESS
----------------------------------------

Design for:
1. compact in-game viewport first
2. desktop full-screen second

If needed, maintain two modes:
- compact
- full

----------------------------------------
HACKATHON FOCUS RULE
----------------------------------------

Do not spend time polishing secondary screens until the core demo loop is strong and readable.

The main station shell and Data Exchange flow take priority.

----------------------------------------
END OF FILE
----------------------------------------