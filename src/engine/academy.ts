import { createInitialState, type GameScenario } from './scenario';
import type { Aircraft, GameState, RadarWorld } from './types';

export type AcademyLessonId =
  | 'scope-basics'
  | 'heading'
  | 'altitude'
  | 'speed'
  | 'approach-clearance'
  | 'localizer'
  | 'first-arrival'
  | 'departure-handoff'
  | 'direct-and-hold'
  | 'safe-sequence';

export interface AcademyLesson {
  id: AcademyLessonId;
  number: number;
  title: string;
  shortTitle: string;
  durationMinutes: number;
  objective: string;
  briefing: string;
}

export const ACADEMY_LESSONS: readonly AcademyLesson[] = [
  {
    id: 'scope-basics', number: 1, title: 'RADARI OKU', shortTitle: 'Radar', durationMinutes: 2,
    objective: 'Bir radar hedefini seç.',
    briefing: 'Uçak etiketinde çağrı kodu, irtifa ve hız bulunur. Komut vermeden önce hedefi seç.',
  },
  {
    id: 'heading', number: 2, title: 'HEADING VER', shortTitle: 'Heading', durationMinutes: 2,
    objective: 'Seçili uçağın heading değerini değiştir.',
    briefing: 'Heading, uçağın burnunu istediğin manyetik yöne çevirir. Küçük dönüşlerle başla.',
  },
  {
    id: 'altitude', number: 3, title: 'İRTİFAYI YÖNET', shortTitle: 'Altitude', durationMinutes: 2,
    objective: 'Seçili uçağa yeni bir irtifa ver.',
    briefing: 'İrtifa, dikey ayırmanın temelidir. Uçağı final yaklaşmasına kademeli olarak alçalt.',
  },
  {
    id: 'speed', number: 4, title: 'HIZI AYARLA', shortTitle: 'Speed', durationMinutes: 2,
    objective: 'Seçili uçağın hedef hızını değiştir.',
    briefing: 'Hız kontrolü, yaklaşma sırası kurmanın en sakin yoludur. Öndeki uçakla aralığı koru.',
  },
  {
    id: 'approach-clearance', number: 5, title: 'ILS YAKLAŞMASI', shortTitle: 'ILS', durationMinutes: 3,
    objective: 'Aktif piste ILS yaklaşmasını silahlandır.',
    briefing: 'ILS komutu uçağı hemen döndürmez. Uçak uygun açı ve irtifayla localizer hattını yakalar.',
  },
  {
    id: 'localizer', number: 6, title: 'LOCALIZER YAKALA', shortTitle: 'Localizer', durationMinutes: 3,
    objective: 'Uçağı localizer hattında established duruma getir.',
    briefing: 'Final hattını yaklaşık 30° veya daha düşük açıyla kes; glideslope hattına aşağıdan yaklaş.',
  },
  {
    id: 'first-arrival', number: 7, title: 'İLK İNİŞ', shortTitle: 'Landing', durationMinutes: 3,
    objective: 'İlk güvenli inişi tamamla.',
    briefing: 'Localizer ve glideslope yakalandığında yaklaşma kontrolünden kuleye devir otomatik yapılır.',
  },
  {
    id: 'departure-handoff', number: 8, title: 'KALKIŞI DEVRET', shortTitle: 'Handoff', durationMinutes: 2,
    objective: 'Kalkış trafiğine sektör handoff izni ver.',
    briefing: 'Sektör sınırına yaklaşan kalkışın bir sonraki kontrol birimine devrini önceden onayla.',
  },
  {
    id: 'direct-and-hold', number: 9, title: 'DIRECT VE HOLD', shortTitle: 'Route', durationMinutes: 3,
    objective: 'Aynı uçakta bir Direct-To ve bir Hold komutu uygula.',
    briefing: 'Direct-To rotayı kısaltır; Hold ise terminal kapasitesi dolduğunda güvenli zaman kazandırır.',
  },
  {
    id: 'safe-sequence', number: 10, title: 'GÜVENLİ SIRALAMA', shortTitle: 'Sequence', durationMinutes: 3,
    objective: 'İki gelişe yaklaşma ver ve ayırmayı koru.',
    briefing: 'İki uçağı aynı final hattına verirken irtifa, hız ve wake aralığını birlikte yönet.',
  },
] as const;

export interface AcademyAction {
  kind: 'select' | 'command';
  label: string;
  callsign: string;
  command?: string;
}

export interface AcademyEvaluation {
  complete: boolean;
  progressLabel: string;
  hint: string;
  action: AcademyAction | null;
}

export function isAcademyLessonId(value: string): value is AcademyLessonId {
  return ACADEMY_LESSONS.some((lesson) => lesson.id === value);
}

function firstArrival(aircraft: readonly Aircraft[]) {
  return aircraft.find((item) => item.phase === 'arrival') ?? null;
}

function firstDeparture(aircraft: readonly Aircraft[]) {
  return aircraft.find((item) => item.phase === 'departure') ?? null;
}

function historyIncludes(state: GameState, token: string) {
  return state.commandHistory.some((entry) => entry.normalized.toUpperCase().includes(token));
}

function academyAircraft(scenario: GameScenario, lessonId: AcademyLessonId) {
  const source = structuredClone(scenario.initialAircraft);
  const arrivals = source.filter((item) => item.phase === 'arrival');
  const departure = firstDeparture(source);
  if (lessonId === 'departure-handoff' && departure) return [departure];
  if (lessonId === 'safe-sequence') return arrivals.slice(0, 2);
  if (lessonId === 'direct-and-hold') return [arrivals[1] ?? arrivals[0]].filter((item): item is Aircraft => Boolean(item));
  return [arrivals[0]].filter((item): item is Aircraft => Boolean(item));
}

/** Creates a quiet, deterministic lesson board without changing the normal
 * career simulation. No new traffic is introduced while the lesson runs. */
export function createAcademyState(scenario: GameScenario, lessonId: AcademyLessonId): GameState {
  const base = createInitialState(scenario, 'beginner');
  const aircraft = academyAircraft(scenario, lessonId);
  const selectedCallsign = lessonId === 'scope-basics' ? null : aircraft[0]?.callsign ?? null;
  const lesson = ACADEMY_LESSONS.find((item) => item.id === lessonId)!;
  const welcome = {
    id: `academy-${lessonId}`,
    type: 'info' as const,
    message: `ACADEMY ${lesson.number}/10 · ${lesson.title} · ${lesson.objective}`,
  };
  return {
    ...base,
    aircraft,
    selectedCallsign,
    targetAircraft: aircraft.length,
    nextTrafficAt: 99_999,
    trackHistory: Object.fromEntries(aircraft.map((item) => [item.callsign, [{ ...item.position }]])),
    eventLog: [welcome],
    eventTimeline: [welcome],
    commandHistory: [],
    pendingInstructions: [],
  };
}

/** Keeps the first lesson waiting for an intentional target selection. The
 * normal simulation automatically selects the first active aircraft when the
 * current selection is empty, which would otherwise complete the lesson before
 * the learner touches the radar. */
export function shouldAdvanceAcademySimulation(state: GameState, lessonId: AcademyLessonId | null) {
  return lessonId !== 'scope-basics' || Boolean(state.selectedCallsign);
}

export function evaluateAcademyLesson(state: GameState, world: RadarWorld, lessonId: AcademyLessonId): AcademyEvaluation {
  const arrivals = state.aircraft.filter((item) => item.phase === 'arrival');
  const selected = state.aircraft.find((item) => item.callsign === state.selectedCallsign) ?? state.aircraft[0] ?? null;
  const arrival = firstArrival(state.aircraft);
  const departure = firstDeparture(state.aircraft);
  const runwayId = world.runways.find((item) => item.active && (item.operation === 'arrival' || item.operation === 'mixed'))?.id
    ?? arrival?.assignedRunway
    ?? world.runways[0]?.id;
  const fixId = world.fixes.find((item) => item.id.startsWith('FINAL'))?.id ?? world.fixes[0]?.id;

  if (lessonId === 'scope-basics') {
    const complete = Boolean(state.selectedCallsign);
    return {
      complete,
      progressLabel: complete ? 'Hedef seçildi' : '0/1 hedef',
      hint: 'Parlak radar etiketine veya yaklaşma sırasındaki uçuşa dokun.',
      action: !complete && state.aircraft[0] ? { kind: 'select', label: `${state.aircraft[0].callsign} SEÇ`, callsign: state.aircraft[0].callsign } : null,
    };
  }

  if (!selected) return { complete: false, progressLabel: 'Uçak bekleniyor', hint: 'Dersi yeniden başlat.', action: null };

  if (lessonId === 'heading') {
    const complete = historyIncludes(state, ' HDG ');
    const suggested = Math.round((selected.heading + 30) / 10) * 10 % 360;
    return { complete, progressLabel: complete ? 'Heading verildi' : '0/1 komut', hint: 'Heading değerini küçük bir açıyla değiştir.', action: complete ? null : { kind: 'command', label: `HDG ${String(suggested).padStart(3, '0')}`, callsign: selected.callsign, command: `HDG ${String(suggested).padStart(3, '0')}` } };
  }

  if (lessonId === 'altitude') {
    const complete = historyIncludes(state, ' FL') || historyIncludes(state, ' ALT ');
    const flightLevel = Math.max(20, Math.round((selected.altitude - 1_000) / 100));
    return { complete, progressLabel: complete ? 'İrtifa verildi' : '0/1 komut', hint: 'Finale yaklaşırken bir kademe alçalt.', action: complete ? null : { kind: 'command', label: `FL${String(flightLevel).padStart(3, '0')}`, callsign: selected.callsign, command: `FL ${flightLevel}` } };
  }

  if (lessonId === 'speed') {
    const complete = historyIncludes(state, ' SPD ');
    const speed = Math.max(selected.performance.minSpeed, Math.round((selected.speed - 20) / 10) * 10);
    return { complete, progressLabel: complete ? 'Hız verildi' : '0/1 komut', hint: 'Yaklaşma aralığını büyütmek için 20 knot azalt.', action: complete ? null : { kind: 'command', label: `SPD ${speed}`, callsign: selected.callsign, command: `SPD ${speed}` } };
  }

  if (lessonId === 'approach-clearance') {
    const complete = historyIncludes(state, ' ILS ');
    return { complete, progressLabel: complete ? 'ILS silahlı' : '0/1 yaklaşma', hint: `Aktif pist ${runwayId ?? '---'}.`, action: complete || !runwayId ? null : { kind: 'command', label: `ILS ${runwayId}`, callsign: selected.callsign, command: `ILS ${runwayId}` } };
  }

  if (lessonId === 'localizer') {
    const status = arrival?.approach?.status;
    const complete = status === 'localizer' || status === 'glideslope' || status === 'tower';
    const armed = Boolean(arrival?.approach);
    return { complete, progressLabel: complete ? 'LOC established' : armed ? 'ILS armed · yakalama bekleniyor' : 'ILS silahsız', hint: armed ? 'Uçak final hattına uygun açıyla geliyor; localizer yakalamasını izle.' : `Önce ILS ${runwayId ?? ''} yaklaşmasını silahlandır.`, action: complete || armed || !arrival || !runwayId ? null : { kind: 'command', label: `ILS ${runwayId}`, callsign: arrival.callsign, command: `ILS ${runwayId}` } };
  }

  if (lessonId === 'first-arrival') {
    const complete = state.landed >= 1;
    const armed = Boolean(arrival?.approach);
    return { complete, progressLabel: complete ? '1/1 güvenli iniş' : `${state.landed}/1 iniş`, hint: armed ? 'Yaklaşmayı izle; kule devri ve iniş otomatik tamamlanacak.' : `ILS ${runwayId ?? ''} yaklaşmasını ver.`, action: complete || armed || !arrival || !runwayId ? null : { kind: 'command', label: `ILS ${runwayId}`, callsign: arrival.callsign, command: `ILS ${runwayId}` } };
  }

  if (lessonId === 'departure-handoff') {
    const complete = Boolean(departure?.handoffCleared) || historyIncludes(state, ' HANDOFF');
    return { complete, progressLabel: complete ? 'Handoff onaylandı' : '0/1 handoff', hint: 'Kalkış sektör sınırına varmadan devri onayla.', action: complete || !departure ? null : { kind: 'command', label: 'HANDOFF', callsign: departure.callsign, command: 'HANDOFF' } };
  }

  if (lessonId === 'direct-and-hold') {
    const directDone = historyIncludes(state, ' DCT ');
    const holdDone = historyIncludes(state, ' HOLD ');
    const complete = directDone && holdDone;
    const command = directDone ? `HOLD ${fixId}` : `DCT ${fixId}`;
    return { complete, progressLabel: `${Number(directDone) + Number(holdDone)}/2 komut`, hint: directDone ? 'Şimdi aynı fix üzerinde bekleme talimatı ver.' : 'Önce uçağı doğrudan bir yaklaşma fixine yönlendir.', action: complete || !fixId ? null : { kind: 'command', label: command, callsign: selected.callsign, command } };
  }

  const clearedCallsigns = [...new Set(state.commandHistory
    .map((entry) => entry.normalized.toUpperCase().match(/^([A-Z]+\d+) ILS /)?.[1])
    .filter((callsign): callsign is string => Boolean(callsign)))];
  const appliedOrCompleted = arrivals.some((item) => item.approach?.status === 'localizer' || item.approach?.status === 'glideslope' || item.approach?.status === 'tower') || state.landed >= 1;
  const approachReadbacksComplete = !state.pendingInstructions.some((item) => item.command.kind === 'approach');
  const complete = clearedCallsigns.length >= 2
    && appliedOrCompleted
    && approachReadbacksComplete
    && state.metrics.separationLosses === 0
    && state.metrics.wakeViolations === 0
    && state.metrics.goArounds === 0;
  const nextArrival = arrivals.find((item) => !clearedCallsigns.includes(item.callsign));
  return {
    complete,
    progressLabel: `${Math.min(2, clearedCallsigns.length)}/2 yaklaşma · ${state.metrics.separationLosses} kayıp`,
    hint: 'İki uçağa aynı yaklaşmayı verirken hız ve irtifa farkını koru.',
    action: complete || !nextArrival || !runwayId ? null : { kind: 'command', label: `${nextArrival.callsign} · ILS ${runwayId}`, callsign: nextArrival.callsign, command: `ILS ${runwayId}` },
  };
}
