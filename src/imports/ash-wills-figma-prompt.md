# Ash Wills — Site Redesign: Master Figma Prompt

## Overview
Redesign a retro-terminal-styled artist landing page for Ash Wills 
(musician/tech artist). It's a small interactive system, not a static 
showcase — the goal is converting visitors into a community (email 
signup) for future show announcements.

Currently exists as a busy Windows-95-style "desktop OS" portfolio 
(draggable windows, taskbar, 5-color theme picker, minesweeper). 
Keep the retro-embedded personality, cut the clutter.

---

## Entry Experience
Terminal-look intro screen — blinking cursor, monospace font, 
typewriter text animation. NOT a required typed-command gate.

Show tappable command options styled as terminal output:
```
> [music]  [youtube]  [tour]  [join]
```
Power users can also type real commands (e.g. "music", "join") — 
optional, not required. First line explains: `> tap a command or 
type one.`

**Returning visitor state:** if the visitor previously signed up 
(email/VIP), skip the intro animation and greet by name:
```
> welcome back, [name]
```
Show their personalized quick-access commands instead of the 
first-time intro. New/non-signed-up visitors see the full terminal 
intro every visit.

> Dev note (not a Figma concern): tie "remembered" to the actual 
> email signup via server-side lookup, not local/cookie storage — 
> otherwise switching devices or clearing cache makes them a 
> stranger again.

---

## Theme Toggle
Manual toggle, in-character as a terminal command:
```
theme --dark
theme --light
```

**Dark (default)**
| Role | Hex |
|---|---|
| Background | `#0B0F0C` |
| Text | `#39FF88` |
| Accent | `#FFB000` |
| Muted text | `#5A6B5F` |
| Borders | `#1E2A21` |

**Light ("receipt paper" feel, not an inverted dark mode)**
| Role | Hex |
|---|---|
| Background | `#F5F2EA` |
| Text | `#1A1A1A` |
| Accent | `#C4650E` |
| Muted text | `#8A8478` |
| Borders | `#D9D3C4` |

Toggle transition: brief static/glitch flicker instead of a plain fade.

---

## Core Sections (single scrolling flow, not draggable windows)

### Music — Featured Release Module
Swappable per-release, not permanent site chrome (next single will 
look different — this module is the only part that changes).

- Hero: "Crashing Out" footage — grainy, night-vision green tint, 
  VHS glitch, chrome/liquid overlay stills. Dimmed/desaturated so 
  terminal text stays legible over it (like a security monitor 
  humming behind glass).
- Primary embed: Spotify track — 
  https://open.spotify.com/track/5elUf5WWJ69qIDsBmCfQUc
- Secondary embed: Apple Music — 
  https://music.apple.com/us/album/crashing-out-single/6783549319
- YouTube: link to https://www.youtube.com/@awillsss
- Social row: Instagram, TikTok
- **Join/email CTA visible in this module**, not just main nav — 
  this is peak-interest traffic (just heard the song), best 
  conversion moment for email capture

### YouTube
Latest video embed + channel link.

### Tour / Shows
Dates list. Ship as "coming soon" state for now — no dates live yet.

### Join
Email signup, framed as "join the community," not a generic 
newsletter form.

### About
Short bio.

---

## Style
Retro-tech minimal — one accent color per theme (not five theme 
swatches), flat surfaces (no bevels/gradients), generous whitespace, 
monospace/pixel display font for headers only, clean sans-serif for 
body copy. "Vintage terminal hardware," not "1998 desktop OS." 
Playful personality through copy and micro-interactions, not visual 
clutter.

The "CRASHING OUT" handwritten title treatment (from the video 
stills) can extend into a reusable logo/wordmark across the site.

**Cut entirely:** multi-window desktop, taskbar/start menu, 5-color 
theme picker, minesweeper, draw-a-message gate, gradient backgrounds.

---

## Layout & Accessibility
- Mobile-first, single scrolling page
- Primary CTA (listen or join) visible above the fold at all times
- Boot-up moment: brief static/glitch frames before the terminal 
  intro types out
- Static image fallback of the hero for `prefers-reduced-motion` 
  visitors — grain/flicker loops can trigger motion sickness for 
  some visitors, this isn't optional
