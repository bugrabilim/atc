import { goalComplete, type DebriefReport, type ShiftGoal } from './progression';
import type { GameEvent, GameMode, GameState, ScenarioId } from './types';

export type CareerEpisodeId =
  | 'first-contact'
  | 'parallel-lines'
  | 'fog-line'
  | 'priority-one'
  | 'runway-turn'
  | 'night-bank'
  | 'chief-controller';

export type CareerOutcomeTier = 'distinction' | 'qualified' | 'repeat';

export type CareerPerformanceFlag =
  | 'objective-complete'
  | 'clean-separation'
  | 'stable-approaches'
  | 'priority-protected'
  | 'flow-adapted'
  | 'high-workload';

type CareerBeatTrigger =
  | { kind: 'time'; value: number }
  | { kind: 'landings'; value: number }
  | { kind: 'handoffs'; value: number }
  | { kind: 'score'; value: number };

type CareerBeatEffect =
  | { kind: 'message' }
  | { kind: 'demand-pulse'; nextTrafficDelaySeconds: number }
  | { kind: 'priority-arrival'; priorityKind: 'medical' | 'minimumFuel'; responseWindowSeconds: number }
  | { kind: 'flow-change'; flowId: string };

export interface CareerBeat {
  id: string;
  trigger: CareerBeatTrigger;
  effect: CareerBeatEffect;
  type: GameEvent['type'];
  message: string;
}

export interface CareerEpisode {
  id: CareerEpisodeId;
  number: number;
  title: string;
  titleTr: string;
  subtitle: string;
  scenarioId: Extract<ScenarioId, 'ist'>;
  mode: GameMode;
  flowId: string;
  seed: number;
  briefing: string;
  briefingTr: string;
  focusTr: string;
  goal: ShiftGoal;
  beats: readonly CareerBeat[];
  outcomeNarratives: Record<CareerOutcomeTier, string>;
}

export interface CareerEpisodeResult {
  tier: CareerOutcomeTier;
  label: string;
  complete: boolean;
  narrative: string;
  flags: CareerPerformanceFlag[];
}

/** Content-only season contract. A future international season can supply a
 * new id, titles and episode array without changing the simulation reducer. */
export interface CareerSeasonDefinition {
  id: string;
  title: string;
  subtitle: string;
  homeScenarioId: ScenarioId;
  episodes: readonly CareerEpisode[];
}

export const CAREER_FLAG_LABELS: Record<CareerPerformanceFlag, string> = {
  'objective-complete': 'GÖREV TAMAM',
  'clean-separation': 'TEMİZ AYIRMA',
  'stable-approaches': 'STABİL YAKLAŞMA',
  'priority-protected': 'ÖNCELİK KORUNDU',
  'flow-adapted': 'AKIŞA UYUM',
  'high-workload': 'YOĞUNLUK HÂKİMİYETİ',
};

export const CAREER_OUTCOME_LABELS: Record<CareerOutcomeTier, string> = {
  distinction: 'ÜSTÜN BAŞARI',
  qualified: 'YETERLİ',
  repeat: 'TEKRAR GEREKLİ',
};

export const FIRST_WATCH_EPISODES: readonly CareerEpisode[] = [
  {
    id: 'first-contact', number: 1, title: 'First Contact', titleTr: 'İlk Temas', subtitle: 'Take the Istanbul scope for the first time.',
    scenarioId: 'ist', mode: 'beginner', flowId: 'north-parallel', seed: 110_101,
    briefing: 'Your supervisor hands you one calm arrival. Establish it, protect the final and prove you can finish the loop.',
    briefingTr: 'Vardiya amiri ilk sakin gelişi sana devrediyor. Finali kur, ayırmayı koru ve ilk iniş döngüsünü tamamla.',
    focusTr: 'uçak seçimi, ILS yakalama ve ilk güvenli iniş',
    goal: { label: 'BÖLÜM 01 · İLK TEMAS', targetLandings: 1, targetHandoffs: 0, maximumLosses: 0, targetScore: 150 },
    beats: [
      { id: 'supervisor-check', trigger: { kind: 'time', value: 12 }, effect: { kind: 'message' }, type: 'info', message: 'VARDİYA AMİRİ · radarı sade tut, ilk gelişte heading ve irtifayı aynı anda değiştirme' },
    ],
    outcomeNarratives: {
      distinction: 'İlk temas kusursuzdu. Amir, sakin komut ritmini ve temiz final hattını vardiya defterine özellikle kaydetti.',
      qualified: 'İlk geliş emniyetle tamamlandı. İstanbul radarı artık yabancı değil; sıradaki vardiyada iki akışı birlikte yöneteceksin.',
      repeat: 'İlk devir henüz tamamlanmadı. Aynı trafik yeniden hazırlanacak; uçağı seç, finali kur ve ILS döngüsünü bitir.',
    },
  },
  {
    id: 'parallel-lines', number: 2, title: 'Parallel Lines', titleTr: 'Paralel Hatlar', subtitle: 'Build two arrival streams without losing the picture.',
    scenarioId: 'ist', mode: 'normal', flowId: 'north-parallel', seed: 220_204,
    briefing: 'A compact arrival bank is entering from two boundaries. Use both arrival runways and keep the departure lane moving.',
    briefingTr: 'İki sınırdan sıkışık bir geliş bankası geliyor. İki geliş pistini kullanırken kalkış hattını da açık tut.',
    focusTr: 'paralel pist dağıtımı, hız kontrolü ve ilk sektör handoff’u',
    goal: { label: 'BÖLÜM 02 · PARALEL HATLAR', targetLandings: 3, targetHandoffs: 1, maximumLosses: 0, targetScore: 450 },
    beats: [
      { id: 'bank-compression', trigger: { kind: 'time', value: 35 }, effect: { kind: 'demand-pulse', nextTrafficDelaySeconds: 1 }, type: 'warning', message: 'BANKA SIKIŞMASI · kuzey girişleri hızlandı · paralel pistleri erken paylaştır' },
      { id: 'first-line-stable', trigger: { kind: 'landings', value: 1 }, effect: { kind: 'message' }, type: 'success', message: 'İLK HAT STABİL · ikinci finali bağımsız tut ve kalkış devrini unutma' },
    ],
    outcomeNarratives: {
      distinction: 'İki final hattı birbirini bozmadan aktı. Vardiya amiri seni “paralel resmi okuyabilen kontrolör” olarak işaretledi.',
      qualified: 'Paralel geliş bankası emniyetle çözüldü ve sektör devri tamamlandı. Bir sonraki vardiyada görüş desteği azalacak.',
      repeat: 'Banka tam olarak çözülemedi. Pistleri daha erken paylaştır ve kalkış handoff’unu sınırdan önce tamamla.',
    },
  },
  {
    id: 'fog-line', number: 3, title: 'The Fog Line', titleTr: 'Sis Hattı', subtitle: 'Control the sequence when the picture gets smaller.',
    scenarioId: 'ist', mode: 'normal', flowId: 'north-lowvis', seed: 330_315,
    briefing: 'Visibility has fallen and arrivals share one protected runway. Slow the bank early and avoid last-minute vectors.',
    briefingTr: 'Görüş düştü ve gelişler tek korumalı pisti paylaşıyor. Bankayı erken yavaşlat, son dakika vektörlerinden kaçın.',
    focusTr: 'tek pist sıralaması, düşük görüş ve istikrarlı yaklaşma',
    goal: { label: 'BÖLÜM 03 · SİS HATTI', targetLandings: 3, targetHandoffs: 1, maximumLosses: 0, targetScore: 440 },
    beats: [
      { id: 'visibility-floor', trigger: { kind: 'time', value: 18 }, effect: { kind: 'message' }, type: 'warning', message: 'GÖRÜŞ TABANI · tek geliş pisti korunuyor · aralığı finalden önce kur' },
      { id: 'stable-pair', trigger: { kind: 'landings', value: 2 }, effect: { kind: 'message' }, type: 'success', message: 'SİS HATTI KORUNDU · son trafiği aynı disiplinle finale taşı' },
    ],
    outcomeNarratives: {
      distinction: 'Düşük görüşte tek pist ritmi hiç bozulmadı. Logbook, son dakika müdahalesi olmadan kurulan sakin sırayı öne çıkardı.',
      qualified: 'Sis bankası emniyetle tamamlandı. Tek pistte kapasiteyi koruyabildiğini kanıtladın.',
      repeat: 'Düşük görüş vardiyası tamamlanmadı. Daha uzun final aralığı kur ve hız azaltmasını sınır girişinde başlat.',
    },
  },
  {
    id: 'priority-one', number: 4, title: 'Priority One', titleTr: 'Öncelik Bir', subtitle: 'Make room without abandoning the rest of the sector.',
    scenarioId: 'ist', mode: 'advanced', flowId: 'north-parallel', seed: 440_422,
    briefing: 'A medical arrival will request priority inside an already active bank. Create one protected gap and preserve every other separation.',
    briefingTr: 'Aktif geliş bankasının içinde tıbbi öncelik isteyen bir uçuş belirecek. Tek korumalı boşluk aç ve diğer ayırmaları bozma.',
    focusTr: 'öncelikli trafik, yeniden sıralama ve baskı altında karar',
    goal: { label: 'BÖLÜM 04 · ÖNCELİK BİR', targetLandings: 4, targetHandoffs: 1, maximumLosses: 0, targetScore: 600 },
    beats: [
      { id: 'medical-priority', trigger: { kind: 'time', value: 45 }, effect: { kind: 'priority-arrival', priorityKind: 'medical', responseWindowSeconds: 240 }, type: 'warning', message: '{callsign} TIBBİ ÖNCELİK · korumalı ilk iniş boşluğu oluştur' },
      { id: 'priority-sequenced', trigger: { kind: 'landings', value: 2 }, effect: { kind: 'message' }, type: 'info', message: 'SEKTÖR DENGESİ · öncelik sonrası kalan bankayı iki piste yeniden dağıt' },
    ],
    outcomeNarratives: {
      distinction: 'Tıbbi uçuş gecikmeden öne alındı; kalan sektör de tek bir emniyet kaybı yaşamadan aktı. Amir kararını örnek vaka olarak kaydetti.',
      qualified: 'Öncelikli trafik ve ana banka emniyet içinde yönetildi. Baskı altında sıralama yetkinliğin onaylandı.',
      repeat: 'Öncelik penceresi veya ana trafik akışı korunamadı. Boşluğu daha erken aç ve diğer uçakları hız/HOLD ile sabitle.',
    },
  },
  {
    id: 'runway-turn', number: 5, title: 'Runway Turn', titleTr: 'Pist Dönüşü', subtitle: 'Merge two streams when capacity is suddenly reduced.',
    scenarioId: 'ist', mode: 'advanced', flowId: 'north-parallel', seed: 550_533,
    briefing: 'The shift starts on parallel arrivals. After the first bank, maintenance reduces the operation to one arrival runway.',
    briefingTr: 'Vardiya paralel gelişle başlıyor. İlk bankadan sonra bakım nedeniyle operasyon tek geliş pistine düşecek.',
    focusTr: 'pist akışı değişimi, iki sırayı birleştirme ve kapasite toparlama',
    goal: { label: 'BÖLÜM 05 · PİST DÖNÜŞÜ', targetLandings: 5, targetHandoffs: 2, maximumLosses: 1, targetScore: 720 },
    beats: [
      { id: 'single-runway-turn', trigger: { kind: 'landings', value: 2 }, effect: { kind: 'flow-change', flowId: 'north-single' }, type: 'danger', message: 'BAKIM PENCERESİ · gelişler tek piste düştü · iki sırayı 34L üzerinde birleştir' },
      { id: 'merged-sequence', trigger: { kind: 'landings', value: 4 }, effect: { kind: 'message' }, type: 'success', message: 'BİRLEŞİK SIRA STABİL · kalan trafik için pist dönüşünü tamamla' },
    ],
    outcomeNarratives: {
      distinction: 'Paralel bankadan tek piste geçiş kesintisiz yapıldı. Kapasite düşerken resmin tamamını korudun.',
      qualified: 'İki sıra tek piste birleştirildi ve vardiya hedefi tamamlandı. Operasyon değişikliğine uyum yetkinliğin kayda geçti.',
      repeat: 'Pist dönüşünde sıra dağıldı. Akış değişmeden önce hızları sabitle ve ikinci hattı ana finalin arkasına yerleştir.',
    },
  },
  {
    id: 'night-bank', number: 6, title: 'Night Bank', titleTr: 'Gece Dalgası', subtitle: 'Hold the triple-runway picture through a dense arrival wave.',
    scenarioId: 'ist', mode: 'advanced', flowId: 'south-triple', seed: 660_612,
    briefing: 'The evening long-haul wave arrives on the south configuration. Use all available capacity without compressing wake spacing.',
    briefingTr: 'Akşam uzun menzil dalgası güney konfigürasyonuna geliyor. Wake aralığını sıkıştırmadan tüm pist kapasitesini kullan.',
    focusTr: 'üçlü bağımsız akış, ağır uçak aralığı ve yüksek iş yükü',
    goal: { label: 'BÖLÜM 06 · GECE DALGASI', targetLandings: 6, targetHandoffs: 2, maximumLosses: 0, targetScore: 850 },
    beats: [
      { id: 'long-haul-wave', trigger: { kind: 'time', value: 40 }, effect: { kind: 'demand-pulse', nextTrafficDelaySeconds: 1 }, type: 'warning', message: 'GECE DALGASI · uzun menzil bankası erken geliyor · ağır uçak wake aralığını koru' },
      { id: 'capacity-held', trigger: { kind: 'landings', value: 3 }, effect: { kind: 'message' }, type: 'success', message: 'ÜÇLÜ KAPASİTE KORUNDU · son bankayı pistler arasında dengeli dağıt' },
    ],
    outcomeNarratives: {
      distinction: 'Gece dalgası üç pistte dengeli aktı; wake aralıkları ve sektör devri hatasız kaldı. Baş kontrolör vardiyaya olumlu not düştü.',
      qualified: 'Yoğun uzun menzil bankası emniyetle kapatıldı. Son sınav için uzman vardiya yetkisi verildi.',
      repeat: 'Gece dalgası tamamlanmadı. Ağır uçakları erken ayır, aynı piste art arda gelen trafiğin hızını daha uzakta yönet.',
    },
  },
  {
    id: 'chief-controller', number: 7, title: 'Chief Controller', titleTr: 'Baş Kontrolör', subtitle: 'Run the whole room through a changing Istanbul operation.',
    scenarioId: 'ist', mode: 'expert', flowId: 'north-parallel', seed: 770_707,
    briefing: 'Your final assessment combines a dense bank, priority handling and the airport operation change. There is no single scripted solution.',
    briefingTr: 'Final değerlendirme yoğun banka, öncelik kararı ve meydan operasyon değişikliğini birleştiriyor. Tek bir ezber çözüm yok.',
    focusTr: 'tam sektör hâkimiyeti, emniyet ve değişen operasyon',
    goal: { label: 'BÖLÜM 07 · BAŞ KONTROLÖR', targetLandings: 7, targetHandoffs: 3, maximumLosses: 0, targetScore: 1100 },
    beats: [
      { id: 'final-assessment', trigger: { kind: 'time', value: 20 }, effect: { kind: 'message' }, type: 'info', message: 'FİNAL DEĞERLENDİRME · vardiya sende · kapasite, emniyet ve koordinasyonu birlikte yönet' },
      { id: 'assessment-priority', trigger: { kind: 'landings', value: 2 }, effect: { kind: 'priority-arrival', priorityKind: 'minimumFuel', responseWindowSeconds: 220 }, type: 'warning', message: '{callsign} MINIMUM YAKIT · sıra avantajını emniyetli bir boşlukla ver' },
      { id: 'assessment-pulse', trigger: { kind: 'handoffs', value: 2 }, effect: { kind: 'demand-pulse', nextTrafficDelaySeconds: 1 }, type: 'danger', message: 'SON BANKA · sınır talebi arttı · mevcut resmi bozmadan final kapasitesini koru' },
    ],
    outcomeNarratives: {
      distinction: 'Final değerlendirme hatasız tamamlandı. İstanbul Control vardiya defteri seni emniyet, kapasite ve karar kalitesiyle Baş Kontrolör olarak kaydetti.',
      qualified: 'Final vardiyası hedefleri karşılandı. İlk Nöbet sezonu tamamlandı ve bağımsız vardiya yetkinliğin onaylandı.',
      repeat: 'Final değerlendirme henüz kapanmadı. Trafik olayları aynı tohumla yeniden kurulacak; kararlarını karşılaştırarak tekrar dene.',
    },
  },
] as const;

export const FIRST_WATCH_SEASON: CareerSeasonDefinition = {
  id: 'istanbul-first-watch',
  title: 'Istanbul Control',
  subtitle: 'First Watch',
  homeScenarioId: 'ist',
  episodes: FIRST_WATCH_EPISODES,
};

const EPISODE_IDS = new Set<CareerEpisodeId>(FIRST_WATCH_EPISODES.map((episode) => episode.id));
const EPISODE_BY_ID = new Map(FIRST_WATCH_EPISODES.map((episode) => [episode.id, episode]));
const PERFORMANCE_FLAGS = new Set<CareerPerformanceFlag>(Object.keys(CAREER_FLAG_LABELS) as CareerPerformanceFlag[]);
const OUTCOME_RANK: Record<CareerOutcomeTier, number> = { repeat: 0, qualified: 1, distinction: 2 };

export function isCareerEpisodeId(value: unknown): value is CareerEpisodeId {
  return typeof value === 'string' && EPISODE_IDS.has(value as CareerEpisodeId);
}

export function isCareerPerformanceFlag(value: unknown): value is CareerPerformanceFlag {
  return typeof value === 'string' && PERFORMANCE_FLAGS.has(value as CareerPerformanceFlag);
}

export function careerEpisodeById(id: CareerEpisodeId | null | undefined) {
  return id ? EPISODE_BY_ID.get(id) ?? null : null;
}

export function sanitizeCompletedCareerEpisodes(value: unknown): CareerEpisodeId[] {
  if (!Array.isArray(value)) return [];
  const candidates = new Set(value.filter(isCareerEpisodeId));
  const completed: CareerEpisodeId[] = [];
  for (const episode of FIRST_WATCH_EPISODES) {
    if (!candidates.has(episode.id)) break;
    completed.push(episode.id);
  }
  return completed;
}

export function sanitizeCareerOutcomes(value: unknown): Partial<Record<CareerEpisodeId, CareerOutcomeTier>> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).filter(([id, tier]) => (
    isCareerEpisodeId(id) && (tier === 'distinction' || tier === 'qualified' || tier === 'repeat')
  ))) as Partial<Record<CareerEpisodeId, CareerOutcomeTier>>;
}

export function unlockedCareerEpisodeIds(completedIds: readonly CareerEpisodeId[]) {
  const completed = new Set(sanitizeCompletedCareerEpisodes(completedIds));
  return FIRST_WATCH_EPISODES.filter((episode, index) => index === 0 || completed.has(FIRST_WATCH_EPISODES[index - 1]!.id)).map((episode) => episode.id);
}

export function bestCareerOutcome(current: CareerOutcomeTier | undefined, candidate: CareerOutcomeTier) {
  return !current || OUTCOME_RANK[candidate] > OUTCOME_RANK[current] ? candidate : current;
}

function triggerMet(state: GameState, trigger: CareerBeatTrigger) {
  if (trigger.kind === 'time') return state.elapsedSeconds >= trigger.value;
  if (trigger.kind === 'landings') return state.landed >= trigger.value;
  if (trigger.kind === 'handoffs') return state.handoffs >= trigger.value;
  return state.score >= trigger.value;
}

function appendCareerEvent(state: GameState, event: GameEvent) {
  return {
    ...state,
    eventLog: [...state.eventLog, event].slice(-5),
    eventTimeline: [...state.eventTimeline, event].slice(-60),
  };
}

function applyBeatEffect(state: GameState, beat: CareerBeat): GameState | null {
  if (beat.effect.kind === 'message') return state;
  if (beat.effect.kind === 'demand-pulse') {
    return { ...state, nextTrafficAt: Math.min(state.nextTrafficAt, state.elapsedSeconds + beat.effect.nextTrafficDelaySeconds) };
  }
  if (beat.effect.kind === 'flow-change') return { ...state, flowId: beat.effect.flowId };
  const priorityAircraft = state.aircraft
    .filter((aircraft) => aircraft.phase === 'arrival' && !aircraft.priority)
    .sort((first, second) => first.callsign.localeCompare(second.callsign))[0];
  if (!priorityAircraft) return null;
  const priorityEffect = beat.effect;
  return {
    ...state,
    aircraft: state.aircraft.map((aircraft) => aircraft.callsign === priorityAircraft.callsign ? {
      ...aircraft,
      priority: {
        kind: priorityEffect.priorityKind,
        deadlineAt: state.elapsedSeconds + priorityEffect.responseWindowSeconds,
        alertRaised: false,
      },
    } : aircraft),
  };
}

/** Applies each story beat once. The function is pure and replay-safe: the
 * event id stored in the timeline is the idempotency key. */
export function applyCareerEpisodeEvents(state: GameState, episode: CareerEpisode): GameState {
  let next = state;
  for (const beat of episode.beats) {
    const eventId = `career-${episode.id}-${beat.id}`;
    if (next.eventTimeline.some((event) => event.id === eventId) || !triggerMet(next, beat.trigger)) continue;
    const effected = applyBeatEffect(next, beat);
    if (!effected) continue;
    const priorityCallsign = effected.aircraft.find((aircraft) => aircraft.priority && !next.aircraft.find((previous) => previous.callsign === aircraft.callsign)?.priority)?.callsign;
    next = appendCareerEvent(effected, {
      id: eventId,
      type: beat.type,
      message: beat.message.replace('{callsign}', priorityCallsign ?? 'ÖNCELİKLİ TRAFİK'),
    });
  }
  return next;
}

export function evaluateCareerEpisode(state: GameState, episode: CareerEpisode, report: DebriefReport): CareerEpisodeResult {
  const complete = goalComplete(state, episode.goal);
  const flawless = state.metrics.separationLosses === 0
    && state.metrics.wakeViolations === 0
    && state.metrics.goArounds === 0
    && state.metrics.missedHandoffs === 0
    && state.metrics.unmanagedArrivals === 0
    && state.metrics.expiredPriorities === 0;
  const distinctionGrade = report.grade === 'A' || (episode.goal.targetLandings < 3 && report.grade === 'B');
  const tier: CareerOutcomeTier = !complete ? 'repeat' : flawless && distinctionGrade ? 'distinction' : 'qualified';
  const flags: CareerPerformanceFlag[] = [];
  const beatApplied = (kind: CareerBeatEffect['kind']) => episode.beats.some((beat) => (
    beat.effect.kind === kind && state.eventTimeline.some((event) => event.id === `career-${episode.id}-${beat.id}`)
  ));
  if (complete) flags.push('objective-complete');
  if (state.elapsedSeconds >= 30 && state.metrics.separationLosses === 0) flags.push('clean-separation');
  if (state.landed > 0 && state.metrics.goArounds === 0 && state.metrics.unmanagedArrivals === 0) flags.push('stable-approaches');
  if (beatApplied('priority-arrival') && state.metrics.expiredPriorities === 0) flags.push('priority-protected');
  if (beatApplied('flow-change') && complete) flags.push('flow-adapted');
  if (state.peakSkill >= (episode.mode === 'expert' ? 10 : episode.mode === 'advanced' ? 7 : 5)) flags.push('high-workload');
  return { tier, label: CAREER_OUTCOME_LABELS[tier], complete, narrative: episode.outcomeNarratives[tier], flags };
}
