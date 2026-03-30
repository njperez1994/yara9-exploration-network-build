# UI_RULES.md
## Macana Commerce Center / YARA-9 Interface System

----------------------------------------
CORE VISUAL IDENTITY
----------------------------------------

This is a cinematic sci-fi industrial interface.

Inspired by:
- EVE Frontier
- Orbital stations
- Industrial control panels
- Space docking systems

The UI must feel:
- immersive
- technical
- high-stakes
- real (not gamey, not cartoonish)

----------------------------------------
COLOR SYSTEM
----------------------------------------

Primary Background:
- #0a0a0a (deep black)
- #111111 (charcoal)

Primary Accents:
- Orange: #f97316 (energy, YARA-9, alerts)
- Cyan: #22d3ee (systems, scanning, data)

Secondary:
- Gray borders: #2a2a2a
- Muted text: #9ca3af

NEVER USE:
- bright neon palettes
- random colors
- gradients without purpose

----------------------------------------
TYPOGRAPHY
----------------------------------------

Style:
- clean
- technical
- slightly condensed feel

Recommended:
- Inter
- Orbitron (for headings only)

Rules:
- Titles: uppercase or semi-uppercase
- Labels: small, subtle
- Values: bold and clear

----------------------------------------
LAYOUT SYSTEM
----------------------------------------

Always use structured grids.

Main layouts:
- 3-column system (MCC)
- center-focus layout (Satellite view)

Spacing:
- consistent padding (p-4 / p-6)
- clear separation between panels

----------------------------------------
PANEL DESIGN (CRITICAL)
----------------------------------------

Every UI block is a PANEL.

Panel must include:
- header (title + subtitle)
- content area
- optional actions

Panel style:
- border: 1px solid #2a2a2a
- background: #111111
- subtle inner glow or shadow

Avoid:
- floating cards without structure
- rounded mobile-style cards

----------------------------------------
LAYERING SYSTEM
----------------------------------------

Every screen must use 3 layers:

1. Foreground → UI panels
2. Midground → animated elements (doors, scans)
3. Background → environment (station, space)

----------------------------------------
ANIMATION SYSTEM
----------------------------------------

Use Framer Motion.

Allowed animations:
- fade + scale (panels)
- slide transitions
- sequential reveal (text/data)
- door split animation

Timing:
- 0.3s → micro interactions
- 0.8s → panel transitions
- 1.2–1.8s → cinematic animations

Avoid:
- bounce
- elastic motion
- cartoon easing

----------------------------------------
TERMINAL / DATA STYLE
----------------------------------------

System messages should feel like a terminal:

- progressive appearance
- optional blinking cursor
- slightly dimmed text before active

Example:
> Docking request uplink established...

----------------------------------------
BUTTON DESIGN
----------------------------------------

Primary:
- orange accent
- subtle glow
- strong label

Secondary:
- outlined
- muted

Danger:
- red accent (only when needed)

----------------------------------------
ICONS & VISUAL ELEMENTS
----------------------------------------

Style:
- minimal
- geometric
- technical

Use:
- lines
- grids
- circles (radar style)

----------------------------------------
RESPONSIVENESS
----------------------------------------

- Must work on desktop first
- Tablet support optional
- Mobile: simplified but consistent

----------------------------------------
DO NOT BREAK THESE RULES
----------------------------------------

- No generic SaaS layouts
- No random Tailwind components
- No bright themes
- No inconsistent spacing
- No missing animations

----------------------------------------
END OF FILE
----------------------------------------