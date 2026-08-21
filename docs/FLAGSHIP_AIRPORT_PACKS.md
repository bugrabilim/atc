# Flagship airport operations packs — research and implementation record

Status: implemented on `feat/academy-mobile-core`  
Pack version: `2026.08.1`  
Research snapshot: 2026-08-22  
Scope: IST, LHR, LAX, JFK and ATL

## Purpose and accuracy boundary

These packs turn public airport facts into five strategically different ATC
game boards. They are not chart reproductions and must not be used for flight
planning or navigation. Runway identifiers and relative runway geometry come
from the catalogue documented in `AIRPORT_DATA.md`. Current authority pages
and procedure indexes are used to identify the operational character of each
airport. Boundary positions, traffic cadence, event timing and vector routes
are original game abstractions.

The implementation deliberately keeps stable command/save keys such as
`NORTH`, `EAST` and the three legacy flow ids. A separate display label can
show BOVINGDON or CAMRN without invalidating commands or saved sessions.

## Shared implementation contract

Every flagship pack provides:

1. four resolvable runway configurations, including a low-capacity flow;
2. a replayable arrival/departure pattern whose fourth spawn remains a
   departure for backwards-compatible simulation tests;
3. a guaranteed heavy-arrival cadence;
4. four named chart labels on stable boundary gates;
5. one airport-specific disruption and one deterministic recovery flow;
6. a source manifest, access date, reference cycle and game-only notice.

The runtime uses these fields in three places: `scenario.ts` builds the radar
world, `trafficDirector.ts` creates an airport-specific traffic bank, and
`simulation.ts` triggers the airport-specific operational event. The scope
renderer displays the researched gate label while navigation continues to use
the stable internal id.

## IST — İstanbul Airport / LTFM

### Official evidence

- DHMI identifies the field as İstanbul Airport (LTFM/IST) in its official
  airport information page.
- DHMI states that triple independent runway operations entered service on
  17 April 2025 and enable up to three simultaneous arrivals or departures.

Sources:

- [DHMI — İstanbul Airport general information](https://www.dhmi.gov.tr/sayfalar/havalimani/istanbul/GenelBilgiler.aspx)
- [DHMI — Triple runway operations have been in service for one year](https://www.dhmi.gov.tr/Sayfalar/Haber/triple-runway-operations-have-been-in-service-for-one-year.aspx)

### Game adaptation

- Identity: a bank that begins with two north-flow arrival streams and can
  recover into three independent south-flow arrivals.
- Normal flow: arrivals 34L/35R, departures 36.
- High-capacity flow: arrivals 16R/17L/18, departures 16L/17R.
- Reduced flows: one arrival runway in strong wind or low visibility.
- Boundary labels: BLACK SEA, ANATOLIA, MARMARA and THRACE. These are sector
  context labels, not published fixes.
- Event: a Black Sea wind shift merges the arrival bank; recovery opens the
  original game's three-stream challenge.
- Traffic bank: four arrivals and two departures per six planned flights;
  every fourth eligible arrival is guaranteed to be heavy.

## LHR — London Heathrow / EGLL

### Official evidence

- Heathrow documents four holding stacks: Bovingdon, Lambourne, Ockham and
  Biggin. It states the lowest stack level is around 7,000 ft, with 1,000 ft
  vertical separation between levels.
- Heathrow states that controllers vector traffic from the stacks to final;
  there is no single fixed route from stack to final. Its public arrival page
  describes final approaches starting at approximately 13 NM.
- Heathrow documents runway alternation and the broad west/east operating
  split. NATS publishes the current UK aeronautical dataset checklist.

Sources:

- [Heathrow — Arrival flight paths](https://www.heathrow.com/company/local-community/noise/operations/arrival-flight-paths)
- [Heathrow — Easterly alternation](https://www.heathrow.com/company/local-community/noise/operations/easterly-alternation)
- [NATS — Dataset checklist, 6 August 2026](https://nats-uk.ead-it.com/cms-nats/opencms/en/Publications/digital-datasets/Checklists/Dataset_Checklist_2026_08_06.html)

### Game adaptation

- Identity: merge four named stacks into one landing sequence while a parallel
  runway carries departures.
- Flows: west alternation A (27L arrivals/27R departures), west alternation B
  (27R/27L), low visibility and easterly 09 operation.
- Boundary labels map the four official stack names to readable cardinal gates.
  The 42 NM game sector does not reproduce the real stack coordinates.
- Event: runway alternation moves the complete arrival sequence to the other
  runway, forcing the player to preserve order while re-vectoring.
- Traffic bank: four arrivals and one departure per five planned flights;
  every third eligible arrival is guaranteed to be heavy.

## LAX — Los Angeles International / KLAX

### Official evidence

- FAA d-TPP publishes the current airport diagram and instrument procedure
  index on a 28-day cycle.
- LAWA operational advisories identify the north complex as 6L/24R and
  6R/24L and the south complex as 7L/25R and 7R/25L.
- A LAWA closure advisory explicitly describes westerly operations continuing
  with both south-complex runways available while north-complex maintenance is
  underway.

Sources:

- [FAA — Digital Terminal Procedures Publication](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/)
- [LAWA — Runway 6R-24L maintenance closure and south-complex operation](https://www.lawa.org/news-releases/2025/runway-6r-24l-135-hour-closure-routine-maintenance-activities-june-28-2025-0030)
- [LAWA — Runway 6R-24L operational advisory](https://www.lawa.org/groups-and-divisions/airport-operations/ops-advisory/2024/17)

### Game adaptation

- Identity: balance traffic between north and south complexes rather than
  treating four parallel lines as interchangeable.
- Normal westerly flow: arrivals 24R/25L, departures 24L/25R.
- Reverse flow: 6R/7R arrivals and 6L/7L departures.
- Reduced flows use the south complex only.
- Event: north-complex maintenance concentrates all demand on 25L/25R before
  restoring both complexes.
- Traffic bank: three arrivals and two departures per five planned flights;
  every fourth eligible arrival is guaranteed to be heavy.

## JFK — John F. Kennedy International / KJFK

### Official evidence

FAA d-TPP cycle 2608 lists the CAMRN FIVE, PARCH FOUR RNAV, PAWLN ONE RNAV and
PUCKY ONE RNAV arrival charts and ILS/LOC approaches for the principal runway
ends. The d-TPP landing page records the effective dates and explains its
28-day publication cycle.

Sources:

- [FAA — JFK terminal procedures, cycle 2608](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=11&sort=state&volume=NE-2)
- [FAA — Digital Terminal Procedures Publication](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/)

### Game adaptation

- Identity: manage arrival banks around crossing 22/31 runway demand instead
  of a simple parallel-runway throughput puzzle.
- Boundary labels reference the four current published arrival names, but the
  game does not copy their route geometry or restrictions.
- Flows cover a 22 bank with 31L departure pressure, a 31 bank, a one-arrival
  low-visibility setup and a northeast 04 bank.
- Event: low visibility merges arrivals onto 22L while the player protects
  heavy wake spacing and 31L departure windows.
- Traffic bank: three arrivals and two departures per five flights with a
  different ordering from LAX; every third eligible arrival is heavy.

## ATL — Hartsfield–Jackson Atlanta / KATL

### Official evidence

- FAA d-TPP cycle 2608 lists current airport/approach products and named RNAV
  procedures including GNDLF THREE, SITTH THREE and HAALO THREE.
- The runway catalogue contains five east/west physical runway pairs:
  08L/26R, 08R/26L, 09L/27R, 09R/27L and 10/28.
- FAA procedure results include conventional ILS/LOC and PRM-related products,
  supporting Atlanta's parallel-arrival gameplay identity.

Sources:

- [FAA — Atlanta GNDLF/HAALO procedure results, cycle 2608](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=6&sort=proc&volume=SE-4)
- [FAA — Atlanta SITTH/ILS procedure results, cycle 2608](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=4&sort=flag&volume=SE-4)
- [FAA — Digital Terminal Procedures Publication](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/)

### Game adaptation

- Identity: the highest raw runway throughput of the first five packs, with
  three arrival lanes and two departure lanes.
- West flow: arrivals 26L/27L/28, departures 26R/27R.
- East flow: arrivals 08R/09R/10, departures 08L/09L.
- Reduced flow: one arrival and one departure lane in low visibility.
- Event: a compressed PRM-style spacing interval temporarily removes the
  three-lane advantage, then restores it.
- Traffic bank: alternating arrivals and departures; every sixth eligible
  arrival is guaranteed to be heavy, reflecting a higher narrow-body mix than
  Heathrow/JFK in gameplay terms rather than making a real traffic claim.

## Automated validation

`airportOperations.test.ts`, `scenario.test.ts`, `trafficDirector.test.ts` and
`simulation.test.ts` jointly verify that:

- there are exactly five sourced flagship packs and each has four flows;
- every runway id resolves to the corresponding airport definition;
- reduced and recovery flows exist;
- legacy flow ids remain present;
- all traffic entries, exits and procedures remain internally resolvable;
- each configured flow can generate an arrival and a departure;
- traffic cadence and heavy-arrival rules are deterministic;
- airport-specific disruptions select the intended reduced/recovery flows.

## Next research increment

The next data increment should not add more airports yet. It should first add
an in-game airport briefing card that exposes pack version, tactical identity,
flow choices and the game-only notice. After that, procedure labels can be
expanded one airport at a time, but only when the current authority source and
cycle are stored and the route is still represented as original game geometry.
