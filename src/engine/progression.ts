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
  awards: { id: string; label: string }[];
}

export function earnedAwards(state: GameState, goal = shiftGoal(state.mode)) {
  const awards: { id: string; label: string }[] = [];
  if (state.landed > 0) awards.push({ id: 'first-touchdown', label: 'İLK TOUCHDOWN' });
  if (state.metrics.separationLosses === 0 && state.landed >= goal.targetLandings) awards.push({ id: 'clean-shift', label: 'TEMİZ VARDİYA' });
  if (state.metrics.wakeViolations === 0 && state.landed >= 3) awards.push({ id: 'wake-keeper', label: 'WAKE USTASI' });
  if (state.peakSkill >= 12) awards.push({ id: 'high-workload', label: 'YOĞUN AKIŞ' });
  if (state.aircraft.some((item) => item.priority) === false && state.metrics.expiredPriorities === 0 && state.spawned >= 7) awards.push({ id: 'priority-ready', label: 'ÖNCELİK HAZIR' });
  return awards;
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
