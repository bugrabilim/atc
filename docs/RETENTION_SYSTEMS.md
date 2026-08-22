# Daily Radar, streak, logbook and sharing

Status: implemented on `feat/academy-mobile-core`
Snapshot: 2026-08-22

## Product loop

The retention loop is intentionally usable without an account:

1. The English-first landing page shows one Daily Radar challenge.
2. The UTC date deterministically selects one of the five researched flagship
   airports, one of its valid flows and a replay seed.
3. Every device receives the same challenge for that UTC day.
4. The controller must complete three landings, one departure handoff, the
   daily score target and zero separation losses.
5. A successful day is added once to the local completion calendar.
6. Every debrief is written to a 30-entry local shift logbook.
7. The result can be sent through the platform Web Share sheet or copied as a
   compact text card when sharing is unavailable.

Daily mode is fixed to Normal so the comparison contract does not change with
career unlocks. A Daily Radar shift temporarily grants access to its airport
and mode but does not permanently bypass the airport score gates. Leaving the
daily shift returns ordinary scenario/mode selection to the normal career
rules.

## Determinism

`src/engine/engagement.ts` derives the challenge from
`airspace-control:YYYY-MM-DD` using a small deterministic hash. The result
contains:

- `daily-YYYY-MM-DD` identity;
- airport and flow ids;
- fixed mode;
- traffic seed;
- complete shift goal.

Only airport/flow ids already present in the scenario catalogue are emitted.
Tests verify repeatability, flow resolution and the complete safety target.
This is deterministic gameplay, not security-sensitive randomness.

## Streak semantics

- A UTC date can be completed only once even if the challenge is replayed.
- Duplicate or malformed stored dates are removed during load.
- The current streak includes today when completed; otherwise it remains alive
  through the following UTC day so the player has the full current day to act.
- The best streak is derived from the sanitized completion calendar and does
  not need a second mutable counter.

## Shift logbook

Each platform-neutral entry records:

- completion timestamp, airport, mode and flow;
- score, landings, handoffs and peak skill;
- debrief grade and objective result;
- complete safety metrics;
- optional Daily Radar identity.

Entries are newest-first, deduplicated by id and capped at 30. Old career
records without retention fields migrate to empty arrays. Malformed entries
are ignored instead of breaking the application. The same JSON schema works
in a browser, installed PWA and future Capacitor iOS/Android shells.

## Sharing and privacy

The share payload includes airport, mode, grade, score, landings, handoffs,
peak skill, safety result, streak and the public game URL. It contains no name,
email, advertising id or device identifier. On supported mobile platforms the
button opens the native share sheet; otherwise the text is copied to the
clipboard.

Nothing is uploaded in this phase. Career, Daily Radar completion and logbook
remain in local storage. Cloud sync and leaderboards require the separate
account/privacy work described in Phase 4 of the research report.
