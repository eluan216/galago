# Galago Taste DNA

Extracted and applied from outstanding restraint-first dark products (Linear-class, Taste methodology).

## Design Map

| Token | Value | Role |
|-------|--------|------|
| Night | `#0A0C10` | Page background (near-black, not pure) |
| Surface | `#12161C` | Cards / raised panels |
| Surface 2 | `#181C24` | Nested / hover |
| Border | `rgba(255,255,255,0.06)` | Inset depth ring |
| Moon | `#F2F0EA` | Primary text |
| Mist | `#8B93A7` | Secondary text |
| Gold | `#E8B923` | Single quiet accent (CTAs, key numbers) |
| Gold soft | `rgba(232,185,35,0.12)` | Subtle gold wash |
| Success | `#2DD4A8` | Positive only |
| Danger | `#F87171` | Errors only |

**Type:** Display 36–48px weight 600, tight tracking. Body 15px / 24px. Mono for money.

**Radius:** 8px cards, 9999px pills only for chips.

**Depth:** 1px inset border, almost no drop shadow.

## Taste DNA principles

### 1. Restraint — Brand lives in light and one gold, not rainbow
- **Trigger:** Choosing how much color the product carries.
- **Decision:** Near-black base + off-white text + single gold accent for primary actions and money.
- **Reason:** A nocturnal African marketplace needs trust and calm at night. Loud multi-color chrome feels like every SMM panel.
- **Evidence:** Gold only on primary buttons and balance figures; nav and chrome stay mist/moon.
- **Trade-off:** Cannot color-code every status with brand gold; status uses success/danger neutrals.

### 2. Depth without noise
- **Trigger:** Separating cards from background.
- **Decision:** Inset 1px border + slightly lighter surface, not soft drop shadows.
- **Reason:** Heavy shadows on dark UIs look muddy and template-like.
- **Evidence:** Cards use `border border-white/[0.06]` and `bg-[#12161C]`.
- **Trade-off:** Less “floating” drama; hierarchy relies on spacing and type.

### 3. Hierarchy by weight, not decoration
- **Trigger:** Making balance and CTAs obvious.
- **Decision:** Large type + gold for the one number that matters; everything else quieter.
- **Reason:** Users open Galago to fund and order. The wallet figure is the hero.
- **Evidence:** Balance at ~2xl–3xl; secondary labels in mist.
- **Trade-off:** Marketing hero must earn attention with copy, not gradients.

### 4. Room to breathe inside, tight between
- **Trigger:** Layout density on dashboard.
- **Decision:** Generous padding inside cards (p-6); moderate gaps between sections.
- **Reason:** Mobile-first Nigerian users; crowded panels feel cheap.
- **Evidence:** Section stacks with space-y-8; cards padded.
- **Trade-off:** Fewer widgets above the fold on small screens.
