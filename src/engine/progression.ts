import type { GameMode, GameState } from './types';

export interface ShiftGoal {
  label: string;
  targetLandings: number;
  targetHandoffs: number;
  maximumLosses: number;
}

export function shiftGoal(mode: GameMode): ShiftGoal {
  if (mode === 'beginner') return { label: 'İLK VARDİYA', targetLandings: 1, targetHandoffs: 0, maximumLosses: 0 };
  if (mode === 'normal') return { label: 'DENGELİ AKIŞ', targetLandings: 3, targetHandoffs: 1, maximumLosses: 1 };
  if (mode === 'advanced') return { label: 'YOĞUN OPERASYON', targetLandings: 6, targetHandoffs: 2, maximumLosses: 1 };
  return { label: 'UZMAN VARDİYA', targetLandings: 10, targetHandoffs: 4, maximumLosses: 0 };
}

export function goalComplete(state: GameState, goal = shiftGoal(state.mode)) {
  return state.landed >= goal.targetLandings
    && state.handoffs >= goal.targetHandoffs
    && state.metrics.separationLosses <= goal.maximumLosses;
}

export interface TrainingGuide {
  step: number;
  totalSteps: number;
  title: string;
  message: string;
  callsign?: string;
  command?: string;
}

export function trainingGuide(state: GameState, trainingCallsign: string | null, runwayId: string | null): TrainingGuide | null {
  if (!trainingCallsign || !runwayId || state.landed > 0) return null;
  const aircraft = state.aircraft.find((item) => item.callsign === trainingCallsign);
  if (!aircraft) return { step: 5, totalSteps: 5, title: 'İLK İNİŞ TAMAMLANDI', message: 'İlk geliş radardan çıktı. Artık diğer trafik üzerinde aynı döngüyü uygulayabilirsin.' };
  if (state.selectedCallsign !== trainingCallsign) {
    return { step: 1, totalSteps: 5, title: 'UÇAĞI SEÇ', message: `${trainingCallsign} uçuş şeridine veya radar etiketine dokun. Seçili uçak komutların hedefidir.`, callsign: trainingCallsign };
  }
  if (!aircraft.approach) {
    return { step: 2, totalSteps: 5, title: 'ILS’İ SİLAHLANDIR', message: `${trainingCallsign} final hattına yakın. ILS ${runwayId} komutunu ver; localizer önce, glideslope ise aşağıdan yakalanır.`, callsign: trainingCallsign, command: `ILS ${runwayId}` };
  }
  if (aircraft.approach.status === 'armed') {
    return { step: 3, totalSteps: 5, title: 'LOCALIZER’I YAKALA', message: `30° civarı kesişme açısı en rahatı. Gerekirse heading ve irtifa ver; ILS silahlı kalır.`, callsign: trainingCallsign };
  }
  if (aircraft.approach.status === 'localizer') {
    return { step: 4, totalSteps: 5, title: 'GLIDESLOPE’U AŞAĞIDAN YAKALA', message: `${trainingCallsign} localizer üzerinde. Uçağın süzülüş hattının altında kalmasını sağla; yakaladığında kule devri otomatik olacak.`, callsign: trainingCallsign };
  }
  return { step: 5, totalSteps: 5, title: aircraft.approach.status === 'tower' ? 'KULEYE DEVREDİLDİ' : 'ESTABLISHED', message: `${trainingCallsign} yaklaşma üzerinde. Handoff ve iniş otomatik; sen sıradaki gelişe geçebilirsin.`, callsign: trainingCallsign };
}

export function controllerRank(score: number) {
  if (score >= 180) return 'BAŞ KONTROLÖR';
  if (score >= 100) return 'KIDEMLİ KONTROLÖR';
  if (score >= 55) return 'YAKLAŞMA KONTROLÖRÜ';
  return 'STAJYER KONTROLÖR';
}

export function nextMission(landed: number, score: number) {
  if (landed < 1) return 'İlk gelişi heading, irtifa ve hızla final hattına getir; ILS ile LOC ve glideslope established olduğunda kule devri otomatik.';
  if (landed < 3) return 'İki geliş daha sıraya al. DCT/HOLD ile final aralığını ve wake mesafesini koru.';
  if (score < 90) return 'Skill yükseldikçe trafik artar. Hata yaparsan yük azalır; toparlanıp yeniden tırman.';
  return 'Serbest operasyon: gelişleri iki aktif pist arasında dağıt, kalkışları handoff noktasına ulaştır ve ayırma kaybı yaşatma.';
}

export interface DebriefReport {
  grade: 'A' | 'B' | 'C' | 'D';
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  objective: string;
  objectiveComplete: boolean;
  awards: AchievementAward[];
}

export interface AchievementAward {
  id: string;
  label: string;
  description: string;
}

interface AchievementDefinition extends AchievementAward {
  earned: (state: GameState, goal: ShiftGoal) => boolean;
}

function commandCount(state: GameState, token: string) {
  return state.commandHistory.filter((entry) => entry.normalized.toUpperCase().includes(token)).length;
}

const clean = (state: GameState) => state.metrics.separationLosses === 0;
const perfectlyManaged = (state: GameState) => clean(state)
  && state.metrics.wakeViolations === 0
  && state.metrics.goArounds === 0
  && state.metrics.unmanagedArrivals === 0
  && state.metrics.expiredPriorities === 0;

/**
 * Shared, deterministic achievement catalogue. It lives in the simulation
 * layer, so browser, installed PWA and Capacitor iOS/Android builds all use
 * the exact same unlock rules and persisted IDs.
 */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-touchdown', label: 'İLK TOUCHDOWN', description: 'İlk güvenli inişi tamamla.', earned: (s) => s.landed >= 1 },
  { id: 'landing-trio', label: 'ÜÇLÜ FİNAL', description: 'Bir vardiyada 3 iniş tamamla.', earned: (s) => s.landed >= 3 },
  { id: 'landing-six', label: 'AKIŞ KURUCUSU', description: 'Bir vardiyada 6 iniş tamamla.', earned: (s) => s.landed >= 6 },
  { id: 'landing-ten', label: 'ONLU TRAFİK', description: 'Bir vardiyada 10 iniş tamamla.', earned: (s) => s.landed >= 10 },
  { id: 'landing-fifteen', label: 'FİNAL MARATONU', description: 'Bir vardiyada 15 iniş tamamla.', earned: (s) => s.landed >= 15 },
  { id: 'landing-twentyfive', label: 'GÖKYÜZÜ NÖBETİ', description: 'Bir vardiyada 25 iniş tamamla.', earned: (s) => s.landed >= 25 },
  { id: 'first-handoff', label: 'İLK DEVİR', description: 'İlk güvenli sektör handoff’unu tamamla.', earned: (s) => s.handoffs >= 1 },
  { id: 'handoff-trio', label: 'KALKIŞ MASASI', description: 'Bir vardiyada 3 handoff tamamla.', earned: (s) => s.handoffs >= 3 },
  { id: 'handoff-six', label: 'SEKTÖR AKIŞI', description: 'Bir vardiyada 6 handoff tamamla.', earned: (s) => s.handoffs >= 6 },
  { id: 'handoff-ten', label: 'DEVİR USTASI', description: 'Bir vardiyada 10 handoff tamamla.', earned: (s) => s.handoffs >= 10 },
  { id: 'score-25', label: 'İLK PUAN', description: '25 puana ulaş.', earned: (s) => s.score >= 25 },
  { id: 'score-75', label: 'KONTROL ALTINDA', description: '75 puana ulaş.', earned: (s) => s.score >= 75 },
  { id: 'score-150', label: 'YÜKSEK STANDART', description: '150 puana ulaş.', earned: (s) => s.score >= 150 },
  { id: 'score-250', label: 'RADAR ASI', description: '250 puana ulaş.', earned: (s) => s.score >= 250 },
  { id: 'score-400', label: 'KUSURSUZ SKOR', description: '400 puana ulaş.', earned: (s) => s.score >= 400 },
  { id: 'skill-6', label: 'TEMPO YAKALANDI', description: 'Peak skill 6 seviyesine ulaş.', earned: (s) => s.peakSkill >= 6 },
  { id: 'skill-9', label: 'YOĞUN RADAR', description: 'Peak skill 9 seviyesine ulaş.', earned: (s) => s.peakSkill >= 9 },
  { id: 'high-workload', label: 'YOĞUN AKIŞ', description: 'Peak skill 12 seviyesine ulaş.', earned: (s) => s.peakSkill >= 12 },
  { id: 'skill-15', label: 'BASKI ALTINDA', description: 'Peak skill 15 seviyesine ulaş.', earned: (s) => s.peakSkill >= 15 },
  { id: 'clean-start', label: 'TEMİZ BAŞLANGIÇ', description: 'Ayırma kaybı olmadan ilk inişi tamamla.', earned: (s) => s.landed >= 1 && clean(s) },
  { id: 'clean-shift', label: 'TEMİZ VARDİYA', description: 'Vardiya hedefini ayırma kaybı olmadan tamamla.', earned: (s, g) => clean(s) && goalComplete(s, g) },
  { id: 'safety-net', label: 'EMNİYET AĞI', description: '3 inişi ayırma kaybı olmadan tamamla.', earned: (s) => s.landed >= 3 && clean(s) },
  { id: 'wake-keeper', label: 'WAKE USTASI', description: '3 inişi wake ihlali olmadan tamamla.', earned: (s) => s.landed >= 3 && s.metrics.wakeViolations === 0 },
  { id: 'wake-shield', label: 'KATEGORİ KALKANI', description: '6 inişi wake ihlali olmadan tamamla.', earned: (s) => s.landed >= 6 && s.metrics.wakeViolations === 0 },
  { id: 'stable-three', label: 'STABİL YAKLAŞMA', description: '3 inişi go-around olmadan tamamla.', earned: (s) => s.landed >= 3 && s.metrics.goArounds === 0 },
  { id: 'no-lost-arrivals', label: 'SEKTÖR SAHİBİ', description: '3 inişi kontrol edilmeden geliş kaybetmeden tamamla.', earned: (s) => s.landed >= 3 && s.metrics.unmanagedArrivals === 0 },
  { id: 'priority-ready', label: 'ÖNCELİK HAZIR', description: 'Yoğun trafikte öncelikli uçağın süresini aşma.', earned: (s) => s.metrics.expiredPriorities === 0 && s.spawned >= 7 },
  { id: 'priority-shield', label: 'ÖNCELİK KALKANI', description: '12 uçaklık akışta öncelik süresi aşma.', earned: (s) => s.metrics.expiredPriorities === 0 && s.spawned >= 12 },
  { id: 'five-minutes', label: 'İLK NÖBET', description: '5 dakika operasyon yönet.', earned: (s) => s.elapsedSeconds >= 5 * 60 },
  { id: 'ten-minutes', label: 'UZUN VARDİYA', description: '10 dakika operasyon yönet.', earned: (s) => s.elapsedSeconds >= 10 * 60 },
  { id: 'twenty-minutes', label: 'DAYANIKLILIK', description: '20 dakika operasyon yönet.', earned: (s) => s.elapsedSeconds >= 20 * 60 },
  { id: 'thirty-minutes', label: 'GECE NÖBETİ', description: '30 dakika operasyon yönet.', earned: (s) => s.elapsedSeconds >= 30 * 60 },
  { id: 'traffic-eight', label: 'SEKİZLİ AKIŞ', description: 'Bir vardiyada 8 uçak üret.', earned: (s) => s.spawned >= 8 },
  { id: 'traffic-twelve', label: 'KALABALIK SAHA', description: 'Bir vardiyada 12 uçak üret.', earned: (s) => s.spawned >= 12 },
  { id: 'high-density', label: 'KAPASİTE SINIRI', description: 'Yoğunluk 3 ve üzerindeyken 8 uçak yönet.', earned: (s) => s.trafficLevel >= 3 && s.spawned >= 8 },
  { id: 'first-command-set', label: 'KOMUT DİSİPLİNİ', description: '5 kontrol komutu ver.', earned: (s) => s.commandHistory.length >= 5 },
  { id: 'command-cadence', label: 'KOMUT RİTMİ', description: '15 kontrol komutu ver.', earned: (s) => s.commandHistory.length >= 15 },
  { id: 'vector-captain', label: 'VEKTÖR KAPTANI', description: '5 heading komutu ver.', earned: (s) => commandCount(s, 'HDG') >= 5 },
  { id: 'altitude-manager', label: 'İRTİFA YÖNETİCİSİ', description: '5 irtifa komutu ver.', earned: (s) => commandCount(s, 'FL') >= 5 },
  { id: 'speed-controller', label: 'HIZ DİZİNCİSİ', description: '5 hız komutu ver.', earned: (s) => commandCount(s, 'SPD') >= 5 },
  { id: 'procedure-pilot', label: 'PROSEDÜR UZMANI', description: 'STAR veya SID kullan.', earned: (s) => commandCount(s, 'STAR') + commandCount(s, 'SID') >= 1 },
  { id: 'holding-strategist', label: 'HOLD STRATEJİSTİ', description: 'Bir HOLD komutu kullan.', earned: (s) => commandCount(s, 'HOLD') >= 1 },
  { id: 'beginner-complete', label: 'EĞİTİM TAMAM', description: 'Yeni Başlayan vardiya hedefini tamamla.', earned: (s, g) => s.mode === 'beginner' && goalComplete(s, g) },
  { id: 'normal-complete', label: 'DENGELİ OPERATÖR', description: 'Normal vardiya hedefini tamamla.', earned: (s, g) => s.mode === 'normal' && goalComplete(s, g) },
  { id: 'advanced-complete', label: 'YOĞUN OPERATÖR', description: 'İleri vardiya hedefini tamamla.', earned: (s, g) => s.mode === 'advanced' && goalComplete(s, g) },
  { id: 'expert-complete', label: 'UZMAN OPERATÖR', description: 'Uzman vardiya hedefini tamamla.', earned: (s, g) => s.mode === 'expert' && goalComplete(s, g) },
  { id: 'beginner-perfect', label: 'TEMİZ EĞİTİM', description: 'Yeni Başlayan hedefini kusursuz tamamla.', earned: (s, g) => s.mode === 'beginner' && goalComplete(s, g) && perfectlyManaged(s) },
  { id: 'normal-perfect', label: 'TEMİZ DENGE', description: 'Normal hedefini kusursuz tamamla.', earned: (s, g) => s.mode === 'normal' && goalComplete(s, g) && perfectlyManaged(s) },
  { id: 'advanced-perfect', label: 'TEMİZ YOĞUNLUK', description: 'İleri hedefini kusursuz tamamla.', earned: (s, g) => s.mode === 'advanced' && goalComplete(s, g) && perfectlyManaged(s) },
  { id: 'expert-perfect', label: 'ALTIN RADAR', description: 'Uzman hedefini kusursuz tamamla.', earned: (s, g) => s.mode === 'expert' && goalComplete(s, g) && perfectlyManaged(s) },
  { id: 'all-clear', label: 'TAM EMNİYET', description: '6 iniş, 3 handoff ve sıfır operasyon hatası yap.', earned: (s) => s.landed >= 6 && s.handoffs >= 3 && perfectlyManaged(s) },
  { id: 'master-controller', label: 'BAŞ KONTROLÖR', description: '10 iniş, 6 handoff ve 250 puana ulaş.', earned: (s) => s.landed >= 10 && s.handoffs >= 6 && s.score >= 250 },
];

export const ACHIEVEMENT_TOTAL = ACHIEVEMENTS.length;
export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));

/** Protects persisted career data from old builds or manually edited storage. */
export function isAchievementId(value: string): boolean {
  return ACHIEVEMENT_IDS.has(value);
}

export function earnedAwards(state: GameState, goal = shiftGoal(state.mode)): AchievementAward[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.earned(state, goal))
    .map(({ id, label, description }) => ({ id, label, description }));
}

export function buildDebrief(state: GameState, goal = shiftGoal(state.mode)): DebriefReport {
  const { metrics } = state;
  const safetyPenalty = metrics.separationLosses * 3 + metrics.expiredPriorities * 2 + metrics.missedHandoffs + metrics.unmanagedArrivals;
  const grade = safetyPenalty === 0 && state.landed >= 3 ? 'A'
    : safetyPenalty <= 1 && state.landed >= 1 ? 'B'
      : safetyPenalty <= 3 ? 'C' : 'D';
  const strengths = [
    state.landed > 0 ? `${state.landed} güvenli iniş tamamlandı.` : 'Henüz iniş tamamlanmadı.',
    state.handoffs > 0 ? `${state.handoffs} sektör handoff’u koordine edildi.` : 'Kalkış handoff’u kaydedilmedi.',
  ];
  const improvements = [
    metrics.separationLosses > 0 ? `${metrics.separationLosses} ayırma kaybı yaşandı; CPA uyarısını daha erken çöz.` : 'Ayırma kaybı yok.',
    metrics.wakeViolations > 0 ? `${metrics.wakeViolations} wake ihlali kaydedildi; lider/takipçi kategorisini ve final aralığını büyüt.` : 'Wake aralığı ihlali yok.',
    metrics.goArounds > 0 ? `${metrics.goArounds} go-around oluştu; iniş izni zamanlamasını güçlendir.` : 'Go-around yok.',
    metrics.unmanagedArrivals > 0 ? `${metrics.unmanagedArrivals} geliş yaklaşma yönetilmeden sektörden çıktı; ILS kararını daha erken ver.` : 'Kontrol edilmeden sektörden çıkan geliş yok.',
    metrics.expiredPriorities > 0 ? `${metrics.expiredPriorities} öncelikli trafik süresi aşıldı.` : 'Öncelikli trafik süresi aşılmadı.',
  ];
  return {
    grade,
    headline: grade === 'A' ? 'ÜST DÜZEY VARDİYA' : grade === 'B' ? 'GÜVENLİ OPERASYON' : grade === 'C' ? 'KONTROLLÜ, FAKAT GELİŞTİRİLEBİLİR' : 'EMNİYET ÖNCELİKLİ TEKRAR GEREKİYOR',
    summary: `${controllerRank(state.score)} · ${Math.floor(state.elapsedSeconds / 60)} dk · peak skill ${state.peakSkill.toFixed(1)}`,
    strengths,
    improvements,
    objective: `${goal.label}: ${state.landed}/${goal.targetLandings} iniş · ${state.handoffs}/${goal.targetHandoffs} handoff · en çok ${goal.maximumLosses} ayırma kaybı`,
    objectiveComplete: goalComplete(state, goal),
    awards: earnedAwards(state, goal),
  };
}
