# Greater Asia [Reachability](https://xuanx1.github.io/greaterAsianTrains/)

An interactive [visualisation](https://xuanx1.github.io/greaterAsianTrains/) of rail reach across the continent —
**4,429 stations, 5,109 services, 31 countries with passenger rail**.

Pick a starting station, drag the time slider, and watch the green web grow
to show every station you can reach by passenger train within the chosen
budget — dark green for close, paler green further out. Click any reachable
station to draw the multi-leg route with operator, line name, and per-leg
times. Click an isolated station to surface a full **journey plan** that
alternates rail sections with the bridge gaps you'd need to fill to get
there.

## What you can do

| | |
|---|---|
| **Pick origin** | Use the grouped dropdown, or click any station on the map. |
| **Time budget** | Slider 1h → 48h. Color ramp from forest green (≤1h) to pale celadon (max). |
| **Click reachable** | Draws the fastest route with leg-by-leg detail. |
| **Click disconnected** | Shows the great-circle gap + proposed bridge to close it. |
| **Hover any station** | Top-center info card with travel time + arriving service. |
| **HSR vs all trains** | Toggle to compare high-speed-only coverage. |
| **Day / Night** | Two themes; cream paper or deep ink. |
| **Tweaks** | Bottom-right panel: extend max-hours, etc. |

## Coverage

Station count by country (descending):

| | | | | | |
|---|---:|---|---:|---|---:|
| Russia | 2,318 | Iran | 116 | Indonesia | 76 |
| China | 474 | South Korea | 113 | Thailand | 74 |
| Japan | 232 | Bangladesh | 68 | Turkey | 74 |
| India | 205 | Vietnam | 64 | Pakistan | 73 |

Plus North Korea 57, Myanmar 55, Uzbekistan 54, Sri Lanka 44,
Turkmenistan 43, Saudi Arabia 38, Malaysia 36, Azerbaijan 32,
Kazakhstan 32, Taiwan 29, Mongolia 26, Georgia 23, Armenia 22,
Cambodia 21, Israel 17, Nepal 6, Laos 4, Hong Kong 1, Singapore 1,
Tajikistan 1.

- **East Asia**: China — full HSR (Jinghu, Jingguang, Lan-Xin, Hada,
  Chengdu–Kunming) plus 350 OSM-derived intermediate stations on the
  branch and trunk corridors; Hong Kong; Japan (all Shinkansen + JR
  Hokkaido limited express); South Korea (KTX); Taiwan (THSR + TRA Yilan
  + Western + Pingtung + East + South-Link); North Korea (Beijing–
  Pyongyang K27); Mongolia (UBTZ); Russia (Trans-Siberian, Trans-
  Mongolian K23, Trans-Manchurian K19, BAM, Caucasus, NW & far-north
  spurs).
- **Southeast Asia**: Vietnam (Reunification Express + Hà Nội–Đồng
  Đăng / Lào Cai); Laos (CLR); Thailand (SRT all lines); Cambodia
  (Royal Railway); Malaysia (KTM ETS + South line); Singapore;
  Myanmar; Indonesia (Whoosh HSR + KAI Java network).
- **South Asia**: India (Rajdhani / Vande Bharat / Shatabdi / Mail-
  Express); Bangladesh (Maitree + Bandhan cross-border to India);
  Pakistan (Green Line, Karakoram, Awam); Sri Lanka.
- **Central Asia**: Kazakhstan (Talgo); Uzbekistan (Afrosiyob HSR);
  Turkmenistan; Tajikistan.
- **West Asia**: Iran (RAI); Turkey (YHT + BTK to Tbilisi/Baku);
  Caucasus (Georgia / Armenia / Azerbaijan); Israel; Saudi Arabia
  (Haramain HSR).

22 countries with no scheduled intercity passenger rail are **hatched**
on the map: Afghanistan, Bhutan, Nepal, the Gulf states, Iraq, Syria,
Lebanon, Jordan, Cyprus, Kyrgyzstan, Philippines, Brunei, Timor-Leste,
Macao, Maldives, Papua New Guinea, Yemen.

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

## Project layout

```
great-asia/
├── index.html          ← root: CSS, font links, script tags
├── app.jsx             ← React app: MapView, Sidebar, RouteCard, BridgeCard
├── data.js             ← curated STATIONS, ROUTES, REGIONS, HATCH_COUNTRY_IDS
├── data_extra.js       ← OSM-derived supplement across 23 countries
│                         (HOTOSM bulk dumps + India global + 14 live Overpass
│                          fetches for the long-tail networks)
├── data_ru.js          ← RU supplement (Trolleway gpkg 365 + Overpass FE/Sib/
│                          Caucasus 600), K-NN connectivity
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
- **Cormorant Garamond + DM Sans + DM Mono** via Google Fonts (the only
  external runtime fetch; degrades gracefully to system fonts).

### Data files

Three layered scripts, loaded in order from `index.html`:

```js
// data.js — hand-curated core
window.STATIONS  // [{ id, name, native?, country (ISO-2), lat, lng }, …]
window.ROUTES    // [{ from, to, h, type: "hsr"|"conv", line, op }, …]
window.REGIONS   // [{ name: "East Asia", codes: ["CN","JP",…] }, …]
window.HATCH_COUNTRY_IDS  // Set<string> of ISO numeric IDs to hatch
window.COUNTRY_NAMES      // ISO-2 → display name

// data_extra.js — HOTOSM CN/TW supplement
window.EXTRA_STATIONS    // OSM-derived stations, ids prefixed osm_cn_/osm_tw_
window.EXTRA_ROUTES      // OSM-derived routes (nearest-neighbour and corridor links)

// data_ru.js — Trolleway russian-railways-simplegeodata supplement
window.EXTRA_STATIONS_RU // ru_<fid> stations from stations.gpkg
window.EXTRA_ROUTES_RU   // each spur → nearest curated RU hub
```

Each supplement file appends to `window.STATIONS` / `window.ROUTES`
after loading. Routes are **bidirectional** (the graph builder adds both
directions). Times include cross-border friction (bogie change at
Erenhot / Zabaikalsk / Sarakhs, customs at Mekong / Pingxiang / Đồng
Đăng) folded into the adjacent segment.

To add a station: append to `STATIONS` with a unique slug `id`, a
two-letter country code from the `COUNTRY_NAMES` table, and lat/lng in
decimal degrees. To add a route: append an entry to `ROUTES`.

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
| `overpass_{cc}.json` | live Overpass fetches for BD/LK/MY/MM/SA/IL/KH/NP/GE/AM/AZ/UZ/TM/KP + RU FE/Sib/Caucasus — cached as JSON so re-runs don't hit the API |
| `railways.geojson` | global Natural Earth railway lines (~92 MB) — unused at runtime |
| `*.py` | build & validation scripts that regenerate `data_ru.js` and validate cross-file integrity |

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
  are not modelled.
- **Bridge suggestions** use great-circle distance — they ignore terrain,
  bathymetry, geopolitics, and gauge differences. Treat them as
  approximate, not engineering proposals.
- Suspended services are excluded: Samjhauta Express (India–Pakistan,
  suspended 2019), Thar Express (suspended), Trans-Asia Express
  (Türkiye–Iran, irregular), Quetta–Zahedan (effectively freight-only).
- The DMZ rail crossing between Dorasan and Kaesong has been technically
  reconnected but has never carried passenger traffic; treated as
  disconnected.
- Saudi Arabia's Haramain HSR and SAR East Line are not yet linked to any
  external network — Saudi forms its own connected component.
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
  Pakistan Railways; Sri Lanka Railways; RAI (Iran); TCDD (YHT + BTK);
  KTZ; UTY (Afrosiyob); TDY (Turkmenistan); RZD (Trans-Siberian + BAM);
  UBTZ (Mongolia); ADY / GR (BTK through-service); SAR (Saudi).
- [trolleway/russian-railways-simplegeodata](https://github.com/trolleway/russian-railways-simplegeodata) `stations.gpkg` (CC-licensed) for the supplemental RZD nodes.
- [HOTOSM](https://data.humdata.org/organization/hot) railways exports (CC-BY-SA via OSM) for the 12-country bulk dumps + India global.
- [Overpass API](https://overpass-api.de/) live fetches for the long-tail networks (Bangladesh, Sri Lanka, Malaysia, Myanmar, Saudi Arabia, Israel, Cambodia, Nepal, Georgia, Armenia, Azerbaijan, Uzbekistan, Turkmenistan, North Korea) and for Russia's Far East / Siberia / Caucasus gap regions.
- Wikipedia, OpenStreetMap, OpenRailwayMap, Seat 61 (Mark Smith).
- Natural Earth public-domain country boundaries.

## License

MIT, but the data files are a curated compilation — please credit
Great Asia if you reuse them whole. The Natural Earth basemap is public
domain; Google Fonts are under the SIL Open Font License. HOTOSM/OSM
data is © OpenStreetMap contributors under ODbL.
