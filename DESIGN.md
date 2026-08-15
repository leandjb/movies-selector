---
name: The Pickup Counter
description: A Googie diner menu board for a movie-night voting shortlist.
colors:
  turquoise: "#14b3a8"
  turquoise-hi: "#1ec9bd"
  turquoise-deep: "#0b8d84"
  turquoise-ink: "#0a5f5a"
  coral: "#ff6b57"
  coral-deep: "#e04a37"
  laminate: "#f6f1e6"
  laminate-deep: "#ede5d3"
  laminate-line: "#e2d7bf"
  chrome: "#d7e1e6"
  chrome-hi: "#eef3f5"
  chrome-deep: "#b9c8d0"
  ink: "#2e3538"
  ink-mid: "#556166"
  ink-soft: "#78837f"
  neon: "#fffbe9"
  wash-white: "rgba(255, 255, 255, 0.55)"
  backdrop: "rgba(30, 34, 36, 0.66)"
typography:
  display:
    fontFamily: "Staatliches, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  script:
    fontFamily: "Yellowtail, cursive"
    fontSize: "clamp(3rem, 7vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.95
  slab:
    fontFamily: "Staatliches, sans-serif"
    fontSize: "clamp(1.1rem, 2.4vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Staatliches, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  scale:
    step-070: "0.7rem"
    step-075: "0.75rem"
    step-082: "0.82rem"
    step-090: "0.9rem"
    step-095: "0.95rem"
    step-105: "1.05rem"
    step-110: "1.1rem"
    step-115: "1.15rem"
    step-120: "1.2rem"
    step-130: "1.3rem"
    step-135: "1.35rem"
    sign: "26px"
rounded:
  xs: "2px"
  sm: "4px"
  md: "9px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "0.4rem"
  sm: "0.7rem"
  md: "1rem"
  lg: "1.4rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.turquoise}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
    typography: "{typography.display}"
  button-vote:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.ink}"
    size: "2.5rem"
  badge-rt:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.22rem 0.55rem"
  badge-imdb:
    backgroundColor: "{colors.laminate}"
    textColor: "{colors.turquoise-ink}"
    rounded: "{rounded.pill}"
    padding: "0.22rem 0.55rem"
  card-menu:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.7rem"
---

# Design System: The Pickup Counter

## Overview

**Creative North Star: "The All-Night Diner"**

The page is a Googie roadside diner serving a movie-night shortlist: the ranked catalog reads as a menu board, votes are punched tickets, and the starburst sign is the liveliest object on the page. It refuses the dark streaming-grid landing page — no near-black hero, no gradient badges, no Inter. Instead: warm counter laminate, chrome trim, turquoise and coral, and a neon starburst reserved for the moment you vote.

Density is moderate and playful. The hero carries the swoop (a cantilever chrome band that tilts into a vertical spine on phones), the board is a simple responsive grid, and motion is scarce and purposeful — a slow sign spin, a neon flicker, an ease-out card entrance. The world's job is to make voting feel like ordering the special.

**Key Characteristics:**
- Two saturated counter colors (turquoise, coral) carry all surface color; everything else is warm laminate and chrome.
- The starburst is the signature: rank plates, vote buttons, and the hero sign all snap into it when active.
- Slab caps for titles, script for feature names — a menu, not a dashboard.
- All ink is tinted; there is no pure black or gray anywhere.

## Colors

Turquoise and coral on warm laminate and chrome — a countertop, not a canvas.

### Primary
- **Counter Turquoise** (#14b3a8): Interactive surfaces — the hero CTA pill, the booth title bar, the vote-share arc. The hue the eye trusts as "do something".
- **Turquoise Hi** (#1ec9bd): Top of the CTA gradient.
- **Turquoise Deep** (#0b8d84): CTA border and gradient depth.
- **Turquoise Ink** (#0a5f5a): Headings and links that sit on light laminate (hero script, badge text).

### Secondary
- **Neon Coral** (#ff6b57): Energy and rank — the starburst sign, rank plates, the RT badge, the active state of votes' opposite hue.
- **Coral Deep** (#e04a37): Focus outlines, close buttons, hover accents.

### Neutral
- **Warm Laminate** (#f6f1e6): Page ground, card surfaces, badge ground.
- **Laminate Deep** (#ede5d3): Secondary ground; **Laminate Line** (#e2d7bf): hairline separation.
- **Chrome** (#d7e1e6): Card and control chrome; **Chrome Hi** (#eef3f5): the top of chrome gradients; **Chrome Deep** (#b9c8d0): 3px trim borders.
- **Blue-Tinted Charcoal** (#2e3538): Body and slab-caps ink (tinted, never pure black). **Ink Mid** (#556166), **Ink Soft** (#78837f): supporting text.
- **Neon White** (#fffbe9): Reserved for the active starburst state and the booth title bar's glyphs.
- **Swoop Wash** (rgba(255,255,255,0.55)): the sheen across the hero's cantilever band. **Booth Backdrop** (rgba(30,34,36,0.66)): the blurred overlay behind the trailer modal.

### Named Rules
**The Two-Color Rule.** Turquoise and coral are the only saturated hues. Any third competing color must earn its place or be removed.
**The Tinted Ink Rule.** Never pure black or pure gray. Charcoal is blue-tinted (#2e3538); every neutral carries a cast.

## Typography

**Display Font:** Staatliches (slab caps, one weight) — the menu board.
**Script Font:** Yellowtail — the special-of-the-day signwriting.
**Body Font:** Archivo — counter chatter that stays readable.

**Character:** A diner menu set in type: slab caps announce, script entices, and a neutral humanist sans carries the small print. No system-default or Inter anywhere.

### Hierarchy
- **Display** (Staatliches, 400, clamp(2rem→3rem), 1.05, +0.05em caps): Board titles, card movie titles, the CTA, buttons. Uppercase always.
- **Script** (Yellowtail, 400, clamp(3rem→5rem), 0.95): The hero feature name ("Tonight's shortlist") and the year on each card.
- **Slab** (Staatliches, 400, clamp(1.1rem→1.5rem), 1.15, +0.06em caps): The hero subhead and CTA — announcement scale.
- **Body** (Archivo, 400, 1rem, 1.55): Lede, notes, footer. Max ~46ch for the lede.
- **Label** (Staatliches, 400, 0.95rem, +0.05em caps): Badges, buttons, the ticker.

The full size ramp (0.7rem → 1.35rem plus the 26px sign glyph) is enumerated in the frontmatter `typography.scale`; pick from it rather than inventing new steps.

### Named Rules
**The Slab Rule.** Anything that announces (titles, CTAs, badges) is slab caps. Script never carries action; it only entices.

## Layout

One 1180px container with a 1.5rem gutter. The hero is a two-column grid (sign | copy) that collapses to a single centered column under 1020px, where the sign leads and the cantilever swoop becomes a 0.5rem vertical spine pinned to the right edge. The board is a 4-column grid of movie cards that steps down 4 → 3 → 2 → 1 at 1020 / 760 / 480px. Spacing rhythm: grid gap 1.4rem, card padding 0.7rem, section padding 4.5rem vertical. The board head separates from the grid with a 4px double chrome rule.

## Elevation & Depth

A lifted laminate: cards and the CTA float on two soft shadows (`0 10px 30px rgba(46,53,56,0.16)` at rest, `0 22px 48px rgba(46,53,56,0.24)` on hover) and rise 5px with a −0.7deg tilt on hover. Depth is conveyed by chrome-gradient edges (3px chrome-deep trim) and the hero's swoop band, not by layering. The booth modal sits above everything on the lifted shadow with a blurred backdrop.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces are flat at rest; shadows appear only as hover lifts and the modal. No permanent drop-shadow clutter.

## Shapes

Googie geometry: the starburst (12-point star) is the system's only decorative silhouette — rank plates, vote buttons, the hero sign. Corners are gently curved: 14px on cards, 9px on the poster well, 999px pills on badges, CTAs, and trailer buttons. Vote buttons are circular starbursts with no visible border at rest, snapping to a neon-starburst-with-coral-stroke when pressed. Dashed chrome rules (2px) separate the vote cluster from card metadata.

## Components

### Buttons
- **Shape:** pills (999px) for CTAs and the trailer button; circular starbursts (2.5rem) for votes.
- **Primary CTA:** turquoise gradient (`#1ec9bd → #14b3a8`) with a turquoise-deep border, ink slab caps, neon ★ that flickers. Hover: rises 2px with a −0.5deg tilt.
- **Vote buttons:** starburst path; chrome fill at rest, ink ▲/▼ glyph. Pressed: neon fill, coral-deep stroke, flicker animation, glyph turns coral-deep.
- **Trailer button:** laminate pill with a 2px chrome-deep border, coral ▶, ink slab caps. Hover: border and text go turquoise.
- **Focus:** 3px ink outline with a 6px laminate halo (not the default blue glow).

### Chips (score badges)
- **IMDb badge:** laminate pill, 2px chrome-deep border, turquoise-ink text, coral ★.
- **RT badge:** coral fill, ink text, 🍅 prefix.

### Cards / Containers (menu cards)
- **Corner Style:** 14px.
- **Background:** chrome gradient (chrome-hi → chrome).
- **Border:** 3px chrome-deep.
- **Internal Padding:** 0.7rem all around; the vote cluster separates on a dashed rule.
- **Rank plate:** coral starburst pinned top-left with an ink slab numeral.
- **Poster well:** 9px radius, 2:3 aspect, overflow hidden, chrome-deep ground with a formica-speckle fallback poster (SVG data URI) on load failure.
- **Shadow:** lifted only on hover.

### The Booth (trailer modal)
- A chrome-framed 16:9 stage with a turquoise title bar (ink slab caps) and a circular ✕ that rotates 90° and fills coral on hover. Closes via ✕, Escape, or backdrop; the iframe src is cleared on close to stop playback. A "Watch on YouTube ↗" link rides the footer for embeds that refuse to play.

## Do's and Don'ts

### Do:
- **Do** reserve neon white for active states and the booth bar — it is the reward for voting.
- **Do** put every score inside a badge, every rank inside a starburst, and every vote inside the orbit arc.
- **Do** keep ink tinted (#2e3538 base) — warm the charcoal, never go pure black.
- **Do** use the ease-out cubic (`cubic-bezier(0.22,1,0.36,1)`) for all motion.

### Don't:
- **Don't** add a third saturated color, gradients beyond the two-tone turquoise, or glass effects.
- **Don't** wrap cards in cards, or stack chrome frames inside chrome frames.
- **Don't** use bounce or elastic easing — the world is retro, not bouncy.
- **Don't** put action text in script — script entices, slab acts.
- **Don't** use Inter, system defaults, or a purple-to-blue gradient anywhere.
