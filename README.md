# Greater Asia [Reachability](https://xuanx1.github.io/greaterAsianTrains/)

An interactive [visualisation](https://xuanx1.github.io/greaterAsianTrains/) of rail reach across the continent —
**4,382 stations, 5,031 services, 35 countries with passenger rail**.

Pick a starting station, drag the time slider, and watch the green web grow
to show every station you can reach by passenger train within the chosen
budget — dark green for close, paler green further out. Click any reachable
station to draw the multi-leg route with operator, line name, frequency,
and per-leg times. Click an isolated station to surface a full **journey
plan** that alternates rail sections with the bridge gaps you'd need to
fill to get there.

## What you can do

| | |
|---|---|
| **Pick origin** | Use the grouped dropdown, or click any station on the map. |
| **Time budget** | Slider 1h → 48h. Color ramp from forest green (≤1h) to pale celadon (max). |
| **Click reachable** | Draws the fastest route with leg-by-leg detail + service frequency. |
| **Click disconnected** | Shows the great-circle gap + proposed bridge to close it. |
| **Hover any station** | Top-center info card with travel time + arriving service + frequency. |
| **HSR vs all trains** | Toggle to compare high-speed-only coverage. |
| **Day / Night** | Two themes; cream paper or deep ink. |

## Coverage

Station count by country (top 12):

| | | | | | |
|---|---:|---|---:|---|---:|
| Russia | 2,124 | Iran | 125 | Indonesia | 77 |
| China | 555 | South Korea | 111 | Turkey | 77 |
| Japan | 264 | Thailand | 90 | Uzbekistan | 73 |
| India | 260 | Pakistan | 72 | Kazakhstan | 68 |

Plus Vietnam 66, North Korea 62, Sri Lanka 44, Azerbaijan 38,
Bangladesh 35, Malaysia 33, Taiwan 29, Myanmar 25, Armenia 22,
Saudi Arabia 22, Mongolia 21, Turkmenistan 20, Cambodia 17,
Georgia 15, Israel 15, Kyrgyzstan 5, Laos 4, UAE 4, Iraq 3,
Nepal 2, Tajikistan 2, Hong Kong 1, Singapore 1.

- **East Asia**: China — full HSR (Jinghu, Jingguang, Lan-Xin, Hada,
  Chengdu–Kunming) plus 350 OSM-derived intermediate stations on the
  branch and trunk corridors; Hong Kong; Japan (all Shinkansen + JR
  Hokkaido limited express); South Korea (KTX); Taiwan (THSR + TRA Yilan
  + Western + Pingtung + East + South-Link); North Korea (Beijing–
  Pyongyang K27); Mongolia (UBTZ); Russia (Trans-Siberian, Trans-
  Mongolian K23, Trans-Manchurian K19, BAM, Caucasus, NW & far-north
  spurs).
- **Southeast Asia**: Vietnam (Reunification Express, Hà Nội–Hải Phòng,
  Hà Nội–Đồng Đăng / Lào Cai); Laos (CLR); Thailand (SRT all lines);
  Cambodia (Royal Railway northern + southern with intermediate stops);
  Malaysia (KTM ETS + South line); Singapore; Myanmar; Indonesia (Whoosh
  HSR + KAI Java network).
- **South Asia**: India (Rajdhani / Vande Bharat / Shatabdi / Mail-
  Express); Bangladesh (Maitree + Bandhan cross-border to India);
  Pakistan (Green Line, Karakoram, Awam); Sri Lanka.
- **Central Asia**: Kazakhstan (Talgo); Uzbekistan (Afrosiyob HSR +
  Fergana branch + Karakalpakstan + Termez); Turkmenistan (Trans-Caspian
  + Türkmenabat); Tajikistan; Kyrgyzstan (Issyk-Kul tourist).
- **West Asia**: Iran (RAI); Iraq (IRR Baghdad–Basra sleeper +
  Mosul); Turkey (YHT + Doğu/Güney Express to Diyarbakır / Kars / Van);
  Caucasus (Georgia with Tbilisi–Gori–Khashuri–Kutaisi–Batumi + West
  branches to Poti / Zugdidi; Armenia with Vanadzor; Azerbaijan with
  Ağstafa / Yevlakh / Sumqayıt); Israel; Saudi Arabia (Haramain HSR);
  **UAE** (Etihad Rail Hafeet Express, Abu Dhabi → Fujairah, launched
  2024–25).

19 countries with no scheduled intercity passenger rail are **hatched**
on the map: Afghanistan, Bahrain, Bhutan, Brunei, Cyprus, Jordan,
Kuwait, Lebanon, Macao, Maldives, Nepal (one short cross-border line),
Oman, Palestine, Papua New Guinea, Philippines (commuter only),
Qatar, Syria, Timor-Leste, Yemen.

Countries outside the Asian set get a darker fill so the focus stays on
the in-scope landmass.

## Disconnectivity model

The rail network is a weighted undirected graph. **Dijkstra** computes the
shortest-time path; stations the algorithm cannot reach are flagged as
**disconnected**, sorted by great-circle distance from the origin, and
listed under their own divider in the right panel.

When a disconnected station is clicked, the app:

1. computes the great-circle distance from origin (shown as the headline
   number on the bridge card);
2. finds the **nearest reachable station** to the disconnected target by
   great-circle distance;
3. draws the proposed bridge as a dashed amber line on the map, with the
   gap distance labelled inline;
4. shows a textual recommendation: *"A passenger rail link of N km between
   A and B would close the gap to your network."*

Typical bridges surfaced by the model:
- **Korea Strait** — Busan ↔ Hakata, ~220 km (well-studied undersea
  proposal).
- **Java to mainland SE Asia** — Jakarta ↔ Singapore, ~880 km.
- **Sri Lanka** — Jaffna ↔ Trivandrum / Madurai, ~330 km across the
  Palk Strait.
- **Saudi Arabia ↔ Levant/Türkiye** — Medina ↔ Aqaba/Amman → would have
  to traverse Jordan (currently hatched) to reconnect.
- **Israel** — Haifa ↔ Beirut, ~140 km along the coast.

## Map rendering

- **Continuous polylines.** Routes are grouped by named rail line (e.g.
  *Jinghu HSR*, *Reunification Express*, *Trans-Mongolian K23*) and
  drawn as one chained `<path>` per service rather than a string of
  butt-jointed `<line>` segments. At any zoom level a named service
  reads as one smooth track instead of dots-connecting-lines.
- **Express vs intermediate dedup.** When the dataset carries both a
  long express edge (Beijing → Shanghai 4h 15m) *and* the chain through
  every intermediate, the renderer detects the redundant chord by
  BFS-walking the corridor along the direct edge — if the stations
  between can already chain a path within ±15 % of the chord length,
  the chord is hidden visually but kept in the routing graph so
  Dijkstra still picks the faster express.
- **Reachability contours.** Marching-squares on a 0.18° lat/lng grid
  produces nested isochrones at 0.5 / 1 / 2 / 3 / 5 / 7 / 10 / 14 / 18
  / 24 / 32 / 40 / 48-hour bands, smoothed with a Catmull-Rom closed
  spline. The grid is built once per origin / HSR-toggle change; the
  per-frame work when scrubbing the time slider is just slicing the
  precomputed `dStrings` array.
- **Disputed-area outlines.** 33 dotted boundaries from Natural Earth's
  `ne_10m_admin_0_disputed_areas` polygons (Abkhazia, South Ossetia,
  Crimea, Northern Cyprus, Kashmir / Aksai Chin / Arunachal /
  Shaksgam / Gilgit-Baltistan / Azad Kashmir / Demchok / Siachen, Gaza
  / West Bank, Golan Heights + UNDOF Zone, Korean DMZ N&S, Nagorno-
  Karabakh, Transnistria, Donetsk PR + Luhansk PR, Bhutan claims, Kuril
  Is., Paracel + Spratly Is., Shebaa Farms, Om Parvat sector + Tirpani/
  Samdu/Bara Hotii Valleys). A wider land-coloured stroke under each
  dotted outline erases the de-jure country border wherever it
  coincides with the disputed boundary — otherwise the user would see
  a solid line and a dotted overlay stacked on the same path.
- **Performance.** Per-station projection (`stationPts` / `ptById`) is
  memoised on the projection so panning doesn't reproject ~4,400
  stations every frame. d3-zoom events and time-slider `onChange` are
  both coalesced through `requestAnimationFrame` so React reconciles
  at most once per frame regardless of input rate.

## Trip details

Each leg of a multi-leg journey is rendered with:

- **HSR / Conv** badge — operator class.
- **From → To** station names with arrow.
- **Duration** as `h × m` (rounded to half-hours from the source
  timetable).
- **Line name** (e.g. *Hafeet Express*, *Stadler express*, *BTK /
  overnight*).
- **Operator** — China Railway, RZD, Etihad Rail, etc.
- **Frequency** badge — `Frequent (hourly+)` for major HSR corridors,
  `Several daily` for Etihad / Haramain / Afrosiyob, `Daily (overnight)`
  for sleepers, `Every other day` for Tbilisi–Yerevan, `1–2×/week`
  for Trans-Mongolian / Trans-Manchurian / BTK Baku–Tbilisi–Kars,
  `Seasonal` for the Issyk-Kul tourist train, `Heritage / limited` for
  Hejaz-era services, `Multiple daily` otherwise. Routes can override
  with an explicit `freq` field; otherwise the label is inferred from
  the `line` and `op` strings.

## Project layout

```
greaterAsianTrains/
├── index.html          ← root: CSS, font links, script tags
├── app.jsx             ← React app: MapView, Sidebar, RouteCard, BridgeCard
├── data.js             ← curated STATIONS, ROUTES, REGIONS, HATCH_COUNTRY_IDS
├── data_extra.js       ← OSM-derived supplement across 23 countries
│                         (HOTOSM bulk dumps + India global + 14 live Overpass
│                          fetches for the long-tail networks)
├── data_ru.js          ← RU supplement (Trolleway gpkg 365 + Overpass FE/Sib/
│                          Caucasus 600), K-NN connectivity
├── data_disputed.js    ← 33 Asia-relevant disputed-area outlines, generated
│                          from Natural Earth ne_10m_admin_0_disputed_areas
│                          by uploads/build_disputed.py
├── uploads/            ← raw source datasets (HOTOSM geojson, gpkg) + build scripts
├── assets/
│   └── countries-50m.json   ← Natural Earth via world-atlas (public domain)
├── vendor/             ← React, ReactDOM, Babel-standalone, d3, topojson-client
└── README.md
```

All third-party dependencies are local — no network calls at runtime.

### Tech

- **React 18.3.1** (development UMD build, in-browser Babel-standalone for
  inline JSX). Pinned, no CDN at runtime.
- **d3 7.9** for `geoMercator` + `geoPath`.
- **topojson-client 3** to decode the basemap TopoJSON.
- **world-atlas 2.0.2** `countries-50m.json` (Natural Earth, public domain).
- **Natural Earth 10m** disputed-area polygons (public domain), filtered
  to Asia and simplified at ~0.012° tolerance.
- **Space Grotesk + DM Sans + DM Mono** via Google Fonts (the only
  external runtime fetch; degrades gracefully to system fonts).

### Data files

Four data scripts, loaded in order from `index.html`:

```js
// data.js — hand-curated core
window.STATIONS  // [{ id, name, native?, country (ISO-2), lat, lng }, …]
window.ROUTES    // [{ from, to, h, type: "hsr"|"conv", line, op, freq? }, …]
window.REGIONS   // [{ name: "East Asia", codes: ["CN","JP",…] }, …]
window.HATCH_COUNTRY_IDS  // Set<string> of ISO numeric IDs to hatch
window.COUNTRY_NAMES      // ISO-2 → display name

// data_extra.js — HOTOSM + Overpass OSM supplement
// (appends directly to window.STATIONS / window.ROUTES)

// data_ru.js — Trolleway russian-railways-simplegeodata + Overpass
// FE/Sib/Caucasus supplement (appends to window.STATIONS / window.ROUTES)

// data_disputed.js — Natural Earth 10m disputed-area outlines
window.DISPUTED_LINES  // [{ name, rings: [[[lng,lat], …], …] }, …]
```

Each supplement appends to `window.STATIONS` / `window.ROUTES`
after loading. Routes are **bidirectional** (the graph builder adds both
directions). Times include cross-border friction (bogie change at
Erenhot / Zabaikalsk / Sarakhs, customs at Mekong / Pingxiang / Đồng
Đăng) folded into the adjacent segment.

To add a station: append to `STATIONS` with a unique slug `id`, a
two-letter country code from the `COUNTRY_NAMES` table, and lat/lng in
decimal degrees. To add a route: append an entry to `ROUTES`; optionally
include `freq: "1×/week (Sat)"` to override the default frequency label
that `freqLabel()` would otherwise infer from the line name.

### Native-name display

The hover card, dropdown, and lists all show `Name · Native`, but only
when the native string contributes information. `nativeOrNull(name,
native)` compares the two after stripping case, diacritics, punctuation,
and whitespace, so:

- "Bandung" / "Bandung" → English only (suppressed).
- "Huế" / "Huế" → English only (Latin == Latin after diacritic strip).
- "Tai'an" / "泰安" → "Tai'an · 泰安" (different scripts).
- "Singapore" / "新加坡 · Singapura · சிங்கப்பூர்" → all four official
  languages (English in `name`, Mandarin + Malay + Tamil in `native`).

Add the multilingual treatment to any station whose city is
officially multilingual; the comparator passes the joined string
through because it differs from the English name.

### Source datasets in `uploads/`

| File | Purpose |
|---|---|
| `stations.gpkg` | [trolleway/russian-railways-simplegeodata](https://github.com/trolleway/russian-railways-simplegeodata) — 408 RZD stations with name_ru / name_en / status |
| `hotosm_chn_railways_points_geojson.geojson` | HOTOSM CN — 16,280 points (350 imported) |
| `hotosm_jpn_railways_points_geojson.geojson` | HOTOSM JP — 8,749 points (200 imported) |
| `hotosm_kor_railways_points_geojson.geojson` | HOTOSM KR — 1,064 points (99 imported) |
| `hotosm_tur_railways_points_geojson.geojson` | HOTOSM TR — 1,034 points (60 imported) |
| `hotosm_kaz_railways_points_geojson.geojson` | HOTOSM KZ — 821 points (30 imported) |
| `hotosm_irn_railways_points_geojson.geojson` | HOTOSM IR — 706 points (100 imported) |
| `hotosm_idn_railways_points_geojson.geojson` | HOTOSM ID — 690 points (60 imported) |
| `hotosm_pak_railways_points_geojson.geojson` | HOTOSM PK — 634 points (60 imported) |
| `hotosm_tha_railways_points_geojson.geojson` | HOTOSM TH — 615 points (60 imported) |
| `hotosm_twn_railways_points_geojson.geojson` | HOTOSM TW — 544 points (19 imported) |
| `hotosm_vnm_railways_points_geojson.geojson` | HOTOSM VN — 289 points (50 imported) |
| `hotosm_mng_railways_points_geojson.geojson` | HOTOSM MN — 123 points (20 imported) |
| `railways.geojson` | HOTOSM India global — 8,947 points (145 imported) |
| `hotosm_*_railways_lines_geojson.geojson` | line geometry dumps — unused at runtime |
| `ne_disputed_polys.geojson` | Natural Earth `ne_10m_admin_0_disputed_areas` (filtered & simplified into `data_disputed.js` by `build_disputed.py`) |
| `overpass_{cc}.json` | live Overpass fetches for BD/LK/MY/MM/SA/IL/KH/NP/GE/AM/AZ/UZ/TM/KP + RU FE/Sib/Caucasus — cached as JSON so re-runs don't hit the API |
| `*.py` | build & validation scripts that regenerate `data_ru.js`, `data_disputed.js`, and validate cross-file integrity |

## Data ingest — sources, filters, connectivity

Three layered sources feed the graph:

1. **`data.js`** — hand-curated trunk (timetable-grade, with operator
   and line names). Doesn't change at ingest time.
2. **`data_extra.js`** — OSM-derived supplement across 23 countries:
   - **HOTOSM bulk dumps** for CN, JP, KR, TW, TH, VN, ID, PK, KZ, MN, TR
   - **HOTOSM India global** (`railways.geojson`, 8,947 nodes)
   - **HOTOSM Iran points**
   - **Overpass live fetches** for the long-tail networks with no HOTOSM
     dump: BD, LK, MY, MM, SA, IL, KH, NP, GE, AM, AZ, UZ, TM, KP
3. **`data_ru.js`** — RU supplement:
   - **Trolleway gpkg** (intercity-only, well-named): name-dedup against
     curated + 3 km hub-proximity dedup
   - **Overpass live fetches** for Far East / Siberia / Caucasus, which
     trolleway covers poorly — closes the contour plateaus from
     Vladivostok / Khabarovsk / Krasnoyarsk / Tomsk / Sochi origins

### Name-quality filter

Every OSM ingest passes `is_acceptable(name_en, name_local)` from
`uploads/name_quality.py`. It rejects names that look like real labels
but aren't passenger stations:

- km markers (`80 км`, `198km`, `1437 km`, `212 км`)
- numeric placeholders (`№ 21`, `# 23`)
- generic English (`Departure Station`, `East Station`, `Terminal Bus`)
- siding / depot / depo / разъезд / port-only / school / university /
  hospital / museum / generic "yard" / "halt" / "junction" alone
- pure single-character or empty names

So entries like the Kazakhstan `Departure Station` / `Siding № 2` /
`80 км` and the trolleway `285 км` / `Depo` are dropped at ingest *and*
were retroactively removed from the existing files via a sweep pass.

### Dedup floors

- Name-dedup against curated stations of the same country (English or
  local script), normalised case/punctuation/ё→е — catches translit
  variants (Ekaterinburg=Yekaterinburg, Moskva=Moscow, Tinda=Tynda).
- Per-country distance floor: JP/KR 15 km, CN/TH/VN 20 km, RU 20 km
  (Caucasus 30 km), India/Iran 25 km, others 25 km. Tuned to network
  density — denser HSR networks need a tighter floor.
- Trolleway RU additionally uses 3 km hub-proximity to fold alt-name
  yards (Adler=Sochi, SPb=St P, Yaroslavl-Moskovsky, Tomsk-2, etc.)
  while still keeping legitimate spurs near hubs (Esto-Sadok, Roza
  Khutor).

### Connectivity rule

Every imported station gets:

1. The nearest **curated station of its own country** — preserves
   long-distance fan-in so a hub-rooted origin still reaches every leaf.
2. Up to **two nearest pool-wide neighbours** (curated *or* other
   imported) within 250–300 km — chains stations along their actual
   corridor.

Edges are canonicalised (sorted endpoints) so A→B + B→A never both
appear. The old "single nearest curated hub" rule left long contour
plateaus — from Murmansk, nothing was reachable between 6 h (last local
spur) and 18 h (Petrozavodsk) because every Kola-Line intermediate
radiated back to Murmansk instead of chaining south. From Vladivostok,
nothing between 0 h and 12 h because the trolleway gpkg has almost no
Far East coverage. Under the new K-NN rule plus the Overpass FE/Sib/
Caucasus densification, the time buckets fill smoothly from every
Russian origin.

## Caveats

- **Times** are rounded to half-hours and reflect the *fastest scheduled
  service*. Real-world delays, infrequent departures, and seasonal cuts
  are not modelled — see the **frequency** field on each leg for an
  approximate cadence.
- **Bridge suggestions** use great-circle distance — they ignore terrain,
  bathymetry, geopolitics, and gauge differences. Treat them as
  approximate, not engineering proposals.
- Suspended services are excluded: Samjhauta Express (India–Pakistan,
  suspended 2019), Thar Express (suspended), Trans-Asia Express
  (Türkiye–Iran, irregular), Quetta–Zahedan (effectively freight-only).
- The DMZ rail crossing between Dorasan and Kaesong has been technically
  reconnected but has never carried passenger traffic; treated as
  disconnected.
- Saudi Arabia's Haramain HSR and SAR East Line, plus UAE's Etihad Rail
  Hafeet Express, are not yet linked to any external network — each
  forms its own connected component.
- The five far-north Komi/Yamal spurs (Vorkuta, Labytnangi, Usinsk, Synya,
  Pechora) connect to Perm or Tyumen by great-circle distance; the real
  RZD topology routes them via Kirov–Kotlas. Their `h` values are
  upper bounds, not literal journey times.
- `data_extra.js` OSM-derived links labelled "OSM connector (fallback)"
  or "OSM last-resort" are nearest-neighbour fillers, not surveyed
  passenger services — they keep the graph connected but reach times
  through those legs are coarse.

## Data sources

- China Railway 12306 timetables.
- JR Group timetables (Shinkansen Hayabusa / Nozomi / Sakura / etc.).
- Korail / SR; Taiwan HSR & TRA; KCIC (Whoosh); KTM Berhad ETS; SRT
  Thailand; Vietnam Railways; Indian Railways NTES; Bangladesh Railway;
  Pakistan Railways; Sri Lanka Railways; RAI (Iran); IRR (Iraqi Republic
  Railways); TCDD (YHT + Doğu/Güney + BTK); KTZ; UTY (Afrosiyob); TDY
  (Turkmenistan); RZD (Trans-Siberian + BAM); UBTZ (Mongolia); ADY / GR
  (BTK through-service); SAR (Saudi); Etihad Rail (UAE Hafeet Express);
  Kyrgyz Temir Joly (Issyk-Kul tourist).
- [trolleway/russian-railways-simplegeodata](https://github.com/trolleway/russian-railways-simplegeodata) `stations.gpkg` (CC-licensed) for the supplemental RZD nodes.
- [HOTOSM](https://data.humdata.org/organization/hot) railways exports (CC-BY-SA via OSM) for the 12-country bulk dumps + India global.
- [Overpass API](https://overpass-api.de/) live fetches for the long-tail networks (Bangladesh, Sri Lanka, Malaysia, Myanmar, Saudi Arabia, Israel, Cambodia, Nepal, Georgia, Armenia, Azerbaijan, Uzbekistan, Turkmenistan, North Korea) and for Russia's Far East / Siberia / Caucasus gap regions.
- [Natural Earth](https://www.naturalearthdata.com/) public-domain country boundaries (`countries-50m.json` via world-atlas) and `ne_10m_admin_0_disputed_areas` for the dotted dispute overlays.
- Wikipedia, OpenStreetMap, OpenRailwayMap, Seat 61 (Mark Smith).

## License

MIT, but the data files are a curated compilation — please credit
Greater Asia Reachability if you reuse them whole. The Natural Earth
basemap is public domain; Google Fonts are under the SIL Open Font
License. HOTOSM/OSM data is © OpenStreetMap contributors under ODbL.
