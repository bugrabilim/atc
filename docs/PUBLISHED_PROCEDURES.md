# Published procedure runtime integration

Updated: 2026-08-24

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

The authoritative URLs and access dates live beside each operations pack in
`src/engine/airportOperations.ts` so a future AIRAC update can be reviewed as a
data change rather than hidden inside simulation code.
