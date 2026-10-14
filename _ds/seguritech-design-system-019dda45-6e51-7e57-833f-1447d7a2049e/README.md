# SeguriTech Design System

## Company Overview

**Seguritech Privada S.A. de C.V.** is a leading Mexican technology integrator specializing in security, telecommunications, and high-tech defense solutions. Founded in 1995, headquartered in Mexico, they are one of the largest security integrators in Latin America, primarily serving government agencies and large corporations.

- **Industry**: Public safety, defense technology, critical infrastructure
- **Markets**: Mexico and Latin America
- **Clients**: Government agencies, municipalities, large corporations, federal security bodies

### Key Solutions
| Solution | Description |
|---|---|
| C5 Centers | Command, Control, Computer, Communications & Citizen Contact centers |
| Urban Video Surveillance | City-wide CCTV with facial recognition and ALPR |
| SAIMON | AI-driven real-time decision-making and logistics coordination platform |
| Non-Intrusive Inspection | Mobile/fixed X-ray and gamma-ray cargo inspection |
| Penitentiary Systems | High-security prison technology |
| SeguriSpace | Satellite and aerospace surveillance program |
| Cybersecurity | National-level cyber defense systems |

---

## Sources Provided

| Source | Notes |
|---|---|
| `uploads/SeguriTech.png` | Primary company logo (copied to `assets/logo-seguritech.png`) |
| `uploads/Initial.png` | SAIMON platform login screen reference (copied to `assets/saimon-login-reference.png`) |

No Figma links or codebase were provided. Design system derived from logo analysis and SAIMON UI screenshot.

---

## CONTENT FUNDAMENTALS

### Language
- Primary language is **Spanish** (Mexican market), with English used in branding/taglines
- UI copy is entirely in Spanish: *"Introduce tu usuario"*, *"Iniciar Sesión"*, *"Campo obligatorio"*

### Tone & Voice
- **Authoritative and technical** — this is enterprise/government software, not consumer
- **Formal register** — uses "usted" conventions; no colloquialisms
- **Precision over flair** — copy is direct, action-oriented, minimal
- **No emoji** — completely absent from all materials
- **No humor** — serious, mission-critical tone throughout

### Casing Conventions
- Product names: Title Case (*"Seguritech Artificial Intelligence Monitoring Operating Network"*)
- UI labels: ALL CAPS for buttons (*"INICIAR SESIÓN"*, *"CONTRASEÑA"*)
- Form labels: Sentence case (*"Seleccione una forma de validación"*)
- Section headers in slides: likely Title Case or ALL CAPS

### Copy Patterns
- Action verbs for CTAs: *Iniciar, Seleccione, Introduce*
- Descriptive taglines: *"Integral Security"*, *"AI Monitoring Operating Network"*
- Acronyms used heavily: SAIMON, C5, ALPR, CCTV

---

## VISUAL FOUNDATIONS

### Color System
| Role | Color | Hex |
|---|---|---|
| Primary Navy | Deep royal blue | `#1B2F8A` |
| Secondary Navy | Darker navy | `#0F1E5E` |
| Silver/Gray | Logo "Tech" gray | `#8C9BAB` |
| Accent Red | Swoosh / alerts | `#D0212A` |
| White | Backgrounds | `#FFFFFF` |
| Light Gray | Form borders, inputs | `#E0E4EA` |
| Text Dark | Body copy | `#1A1A2E` |
| Text Muted | Secondary labels | `#6B7280` |

### Typography
- **Logo wordmark**: Bold condensed sans-serif — extremely heavy weight, italic styling. Closest match: **Barlow Condensed ExtraBold** or **Oswald Bold** from Google Fonts.
- **UI body**: Clean geometric sans-serif, likely **Roboto** or similar system sans used in the SAIMON interface
- **For slides**: Bold condensed for headlines, regular sans for body

### Backgrounds
- **Presentation slides**: Dark, dramatic — full-bleed photography of command centers, surveillance infrastructure, technology environments. Deep navy overlays applied over photos.
- **UI screens**: Clean white with a full-bleed high-contrast photography panel on the left (split layout)
- **No decorative textures or patterns** — imagery does all the heavy lifting

### The Brand Mark
The signature **red swoosh with crosshair** appears on both SeguriTech and SAIMON logos. It is a recurring brand device — a curved red arc terminating in a circular crosshair/target icon. Always appears to the right of the wordmark.

### Animation
- Not observed — assumed minimal. Likely: simple fades, no bounces
- Enterprise UIs favor function over flourish

### Cards & Surfaces
- Clean white cards, thin `1px` borders in light gray
- No drop shadows observed in SAIMON UI — flat/minimal elevation
- Rounded corners: subtle — approximately `4px`

### Iconography
- No icon system visible in provided assets
- SAIMON uses small inline icons (user icon in input field)
- Closest CDN match: **Lucide** (clean, stroke-based, professional) — see ICONOGRAPHY section

### Spacing & Layout
- SAIMON uses a **50/50 split layout**: full-bleed image left, form panel right
- Generous internal padding in form panels (~40px+)
- Form elements: full-width inputs, consistent vertical rhythm

### Imagery Style
- **Dark, cinematic** — command centers, control rooms, surveillance cameras, tactical environments
- **Cool color temperature** — blues, teals, dark grays dominate
- **High contrast** — dramatic lighting in environments
- **No stock smiles** — real infrastructure photography only

### Borders & Dividers
- Thin `1px` lines in light gray (`#E0E4EA`)
- Active/focused inputs: accent blue border (`#1B2F8A`) with thin red underline on validation errors

### Button System
- **Primary**: Solid navy blue background, white ALL CAPS text, full-width or wide
- **Tab/Toggle**: Active = solid blue, inactive = white with gray border

---

## ICONOGRAPHY

No dedicated icon font or SVG set was provided. Based on SAIMON UI, small inline icons (person glyph in inputs) are used sparingly.

**Substitution**: Use **Lucide Icons** via CDN for UI kits and slides.
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```
This is a **substitution** — actual SAIMON icon assets were not available. Flag for replacement if icon files are provided.

---

## FILE INDEX

```
/
├── README.md                       ← This file
├── SKILL.md                        ← Agent skill descriptor (Claude Code compatible)
├── colors_and_type.css             ← Full CSS variable system: colors, type, spacing, shadows
├── assets/
│   ├── logo-seguritech.png         ← Primary SeguriTech logo (white bg, transparent)
│   └── saimon-login-reference.png  ← SAIMON UI login screen reference screenshot
├── preview/                        ← Design System tab cards (registered assets)
│   ├── colors-primary.html         ← Navy / Red / Silver full scales
│   ├── colors-semantic.html        ← Semantic UI tokens (bg, fg, border, state)
│   ├── type-display.html           ← Barlow Condensed headline scale
│   ├── type-body.html              ← Barlow body / UI type scale
│   ├── spacing-tokens.html         ← 4px-base spacing grid + border radii
│   ├── spacing-elevation.html      ← Shadow system + photo overlay patterns
│   ├── components-buttons.html     ← Button system (primary, outline, danger, tabs)
│   └── components-inputs.html      ← Form inputs (text, select, password, error states)
├── slides/
│   ├── deck-stage.js               ← Slide deck engine (scaling, nav, PDF)
│   └── index.html                  ← 7 slide layouts: title, section, content,
│                                     quote, comparison, stats, closing
└── ui_kits/
    └── saimon/
        ├── README.md               ← SAIMON UI kit notes
        └── index.html              ← Interactive prototype: login → dashboard
```

### Quick Usage

**For a new slide deck:**
```html
<link href="../colors_and_type.css" rel="stylesheet">
<script src="../slides/deck-stage.js"></script>
<!-- Copy slide styles from slides/index.html and add <section> slides -->
```

**For a UI prototype:**
```html
<link href="../colors_and_type.css" rel="stylesheet">
<!-- Use btn-primary, btn-outline, input, select classes from colors_and_type.css -->
<!-- Copy component patterns from ui_kits/saimon/index.html -->
```

**Key brand rules:**
- Headlines: Barlow Condensed, ExtraBold, ALL CAPS, letter-spacing tight
- Primary color: Navy `#1B2F8A` · Accent Red: `#D0212A` (swoosh, danger, highlights)
- Backgrounds: Dark navy for slides; white + navy split for dashboards
- Buttons: ALL CAPS, wide letter-spacing, full-width for auth flows
- Language: Spanish (Mexican) — formal register, no emoji
