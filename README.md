# Greater Asia [Reachability](https://xuanx1.github.io/greaterAsianTrains/)

An interactive [visualisation](https://xuanx1.github.io/greaterAsianTrains/) of rail reach across the continent —
**51,079 stations and piers, 3,216 passenger lines, 8,046 ferry routes, 39 countries**.

<img width="1920" height="915" alt="Screenshot 2026-05-14 211258" src="https://github.com/user-attachments/assets/b98c5f69-fef4-4f5b-bd39-0c2be5246cf7" />

Pick a starting station, drag the time slider, and watch the green web grow
to show every station you can reach by passenger train (and, optionally,
ferry) within the chosen budget — dark green for close, paler green further
out. Click any reachable station to draw the route: each ride with its line,
operator, frequency and time. Click an isolated station to get a **journey
plan** that alternates rail sections with the missing links you'd need to
build to get there.

## What you can do

| | |
|---|---|
| **Pick origin** | Searchable picker (all 51 k stations), or click any station / label on the map. |
| **Time budget** | Slider 1 h → 48 h. Colour ramp from forest green (close) to pale celadon (budget). |
| **Click reachable** | Draws the fastest route, grouped into rides: line, operator, stops, frequency, time. |
| **Click disconnected** | Shows the rail sections + great-circle bridges that would close the gap. |
| **Hover any station** | Info card with travel time, the line you arrive on and its frequency. |
| **All Trains ↔ HSR Only** | Full network or high-speed only. |
| **+ Ferries ↔ No Ferries** | Include scheduled ferries (and the drive from a pier to its nearest station). |
| **Continental ↔ Regional** | Plain country fills, or six sub-region tints. |
| **Day ↔ Night** | Cream paper or deep ink. |
| **Contours ↔ Lines** | Reachability isochrones, or the rail lines themselves coloured by travel time. |

Works on phones and tablets: below 1024 px wide the map goes full-screen with
a compact top bar (origin + time budget) and a bottom sheet with
**Reachable / Route / Network / About** tabs. Pinch to zoom, tap a station to
route to it.

## Data

The network is generated from the **Transits of the World** intercity + ferry
catalogue (the `metroman` project), cut to Asia:

- **Lines** — OpenStreetMap `route=train` relations (plus curated corridors
  over OSM track where relations are missing). Every line keeps its stops in
  order with their km. Freight-only and closed lines are left out.
- **Track** — each line is drawn along its full-resolution OpenStreetMap
  track, cut at every stop and Douglas–Peucker-simplified (~400 m); hops
  between closely spaced halts are drawn straight.
- **Times** — 2,535 lines carry a published journey time (operators, Yandex
  Raspisaniya, 12306, NTES, Wikipedia…); the rest run at the median published
  speed of the same kind of train in the same country (shown as `≈ est.`).
- **Ferries** — OpenStreetMap `route=ferry` courses; published crossing times
  where known, else 30 km/h, plus 30 min boarding. A pier with no railway is
  joined to the nearest station within 30 km by a drive.
- **Transfers** — stations a short walk apart are joined, and a city's
  separate terminals (Moscow, Beijing…) get a cross-town transfer. Closed
  borders (Korean DMZ, Armenia–Türkiye/Azerbaijan, Israel–Lebanon/Syria) are
  never crossed by a transfer.
- **Scope** — the Asian countries in the map's Asia set (Russia whole), inside
  17.5°E–150.5°E, 12°S–72°N. A line that leaves the scope in its middle
  (Moscow – Kaliningrad via Belarus / Lithuania) keeps its transit stops.

Countries with no intercity passenger rail in the network are **hatched**.

### Rebuilding the data

```sh
node scripts/build_network.cjs "../metroman 31oct"   # → data_net.js (~1 min)
```

**The site is standalone.** `data_net.js` is a committed snapshot; nothing is
fetched from metroman at runtime, and the metroman folder is only needed to
rebuild. The snapshot it came from is recorded in the file's header and in
`NET.meta.snapshot` (folder name, plus the date and a sha256 fingerprint of
each catalogue input). The current one is `metroman 31oct`, with catalogue
files up to 2026-11-17. Changes made in metroman later appear here only after
a rebuild and commit.

The script only reads the metroman folder (default `../metroman 31oct`, or
`$METROMAN`) and reuses its own English naming rules (`line_names.js`,
`latin_names.js`, `station_names_en.js`). Where a machine transliteration
drops vowels (Arabic, Hebrew, Urdu, Persian, Burmese, Thai scripts), the
station is shown under its native name instead.

## Routing model

- **Reachability** — time-weighted Dijkstra (binary heap on typed arrays)
  over every station-to-station hop, each hop at its fastest line. Changes
  between trains are not timed.
- **Rides** — the route card groups the hops into rides: from each station,
  the line that reaches furthest along the path without being much slower.
- **Disconnected destinations** — a rail-km Dijkstra over the network plus
  candidate great-circle bridges between networks (each station's 6 nearest
  stations of other networks, ≤ 1,600 km, 3× penalty); each bridge is then
  moved to the closest station pair of the two networks and every rail
  section is re-timed.
- **Isochrones** — earliest arrival per 0.18° cell, spread off-rail at
  10 km/h (≤ 280 km), box-blurred, marching squares at 0.5 / 1 / 2 / 3 / 5 /
  7 / 10 / 14 / 18 / 24 / 32 / 40 / 48 h, Catmull-Rom smoothed. Computed once
  per origin; the slider only picks levels.

## Rendering + performance

The map is three stacked `<canvas>` layers instead of tens of thousands of
SVG nodes:

| Layer | Contents | Redrawn when |
|---|---|---|
| base | land, borders, hatching, divide, disputed areas, faint network (cached bitmap) + isochrones | view settles, theme / region / mode change, slider (contours) |
| mid | network coloured by arrival time (96 half-hour buckets), selected journey | origin / mode / slider (lines) |
| top | station dots, labels (collision-tested), bridges, country names | hover, selection, every frame of a gesture |

- **Gestures**: while panning / zooming, base and mid are only shifted and
  scaled as bitmaps; the sharp redraw happens when the gesture ends.
- **Level of detail**: vertices are snapped to a half-pixel grid for the
  current zoom, so the thousands of sub-pixel hops between halts vanish at
  full extent.
- **No in-browser Babel**: `app.jsx` is compiled to `app.js` ahead of time,
  and React ships as its production build.
- No CSS backdrop blur over the map, no endless contour pulse animation.

Measured in headless Chrome (software rendering, 1600 × 920), old SVG build →
this build: first render 10.2 s → ~2.1 s; six wheel-zoom steps 7.0 s → 0.25 s
(median frame 7 ms while panning); slider step 450–610 ms → 80–150 ms.

## Project layout

```
greaterAsianTrains/
├── index.html          ← CSS, script tags
├── app.jsx             ← the app (source) — edit this
├── app.js              ← compiled from app.jsx (served)
├── data_net.js         ← the network: stations, lines, track, ferries, transfers (generated)
├── data_meta.js        ← country names, region grouping, rail-less countries
├── data_disputed.js    ← 33 disputed-area outlines (Natural Earth 10m)
├── data_continents.js  ← Europe / Asia divide (asia_europe_border geojson)
├── scripts/
│   ├── build_network.cjs  ← metroman catalogue → data_net.js
│   └── build_app.cjs      ← app.jsx → app.js
├── assets/countries-50m.json   ← Natural Earth via world-atlas
├── vendor/             ← React 18.3.1 (production), d3 7, topojson-client 3,
│                          Babel standalone (build-time only), fonts
└── uploads/            ← source datasets + scripts of the earlier hand-built dataset
```

All runtime dependencies are local — no network calls.

### Editing

```sh
# after changing app.jsx
node scripts/build_app.cjs
# preview
python -m http.server 8000   # then open http://localhost:8000
```

`index.html` must be served over http (the base map is fetched), not opened
as a file.

## Caveats

- Times are in-vehicle estimates from published journey times or typical
  speeds, not a timetable; waiting and changing trains are not counted.
- Frequency is shown where the catalogue has it; otherwise the leg shows its
  estimated speed.
- Bridge suggestions use great-circle distance — they ignore terrain,
  bathymetry, geopolitics and gauge. Treat them as indications, not
  engineering proposals.
- Station names come from OpenStreetMap via the catalogue; some halts are
  named only by their km post (`1802 km`) or have no name at all.

## Credits

- Network: Transits of the World catalogue — © OpenStreetMap contributors (ODbL).
- Base map: Natural Earth (public domain) via `world-atlas`.
- Fonts: Space Grotesk, DM Sans, DM Mono (SIL Open Font License).
