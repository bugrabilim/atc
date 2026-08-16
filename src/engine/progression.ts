import type { GameState } from './types';

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
    return { step: 2, totalSteps: 5, title: 'YAKLAŞMAYI BAŞLAT', message: `${trainingCallsign} için ILS ${runwayId} yaklaşmasını silahlandır. Uçak localizer ve glideslope'a uygun konuma geldiğinde otomatik capture yapar.`, callsign: trainingCallsign, command: `ILS ${runwayId}` };
  }
  if (aircraft.approach.status === 'armed') {
    return { step: 3, totalSteps: 5, title: 'CAPTURE BEKLE', message: `${trainingCallsign} ILS'e yönleniyor. Yeşil yaklaşma çizgisine yaklaştığında capture gerçekleşecek; bu sırada heading ve hızını izle.`, callsign: trainingCallsign };
  }
  if (!aircraft.approach.landingCleared) {
    return { step: 4, totalSteps: 5, title: 'İNİŞ İZNİ VER', message: `${trainingCallsign} localizer ve glideslope üzerinde. Pist ve öndeki trafik uygunsa LAND komutuyla iniş izni ver.`, callsign: trainingCallsign, command: 'LAND' };
  }
  return { step: 5, totalSteps: 5, title: 'FİNALİ İZLE', message: `${trainingCallsign} iniş izni aldı. Finalde kalmasını izle; touchdown sonrası ilk görevin tamamlanacak.`, callsign: trainingCallsign };
}

export function controllerRank(score: number) {
  if (score >= 1800) return 'BAŞ KONTROLÖR';
  if (score >= 900) return 'KIDEMLİ KONTROLÖR';
  if (score >= 350) return 'YAKLAŞMA KONTROLÖRÜ';
  return 'STAJYER KONTROLÖR';
}

export function nextMission(landed: number, score: number) {
  if (landed < 1) return 'İlk inişi tamamla: ILS yakala, finali izle ve doğru anda LAND izni ver.';
  if (landed < 3) return 'İki geliş daha sıraya al. DCT/HOLD ile final aralığını koru; her uçağa planlanan pisti atamak zorunda değilsin.';
  if (score < 900) return 'Yoğunluk artıyor. Aynı piste iniş izni verirken öndeki trafik ve pist işgal uyarılarını kontrol et.';
  return 'Serbest operasyon: gelişleri iki aktif pist arasında dağıt, kalkışları handoff noktasına ulaştır ve ayırma kaybı yaşatma.';
}

export interface DebriefReport {
  grade: 'A' | 'B' | 'C' | 'D';
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export function buildDebrief(state: GameState): DebriefReport {
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
    metrics.goArounds > 0 ? `${metrics.goArounds} go-around oluştu; iniş izni zamanlamasını güçlendir.` : 'Go-around yok.',
    metrics.unmanagedArrivals > 0 ? `${metrics.unmanagedArrivals} geliş yaklaşma yönetilmeden sektörden çıktı; ILS kararını daha erken ver.` : 'Kontrol edilmeden sektörden çıkan geliş yok.',
    metrics.expiredPriorities > 0 ? `${metrics.expiredPriorities} öncelikli trafik süresi aşıldı.` : 'Öncelikli trafik süresi aşılmadı.',
  ];
  return {
    grade,
    headline: grade === 'A' ? 'ÜST DÜZEY VARDİYA' : grade === 'B' ? 'GÜVENLİ OPERASYON' : grade === 'C' ? 'KONTROLLÜ, FAKAT GELİŞTİRİLEBİLİR' : 'EMNİYET ÖNCELİKLİ TEKRAR GEREKİYOR',
    summary: `${controllerRank(state.score)} · ${Math.floor(state.elapsedSeconds / 60)} dk simülasyon · ${state.score} puan`,
    strengths,
    improvements,
  };
}
