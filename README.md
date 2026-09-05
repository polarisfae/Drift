# Drift

A small ambient space to sit in for a few minutes. Soft, diffused pastel
visuals drift and blend on screen while three generative sound layers —
rain, a low drone, and scattered wind chimes — mix together under your
control. Nothing to win, nothing to read; just something to keep in a tab
and unwind to.

Every session sounds and looks a little different: the chime timing and
blob motion are randomized, and colors slowly cross-fade between four
moods (Bloom, Meadow, Dawn, Dusk) whenever you switch.

## Running it

It's a static site with no build step or dependencies. Any local server
works, for example:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`. (Opening `index.html` directly also
mostly works, but some browsers restrict audio/canvas APIs on the `file://`
origin, so a local server is more reliable.)

## How it's built

- `index.html` — page structure and controls
- `styles.css` — layout, the glassy control panel, palette swatches
- `app.js` — everything else:
  - a `<canvas>` scene of soft, blurred, multiply-blended blobs drifting
    and pulsing, with a small animated film-grain overlay on top
  - a Web Audio graph: filtered noise for rain, detuned low oscillators
    for the drone, and randomly-timed pentatonic notes for the chimes,
    with the chimes routed through a simple feedback-delay reverb
  - slider inputs that map directly to each layer's gain node, and a
    palette switcher that cross-fades the visual mood over a couple of
    seconds

Audio only starts after the "Begin" button (browsers require a user
gesture before audio can play), and everything runs client-side — no
backend, no build tooling, no external services.
