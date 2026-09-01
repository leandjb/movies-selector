---
name: The Shortlist
description: A modern orange-glass shortlist for movie-night voting.
colors:
  bg-deep: "#0a0806"
  bg-mid: "#14100c"
  ground-wash: "rgba(28, 20, 12, 0.95)"
  glow-blob-ember: "rgba(217, 119, 6, 0.32)"
  glow-blob-amber: "rgba(245, 165, 36, 0.16)"
  glass-fill: "rgba(245, 165, 36, 0.08)"
  glass-fill-strong: "rgba(245, 165, 36, 0.12)"
  glass-border: "rgba(255, 200, 87, 0.16)"
  glass-hi: "rgba(255, 200, 87, 0.06)"
  glass-line: "rgba(245, 165, 36, 0.1)"
  glass-chip: "rgba(255, 255, 255, 0.07)"
  glass-track: "rgba(255, 255, 255, 0.16)"
  glass-border-hover: "rgba(255, 255, 255, 0.24)"
  glass-edge: "rgba(255, 255, 255, 0.35)"
  glass-fallback: "rgba(26, 18, 10, 0.94)"
  scrim: "rgba(7, 9, 13, 0.72)"
  chip-bg: "rgba(20, 14, 8, 0.55)"
  poster-wash: "rgba(20, 14, 8, 0.6)"
  text: "#f6f1ea"
  text-muted: "#c9beb0"
  accent: "#f5a524"
  accent-bright: "#ffc857"
  accent-deep: "#d97706"
  accent-ink: "#241300"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.4vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  scale:
    step-060: "0.6rem"
    step-062: "0.62rem"
    step-068: "0.68rem"
    step-072: "0.72rem"
    step-078: "0.78rem"
    step-080: "0.8rem"
    step-082: "0.82rem"
    step-085: "0.85rem"
    step-088: "0.88rem"
    step-090: "0.9rem"
    step-095: "0.95rem"
    step-098: "0.98rem"
    step-102: "1.02rem"
    step-105: "1.05rem"
    step-112: "1.12rem"
    step-115: "1.15rem"
    step-120: "1.2rem"
    step-150: "1.5rem"
    step-200: "2rem"
    step-220: "2.2rem"
    step-350: "3.5rem"
  rounded:
    micro: "3px"
    xs: "4px"
    sm: "6px"
    md: "8px"
    lg: "10px"
    xl: "12px"
    pill: "999px"
spacing:
  xs: "0.4rem"
  sm: "0.7rem"
  md: "1rem"
  lg: "1.3rem"
  xl: "2rem"
components:
  button-cta:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "0.85rem 1.7rem"
    typography: "{typography.label}"
  button-vote:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  button-vote-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  button-reveal:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1.05rem"
    typography: "{typography.label}"
  badge:
    backgroundColor: "{colors.glass-chip}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.24rem 0.6rem"
  pill-status:
    backgroundColor: "{colors.glass-chip}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.34rem 0.8rem"
  card-pane:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0.8rem"
---

# Design System: The Shortlist

## Overview

**Creative North Star: "Glass Over Embers"**

A movie-night shortlist rendered as frosted glass panes floating over a deep, warm-tinted night lit by ember glow. Films hang on the board as translucent cards; the status of the night lives in the navbar, not the page body; the winner's pane carries the accent when deliberately revealed. The world refuses both the streaming-grid rut and the cool violet glass this page wore before — no indigo, no chrome, just dark warm glass, one amber accent, and a reveal you call yourself.

Density is calm and modern: large frosted panels, generous radii, hairline glass borders, soft depth. Motion is a quiet rise-and-glow — panes settle into place, the missing-votes pill breathes, toasts slide in from the corner. Legibility is the discipline: every frosted surface stays dark enough behind text to hold ≥4.5:1, and posters sit in clear (unblurred) wells so artwork never fogs.

**Key Characteristics:**
- One accent: amber. Everything else is amber/white glass tints over warm-near-black.
- Frosted panes: translucent white fills, backdrop blur, 1px hairline borders, a top-edge glass highlight.
- Status lives up top: the navbar carries the board count, the missing-votes pill, and the reveal.
- Feedback is transient: toasts in the corner, never a permanent status strip.
- Sora for display over Archivo body — geometric and modern, never Inter.
- The dark is warm-tinted (#0a0806), never pure black and never cool gray.

## Colors

Amber on warm-tinted frosted glass over a deep ember night — light behind glass, not paint on canvas.

### Primary
- **Amber** (#f5a524): The one accent — active votes, the winner, focus, the CTA, the counter digits, the reveal button.
- **Amber Bright** (#ffc857) / **Amber Deep** (#d97706): gradient and border partners. **Amber Ink** (#241300): text on accent fills (≥7:1 on accent).

### Secondary
No second accent. The ambient blobs (ember `rgba(217,119,6,0.32)`, amber `rgba(245,165,36,0.16)`) are atmosphere behind the glass, never UI color.

### Accent tonal ramp (amber at strength)
Borders, hover states, and tints reuse the one accent at these documented alphas — never a second hue:
`rgba(245,165,36,0.05)` wash · `0.08` fill-strong · `0.1` divider · `0.12` top highlight · `0.16` border · `0.32` ambient · `0.5` hover border · `0.6` poster wash.

### Neutral
- **Ember Deep** (#0a0806) and **Ember Mid** (#14100c): the gradient ground; **Ground Wash** (rgba(28,20,12,0.95)) anchors the bottom edge.
- **Amber Glass** tints: fill (rgba(245,165,36,0.05)), fill-strong (0.08), border (rgba(255,200,87,0.16)), top highlight (rgba(255,200,87,0.12)), divider line (rgba(245,165,36,0.1)).
- **White Glass** sub-tints for nested controls: chip fill (0.07), ring track (0.16), hover border (0.24), edge (0.35), and the no-blur fallback (rgba(26,18,10,0.94)).
- **Chip Backdrop** (rgba(20,14,8,0.55)) and **Poster Wash** (rgba(20,14,8,0.6)): scrims behind chips and the poster fallback.
- **Warm White** (#f6f1ea) text on ember night (~13:1) and **Muted Warm** (#b0a698) for secondary copy (~7:1).

### Named Rules
**The One Light Rule.** Amber appears only where a decision is live: an active vote, the winner, focus, the CTA, the reveal, and the missing-votes pill. Ambient blobs are atmosphere; they never carry UI.
**The No-Halo Rule.** No chromatic `text-shadow` or blurred colored `box-shadow` anywhere. Elevation is neutral black shadow only; focus is a solid (unblurred) accent outline.
**The Frosted-Enough Rule.** Every glass panel holding text keeps ≥4.5:1 contrast over the gradient; posters live in unblurred wells.
**The Warm Night Rule.** The dark is always warm-tinted (#0a0806 ground). Pure black, cool gray, and blue-tinted darks are banned.

## Typography

**Display Font:** Sora — geometric, modern, weight-led.
**Body Font:** Archivo — quiet and readable under the glass.

**Character:** A contemporary pairing with real presence: Sora's 800-weight display for the announcement, Archivo for the fine print. No serifs, no mono, no Inter.

### Hierarchy
- **Display** (Sora, 800, clamp(2.2rem→3.5rem), 1.04, −0.02em): The hero title.
- **Title** (Sora, 800, clamp(1.5rem→2rem), 1.2, −0.01em): Board title and card titles.
- **Label** (Sora, 600, 0.8rem, +0.05em caps): Kickers, buttons, badges, chips, the status pill.
- **Body** (Archivo, 400, 1rem, 1.55): Lede, notes, footer, toast copy. Max ~46ch for the lede.

The full ramp (0.6rem → 3.5rem) is in the frontmatter `typography.scale`; pick from it rather than inventing steps.

### Named Rules
**The Two-Face Rule.** Sora announces, Archivo explains. Never swap their jobs, and never add a third face.

## Layout

One 1120px container with a 1.5rem gutter. The navbar is a sticky frosted bar carrying brand + count chip on the left and the votes pill + reveal on the right. The hero is a two-column grid (glass pitch panel | stacked control column) that stacks under 1020px; the control column stacks budget (stepper + progress bar), add-by-IMDb-link, and gist import. The board is a 3-column grid of panes that steps 3 → 2 → 1 at 1020 / 640px, with a tools row above it holding the headline and a quiet clear-all at its right edge. Spacing rhythm: grid gap 1.3rem, card padding 0.8rem, hero panel padding ~2.6rem, section padding 3.5rem vertical.

## Elevation & Depth

Glass floats: two deep shadows (`0 18px 40px rgba(0,0,0,0.45)` at rest, `0 26px 60px rgba(0,0,0,0.55)` on hover) under panes that rise 4px on hover. Every pane carries a subtle inset top highlight (1px at 0.06 alpha) — the glass lip catching the light without reading as a bright edge. The ambient ember gradient lives on a dedicated fixed composited layer (`body::before`) — never `background-attachment: fixed`, which smears into bright streaks behind `backdrop-filter` panes on repaint. No element emits a chromatic glow — elevation is neutral shadow only (see The No-Halo Rule).

### Named Rules
**The Glass-Lip Rule.** Every frosted pane has the inset top highlight — no highlight, it's a sticker, not glass.

## Shapes

Squared, contemporary geometry: hero panels and cards at 12px radius, control panels and the header at 10px, inputs/wells/toasts at 8px, chips/badges/buttons at 6px, the budget progress track at 3px; the status-pill dot and the counter ring stay round by geometry. Focus outline is 3px amber with no radius mutation. Hairline borders (1px, amber glass 0.16) everywhere; the winner's border goes amber. Hover states move (translateY) but never brighten.

## Components

### Buttons
- **Shape:** 6px rounded rectangles for CTA/reveal/clear-all; 8px squares for votes.
- **CTA:** amber gradient (bright → accent) with a white edge, amber-ink Sora caps, no glow. Hover: rises 2px, no glare.
- **Reveal (navbar):** amber gradient rounded rect with amber-ink caps; disabled at 40% opacity while the board is empty.
- **Clear all:** a quiet ghost rounded rect at the board's edge — muted label, hairline border, amber only on focus. Never competes with the CTA.
- **Vote (+/−):** frosted square, white glyph. No hover glare — amber appears only on active fill and on focus. Active: amber fill, amber-ink glyph — the vote snaps into the accent.
- **Focus:** solid 3px amber outline, 3px offset (never a blurred glow ring).
### Chips (score badges)
- Frosted 6px rounded rects with a hairline border. Year: muted digits. A trailing "IMDb ↗" rounded-rect link opens the title page in a new tab. No rating badge is rendered.

### Cards / Containers (frosted panes)
- **Corner Style:** 12px.
- **Background:** glass gradient (fill-strong → fill) with plain blur(16px) — no saturate boost.
- **Border:** 1px amber glass 0.16; the winner's border goes amber (no glow).
- **Internal Padding:** 0.8rem all around; the vote cluster separates on a 1px white hairline.
- **Rank:** a frosted chip top-left with muted digits.
- **Winner chip:** amber rounded rect top-right, amber-ink caps "WINNER".
- **Poster well:** clear (unblurred) 8px well, 2:3 aspect, glass border; an amber "NO POSTER" SVG placeholder on load failure.

### The Navbar Status Pill (signature component)
A frosted rounded rect at the navbar's right edge: an amber dot plus uppercase caps reading "N VOTES MISSING". The dot breathes while votes are owed; at full allocation the pill inverts to a solid amber fill with "ALL VOTES CAST". Updates live on every vote, trim, and removal.

### The Counter (card signature)
A frosted 3.2rem ring: the track is glass white (0.16), the arc is amber and its sweep equals the movie's share of total votes, and the net score sits in amber digits (no glow). Re-renders live on every vote.

### Toasts
Frosted panes stacked bottom-right over an `aria-live="polite"` region: 8px radius, glass lip, hairline border, warm-white body copy. Errors take an amber border. Each auto-dismisses after 4s and carries its own close control; at most three are visible at once.

## Do's and Don'ts

### Do:
- **Do** reserve amber for live decisions — active votes, the winner, focus, the CTA, the reveal, and the status pill.
- **Do** keep glass panels dark enough for ≥4.5:1 text contrast, and keep posters in unblurred wells.
- **Do** give every frosted pane its top-edge glass highlight.
- **Do** set announcements in Sora and body copy in Archivo.
- **Do** ease with `cubic-bezier(0.22,1,0.36,1)`; panes rise, the pill breathes, toasts slide, nothing bounces.

### Don't:
- **Don't** add a second saturated color — amber is the one light; ambient blobs stay atmospheric.
- **Don't** blur text-bearing glass until it's unreadable, or put posters behind blur.
- **Don't** use pure black, cool gray, or blue-tinted darks — the night is warm (#0a0806).
- **Don't** use Inter, system defaults, or serifs anywhere.
- **Don't** nest frosted panes inside frosted panes — one glass layer, then clear content.
