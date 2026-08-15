---
name: The Shortlist
description: A modern dark-mode glassmorphism shortlist for movie-night voting.
colors:
  bg-deep: "#07090d"
  bg-mid: "#0d1017"
  ground-wash: "rgba(15, 23, 42, 0.95)"
  glow-blob-indigo: "rgba(99, 102, 241, 0.3)"
  glow-blob-cyan: "rgba(62, 225, 255, 0.12)"
  glass-fill: "rgba(255, 255, 255, 0.06)"
  glass-fill-strong: "rgba(255, 255, 255, 0.1)"
  glass-border: "rgba(255, 255, 255, 0.14)"
  glass-hi: "rgba(255, 255, 255, 0.14)"
  glass-line: "rgba(255, 255, 255, 0.1)"
  glass-chip: "rgba(255, 255, 255, 0.07)"
  glass-track: "rgba(255, 255, 255, 0.16)"
  glass-border-hover: "rgba(255, 255, 255, 0.24)"
  glass-edge: "rgba(255, 255, 255, 0.35)"
  glass-fallback: "rgba(17, 20, 27, 0.94)"
  chip-bg: "rgba(10, 13, 19, 0.55)"
  poster-wash: "rgba(10, 13, 19, 0.6)"
  text: "#eef1f6"
  text-muted: "#9aa4b2"
  accent: "#3ee1ff"
  accent-bright: "#6ff0ff"
  accent-deep: "#0ea5c9"
  accent-ink: "#052b33"
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
  xs: "4px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  xxl: "18px"
  xxxl: "22px"
  hero: "26px"
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
    rounded: "{rounded.pill}"
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
  button-trailer:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.95rem"
    typography: "{typography.label}"
  badge:
    backgroundColor: "{colors.glass-chip}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.24rem 0.6rem"
  card-pane:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text}"
    rounded: "{rounded.xxxl}"
    padding: "0.8rem"
---

# Design System: The Shortlist

## Overview

**Creative North Star: "Glass Over Night"**

A movie-night shortlist rendered as frosted glass panes floating over a deep, tinted night gradient lit by ambient glow. Six films hang on the board as translucent cards; the leader's pane glows electric cyan; voting is the only light the visitor controls. The world refuses both the streaming-grid rut and every decorated skin this page has worn before — no chrome, no amber, no diner, just dark glass, one neon accent, and a ranking that glows.

Density is calm and modern: large frosted panels, generous radii, hairline glass borders, soft depth. Motion is a quiet rise-and-glow — panes settle into place, the winner's light breathes. Legibility is the discipline: every frosted surface stays dark enough behind text to hold ≥4.5:1, and posters sit in clear (unblurred) wells so artwork never fogs.

**Key Characteristics:**
- One accent: electric cyan. Everything else is white glass tints over warm-near-black.
- Frosted panes: translucent white fills, backdrop blur, 1px hairline borders, a top-edge glass highlight.
- The winner's pane glows and pulses; active votes snap into the accent.
- Sora for display over Archivo body — geometric and modern, never Inter.
- The dark is tinted (#07090d), never pure black.

## Colors

Electric cyan on frosted white glass over a deep tinted night — light behind glass, not paint on canvas.

### Primary
- **Electric Cyan** (#3ee1ff): The one neon — active votes, the winner's glow, focus, the CTA, the counter digits.
- **Cyan Bright** (#6ff0ff) / **Cyan Deep** (#0ea5c9): gradient and border partners. **Cyan Ink** (#052b33): text on cyan fills.

### Secondary
No second accent. The ambient glow blobs (indigo `rgba(99,102,241,0.3)`, cyan `rgba(62,225,255,0.12)`) are atmosphere behind the glass, never UI color.

### Neutral
- **Night Deep** (#07090d) and **Night Mid** (#0d1017): the gradient ground; **Ground Wash** (rgba(15,23,42,0.95)) anchors the bottom edge.
- **Glass White** tints: fill (rgba(255,255,255,0.06)), fill-strong (0.1), border (0.14), top highlight (0.14), divider line (0.1), chip fill (0.07), ring track (0.16), hover border (0.24), edge (0.35), and the no-blur fallback (rgba(17,20,27,0.94)).
- **Chip Backdrop** (rgba(10,13,19,0.55)) and **Poster Wash** (rgba(10,13,19,0.6)): scrims behind chips and the poster fallback.
- **Warm White** (#eef1f6) text on night (~13:1) and **Muted Warm** (#9aa4b2) for secondary copy (~7:1).

The cyan glow family (alphas 0.12 → 0.8 and #6ff0ff) lives in the sidecar's accent tonal ramp — glows are the same accent at different strengths.

### Named Rules
**The One Light Rule.** Cyan appears only where a decision is live: an active vote, the winner's glow, focus, the CTA. Ambient blobs are atmosphere; they never carry UI.
**The Frosted-Enough Rule.** Every glass panel holding text keeps ≥4.5:1 contrast over the gradient; posters live in unblurred wells.
**The Tinted Night Rule.** The dark is always tinted (#07090d ground). Pure black and pure gray are banned.

## Typography

**Display Font:** Sora — geometric, modern, weight-led.
**Body Font:** Archivo — quiet and readable under the glass.

**Character:** A contemporary pairing with real presence: Sora's 800-weight display for the announcement, Archivo for the fine print. No serifs, no mono, no Inter.

### Hierarchy
- **Display** (Sora, 800, clamp(2.2rem→3.5rem), 1.04, −0.02em): The hero title.
- **Title** (Sora, 800, clamp(1.5rem→2rem), 1.2, −0.01em): Board title and card titles.
- **Label** (Sora, 600, 0.8rem, +0.05em caps): Kickers, buttons, badges, chips.
- **Body** (Archivo, 400, 1rem, 1.55): Lede, notes, footer. Max ~46ch for the lede.

The full ramp (0.6rem → 3.5rem) is in the frontmatter `typography.scale`; pick from it rather than inventing steps.

### Named Rules
**The Two-Face Rule.** Sora announces, Archivo explains. Never swap their jobs, and never add a third face.

## Layout

One 1120px container with a 1.5rem gutter. The hero is a two-column grid (glass panel | live winner card) that stacks under 1020px, with the winner card becoming a horizontal row (110px poster + meta) under 1020 and a full-width column under 640px. The board is a 3-column grid of panes that steps 3 → 2 → 1 at 1020 / 640px. Spacing rhythm: grid gap 1.3rem, card padding 0.8rem, hero panel padding ~2.7rem, section padding 3.5rem vertical. The site header is a sticky frosted bar.

## Elevation & Depth

Glass floats: two deep shadows (`0 18px 40px rgba(0,0,0,0.45)` at rest, `0 26px 60px rgba(0,0,0,0.55)` on hover) under panes that rise 4px on hover. Every pane carries an inset top highlight (1px white) — the glass lip catching the light. The winner's pane emits the cyan glow (`0 0 0 1px rgba(62,225,255,0.45), 0 0 28px rgba(62,225,255,0.35)`) that breathes on a slow pulse. No other element casts.

### Named Rules
**The Glass-Lip Rule.** Every frosted pane has the inset top highlight — no highlight, it's a sticker, not glass.

## Shapes

Soft, contemporary geometry: hero panels at 26px radius, cards at 22px, the board head at 18px, header/footer at 16px, poster wells at 14px, vote buttons at 12px, chips at 10px, focus at 4px, and pills (999px) for badges, the CTA, and the trailer link. Hairline borders (1px, glass white 0.14) everywhere; the winner's border goes cyan.

## Components

### Buttons
- **Shape:** pills for CTA/trailer; 12px squares for votes.
- **CTA:** cyan gradient (bright → accent) with a white edge, cyan-ink Sora caps, cyan glow. Hover: rises 2px, glow widens.
- **Vote (+/−):** frosted square, white glyph. Hover: glyph + border go cyan. Active (`aria-pressed=true`): cyan fill, cyan-ink glyph, glow — the vote snaps into the accent.
- **Trailer link:** frosted pill, cyan ▶, opens the YouTube watch URL in a new tab (`target="_blank" rel="noopener noreferrer"`). Hover: border + text go cyan.
- **Focus:** 3px cyan outline, 3px offset.

### Chips (score badges)
- Frosted pills with a hairline border. IMDb: cyan digits with a muted "IMDb" caption. RT: white digits with 🍅. Missing score: muted "—".

### Cards / Containers (frosted panes)
- **Corner Style:** 22px.
- **Background:** glass gradient (fill-strong → fill) with blur(16px) saturate(1.5).
- **Border:** 1px glass white 0.14; the winner's border and glow go cyan.
- **Internal Padding:** 0.8rem all around; the vote cluster separates on a 1px white hairline.
- **Rank:** a frosted chip top-left with muted digits.
- **Winner chip:** cyan pill top-right, cyan-ink caps "WINNER".
- **Poster well:** clear (unblurred) 14px well, 2:3 aspect, glass border; a cyan "NO POSTER" SVG placeholder on load failure.

### The Counter (signature component)
A frosted 3.2rem ring: the track is glass white (0.16), the arc is cyan and its sweep equals the movie's share of total votes, and the net score sits in glowing cyan digits. Re-renders live on every vote.

## Do's and Don'ts

### Do:
- **Do** reserve cyan for live decisions — active votes, the winner's glow, focus, the CTA.
- **Do** keep glass panels dark enough for ≥4.5:1 text contrast, and keep posters in unblurred wells.
- **Do** give every frosted pane its top-edge glass highlight.
- **Do** set announcements in Sora and body copy in Archivo.
- **Do** ease with `cubic-bezier(0.22,1,0.36,1)`; panes rise, glows breathe, nothing bounces.

### Don't:
- **Don't** add a second saturated color — cyan is the one light; ambient blobs stay atmospheric.
- **Don't** blur text-bearing glass until it's unreadable, or put posters behind blur.
- **Don't** use pure black or pure gray — the night is tinted (#07090d).
- **Don't** use Inter, system defaults, serifs, or purple-to-blue gradients anywhere.
- **Don't** nest frosted panes inside frosted panes — one glass layer, then clear content.
