# Istanbul Control — First Watch

Status: implemented on `feat/academy-mobile-core`

Snapshot: 2026-08-22

## Product purpose

First Watch is Airspace Control's original seven-chapter career season. It
adds the sense of a living controller shift without copying another game's
characters, writing, missions, interface, art, audio or scenario scripts.
Every chapter uses the existing deterministic Istanbul simulation and judges
the player's actual traffic outcome.

The season is local-first and passwordless. Supabase, cloud sync and online
leaderboards remain intentionally deferred.

## Chapter order

1. **First Contact / İlk Temas** — selection, ILS capture and the first safe
   arrival in Beginner mode.
2. **Parallel Lines / Paralel Hatlar** — two arrival streams, runway balance
   and the first departure handoff.
3. **The Fog Line / Sis Hattı** — single-runway low-visibility sequencing.
4. **Priority One / Öncelik Bir** — a deterministic medical-priority arrival
   inside an active bank.
5. **Runway Turn / Pist Dönüşü** — parallel arrivals reduced to one arrival
   runway after the first bank.
6. **Night Bank / Gece Dalgası** — a dense long-haul wave on the south triple
   configuration.
7. **Chief Controller / Baş Kontrolör** — an Expert assessment combining
   workload, priority handling and changing operations.

Only Chapter 1 is initially available. Completing a chapter unlocks the next
one. A story chapter temporarily grants its required difficulty and runway
flow but does not bypass the ordinary airport career gates.

## Event trigger contract

`src/engine/careerSeason.ts` contains platform-neutral chapter and event data.
Each event has:

- a stable chapter-scoped id;
- a deterministic trigger based on elapsed simulation time, landings,
  handoffs or score;
- one effect: message, demand pulse, priority arrival or flow change;
- a typed severity and original Turkish radio-room message.

The event id is written to `eventTimeline` and acts as an idempotency key.
Restoring a session or applying the reducer again cannot fire the same story
event twice. Seeds, starting flow, mode and goals are fixed per chapter.

## Performance outcomes

Every debrief creates one of three outcomes:

- **Distinction / Üstün Başarı:** the objective is complete and the shift has
  no recorded operational error.
- **Qualified / Yeterli:** the objective is complete but the debrief includes
  a recoverable operational imperfection.
- **Repeat / Tekrar Gerekli:** the chapter objective is incomplete.

The narrative paragraph is chapter-specific and is stored in the same local
shift logbook as score and safety metrics. Performance flags record objective
completion, clean separation, stable approaches, protected priority,
adaptation to a flow change and high-workload control. The landing-page career
map displays the latest narrative and best result for every completed chapter.

## Persistence and migration

Career storage adds:

- `completedCareerEpisodeIds`;
- `careerBestOutcomes`;
- optional chapter id, narrative and performance flags on a shift log entry.

All values are sanitized before use. Existing career records migrate to empty
story progress. Session format version 4 stores the active chapter id and
continues to restore versions 1–3. The current runway flow may differ from the
chapter's starting flow after a scripted operation change, so restoration
validates chapter, airport and mode while the general session validator checks
that the saved flow still exists.

## Verification

Automated tests cover:

- seven ordered chapters, unique ids and replay seeds;
- valid Istanbul runway flows and score goals;
- sequential unlocking and storage sanitization;
- one-time demand pulses;
- deterministic priority assignment;
- scripted capacity reduction;
- distinction, qualified and repeat outcomes;
- story metadata in session and logbook records.

This content is a game scenario and not navigation or controller training
material.
