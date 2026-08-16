# Real-world airport data policy

This document records what is authentic in Airspace Control, what is adapted
for play, and how the 50-airport catalogue can be audited and refreshed.

## Sources and snapshot

- Passenger order: Airports Council International (ACI) 2025 world traffic
  ranking. Istanbul is deliberately promoted to career position 1 at the
  product owner's request; positions 2–50 retain the published traffic order
  after Istanbul is removed from its original position.
- Airport/runway data: OurAirports public-domain CSV snapshot, commit
  `be07e33e6cc10087f57064f2bb3fccfcd39f5801`, updated 2026-08-16.
- Raw fields used: ICAO/IATA, airport elevation, runway end identifiers,
  threshold coordinates, true headings and runway lengths.
- References:
  - https://aci.aero/resources/busiest-airports-in-the-world/
  - https://aci.aero/2026/07/15/worlds-busiest-airports-atlanta-holds-asia-climbs-strong-demand-while-asia-pacific-growth-reshape-the-rankings/
  - https://ourairports.com/data/
  - https://github.com/davidmegginson/ourairports-data

## What the game implements

- One physical line per runway pair, with the real public runway identifiers,
  direction, relative layout and length.
- Reciprocal runway operation: changing the wind/flow rotates and renames the
  same physical runway instead of drawing a duplicate.
- Three replayable flow configurations per airport: normal direction, reverse
  direction and reduced-capacity/low-visibility operation.
- Four controller boundary gates, an ILS-aligned final corridor for every
  runway end and two departure exits.
- Airport-specific terrain class, city direction, water direction and mountain
  direction for a readable tactical map.

## Accuracy boundary

Runway identifiers and geometry come from the cited public dataset. The city,
water and mountain layers are deliberately stylised orientation context, not
survey-grade polygons. Boundary gates, STAR/SID names and ILS corridors are
gameplay constructs aligned with the runway; they are **not** a transcription
of a current instrument procedure or AIRAC cycle.

Worldwide, current navigation-grade procedures would require a licensed and
continuously updated ARINC 424/AIRAC pipeline, chart-by-chart validation and
jurisdiction-specific distribution rights. The application must therefore
continue to display “GAME ONLY” and must never be used for navigation.

## Career order

| # | IATA | ICAO | 2025 passengers | Physical runway pairs |
|---:|:---:|:---:|---:|---:|
| 1 | IST | LTFM | 84,437,710 | 6 |
| 2 | ATL | KATL | 106,302,208 | 5 |
| 3 | DXB | OMDB | 95,192,160 | 2 |
| 4 | HND | RJTT | 91,679,814 | 4 |
| 5 | DFW | KDFW | 85,660,127 | 7 |
| 6 | PVG | ZSPD | 84,994,548 | 5 |
| 7 | ORD | KORD | 84,856,018 | 8 |
| 8 | LHR | EGLL | 84,482,126 | 2 |
| 9 | CAN | ZGGG | 83,582,952 | 5 |
| 10 | DEN | KDEN | 82,427,962 | 6 |
| 11 | DEL | VIDP | 78,148,081 | 4 |
| 12 | ICN | RKSI | 74,126,912 | 4 |
| 13 | LAX | KLAX | 73,709,594 | 4 |
| 14 | CDG | LFPG | 72,029,407 | 4 |
| 15 | PEK | ZBAA | 70,742,712 | 3 |
| 16 | SIN | WSSS | 69,982,000 | 2 |
| 17 | AMS | EHAM | 68,771,592 | 6 |
| 18 | MAD | LEMD | 68,118,754 | 4 |
| 19 | SZX | ZGSZ | 66,485,213 | 3 |
| 20 | KUL | WMKK | 63,409,501 | 3 |
| 21 | FRA | EDDF | 63,189,666 | 4 |
| 22 | BKK | VTBS | 62,902,183 | 3 |
| 23 | JFK | KJFK | 62,629,455 | 4 |
| 24 | HKG | VHHH | 60,992,000 | 3 |
| 25 | MCO | KMCO | 57,675,573 | 4 |
| 26 | BCN | LEBL | 57,483,036 | 3 |
| 27 | TFU | ZUTF | 56,686,738 | 3 |
| 28 | BOM | VABB | 55,500,000 | 2 |
| 29 | MIA | KMIA | 55,314,661 | 4 |
| 30 | LAS | KLAS | 54,989,185 | 4 |
| 31 | CGK | WIII | 54,950,000 | 3 |
| 32 | SFO | KSFO | 54,532,613 | 4 |
| 33 | DOH | OTHH | 54,338,667 | 2 |
| 34 | CLT | KCLT | 53,600,000 | 3 |
| 35 | PKX | ZBAD | 53,618,949 | 4 |
| 36 | JED | OEJN | 53,400,000 | 3 |
| 37 | SEA | KSEA | 52,715,181 | 3 |
| 38 | MNL | RPLL | 52,020,000 | 2 |
| 39 | PHX | KPHX | 51,620,420 | 3 |
| 40 | FCO | LIRF | 50,872,356 | 3 |
| 41 | HGH | ZSHC | 50,459,018 | 2 |
| 42 | SHA | ZSSS | 50,151,025 | 2 |
| 43 | CKG | ZUCK | 50,094,770 | 4 |
| 44 | KMG | ZPPP | 49,705,725 | 2 |
| 45 | XIY | ZLXY | 48,535,594 | 4 |
| 46 | SAW | LTFJ | 48,420,757 | 2 |
| 47 | IAH | KIAH | 48,131,213 | 5 |
| 48 | TPE | RCTP | 47,795,969 | 2 |
| 49 | YYZ | CYYZ | 47,300,000 | 5 |
| 50 | GRU | SBGR | 47,188,085 | 2 |

## Refresh checklist

1. Pin a new OurAirports commit and record it above.
2. Regenerate runway pairs; reject surfaces shorter than 0.6 NM.
3. Compare runway identifiers against each airport authority/AIP when a data
   discrepancy is reported.
4. Refresh ACI passenger order annually without moving Istanbul from position
   1 unless the product decision changes.
5. Run typecheck, all simulation tests, production build and mobile visual
   regression before publishing.
