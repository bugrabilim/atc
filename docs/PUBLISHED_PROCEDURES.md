# Published procedure runtime integration

Updated: 2026-08-24 · runtime pack 2026.08.5

## Product boundary

The game now distinguishes chart-derived routes from generated vector routes. A
chart-derived route retains the published procedure identifier, waypoint order,
runway compatibility and the crossing constraints that are represented by the
current simulation. Its geometry is projected into the compact tactical scope;
it is not navigation-grade data and must not be used for flight planning.

## Runtime behaviour

- Random arrivals prefer a compatible chart-derived STAR/stack when one exists.
- The spawned aircraft follows the route until the controller issues a vector,
  direct, hold or approach clearance.
- Published maximum altitude, minimum altitude and maximum speed values influence
  the aircraft targets while the relevant fix is active.
- STAR/SID buttons are filtered by aircraft phase and assigned runway.
- Airports without a verified route continue to use clearly generated boundary
  vectors; they are not presented as published procedures.

## Included set

| Airport | Runtime procedures | Authority |
| --- | --- | --- |
| LTFM | RIXEN 1W STAR, VICEN 1S SID | DHMI AIP AIRAC AMDT 03/26 |
| EGLL | BNN, LAM, BIG and OCK holding stacks | Heathrow/NATS operating information |
| KLAX | IRNMN TWO, RYDRR TWO, WAYVE ONE arrivals | FAA d-TPP cycle 2608 |
| KJFK | CAMRN FIVE, PARCH FOUR plus PAWLN/PUCKY entry feeds | FAA d-TPP cycle 2608 |
| KATL | SITTH THREE runway transitions, GNDLF THREE feed | FAA d-TPP cycle 2608 |
| KDFW | BEREE THREE, BRDJE FIVE, JOVEM SIX, SHMPP THREE arrivals | FAA CIFP cycle 2608 |
| KORD | BENKY SIX, ERNNY EIGHT, ESSPO FIVE, FYTTE SEVEN arrivals | FAA CIFP cycle 2608 |
| KDEN | AALLE FOUR, CLASH FIVE, FLATI FIVE, SSKII FOUR arrivals | FAA CIFP cycle 2608 |
| KMCO | ALYNA FOUR, GRNCH FIVE, JOKRS FOUR, MUNGI ONE arrivals | FAA CIFP cycle 2608 |
| KMIA | BNFSH THREE, FROGZ FIVE, SNDBR THREE, VIICE TWO arrivals | FAA CIFP cycle 2608 |
| KLAS | CHOWW FOUR, COKTL FOUR, RKSTR FOUR, RNDRZ FOUR arrivals | FAA CIFP cycle 2608 |
| KSFO | ALWYS THREE, BDEGA FOUR, PIRAT THREE, RISTI ONE arrivals | FAA CIFP cycle 2608 |
| KCLT | BANKR SEVEN, CHSLY EIGHT, FILPZ SIX, MLLET FIVE arrivals | FAA CIFP cycle 2608 |
| KSEA | HAWKZ EIGHT, MARNR EIGHT arrivals | FAA CIFP cycle 2608 |
| KPHX | DSERT TWO, EAGUL SIX, HYDRR ONE, PINNG ONE arrivals | FAA CIFP cycle 2608 |
| KIAH | BAZBL ONE, GESNR TWO, HTOWN THREE, LINKK ONE arrivals | FAA CIFP cycle 2608 |
| VIDP | SP/ELKUX 6E-6H and BAVOX/POSIG 6A-6D arrivals | AIM India AIP AMDT 07/2026 |
| RKSI | GUKDO/KARBU 2H and GUKDO/KARBU 2E RNAV arrivals | Korea AIM current assignment / AIRAC AIP AMDT 9/25 charts |

The authoritative URLs and access dates live beside each reviewed operations
pack, in the generated FAA pack or in the reviewed international pack. Eighteen
of the 50 playable airports now have published runtime routes; the other 32 continue to be labeled and executed as
generated vector routes rather than being presented as real procedures.

Cycle 2608 runway records also corrected the SFO 01/19 leading zero and magnetic
bearings, plus the current CLT 01/19 and 18/36 runway designators used by the
runtime catalog.

## Repeatable FAA CIFP import

The FAA publishes a 132-column ARINC 424-18 CIFP file on each 28-day cycle. The
repository intentionally does not commit that roughly 53 MB source file.
Download and extract the official ZIP, then regenerate the selected U.S. pack:

```bash
npm run import:cifp -- /path/to/FAACIFP18
```

`scripts/import-faa-cifp.mjs` validates the record width, resolves airport and
waypoint coordinates, joins a selected STAR feeder transition to its common
route when one is coded, decodes represented altitude/speed restrictions, derives runway
compatibility and projects the route into the 40 NM tactical display. Its
deterministic output is committed at
`src/engine/generated/faaCifpProcedures.ts`, so a cycle update is reviewable as
a normal source diff.
