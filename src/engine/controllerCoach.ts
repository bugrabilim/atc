import { arrivalAdvice } from './arrivalAdvisor';
import { landingClearanceStatus } from './simulation';
import type { GameState, RadarWorld } from './types';

export interface CoachAdvice {
  tone: 'info' | 'warning' | 'danger' | 'success';
  label: string;
  title: string;
  message: string;
  callsign?: string;
  command?: string;
}

function flightLevel(altitude: number) {
  return `FL${String(Math.max(10, Math.round(altitude / 100))).padStart(3, '0')}`;
}

/**
 * Gives one prioritised, contextual next action. It deliberately avoids inventing
 * clearances when the simulator has not confirmed that they are safe.
 */
export function controllerCoach(state: GameState, world: RadarWorld): CoachAdvice {
  const loss = state.conflicts.find((item) => item.severity === 'loss');
  if (loss) {
    return {
      tone: 'danger',
      label: 'EMNİYET ÖNCE',
      title: 'AYIRMA KAYBI VAR',
      message: `${loss.pair.join(' / ')} arasında ${loss.horizontalNm.toFixed(1)} NM ve ${Math.round(loss.verticalFt)} ft. Birini heading veya irtifa ile hemen ayır.`,
    };
  }

  const predicted = state.conflicts.find((item) => item.predicted);
  if (predicted?.predicted) {
    return {
      tone: 'warning',
      label: 'ÖNGÖRÜ',
      title: 'YAKLAŞAN AYIRMA UYARISI',
      message: `${predicted.pair.join(' / ')} yaklaşık ${Math.ceil(predicted.predicted.timeSeconds)} sn içinde ${predicted.predicted.horizontalNm.toFixed(1)} NM'a düşebilir. Şimdi heading, irtifa veya hız ver.`,
    };
  }

  const pending = state.pendingInstructions.find((item) => item.command.callsign === state.selectedCallsign) ?? state.pendingInstructions[0];
  if (pending) {
    return {
      tone: 'info',
      label: 'PİLOT READBACK',
      title: `${pending.command.callsign} TALİMATI ALIYOR`,
      message: `${pending.normalized} kısa süre içinde uygulanacak. Aynı uçağa çelişen yeni komut vermeden sonucu izle.`,
      callsign: pending.command.callsign,
    };
  }

  const priority = state.aircraft.find((item) => item.priority && !item.priority.alertRaised);
  if (priority) {
    const remaining = Math.max(0, Math.ceil((priority.priority?.deadlineAt ?? state.elapsedSeconds) - state.elapsedSeconds));
    if (!priority.approach && priority.assignedRunway) {
      return {
        tone: 'warning',
        label: 'ÖNCELİKLİ TRAFİK',
        title: `${priority.callsign} İNİŞ SIRASINA AL`,
        message: `${priority.priority?.kind === 'minimumFuel' ? 'Minimum yakıt' : 'Tıbbi uçuş'} · ${remaining} sn kaldı. Uygun ILS yaklaşmasını başlat.`,
        callsign: priority.callsign,
        command: `ILS ${priority.assignedRunway}`,
      };
    }
    if (priority.approach?.status === 'captured' && !priority.approach.landingCleared) {
      const clearance = landingClearanceStatus(state, priority.callsign, world);
      return {
        tone: clearance.ok ? 'warning' : 'info',
        label: 'ÖNCELİKLİ TRAFİK',
        title: clearance.ok ? `${priority.callsign} İNİŞE HAZIR` : `${priority.callsign} FİNALDE BEKLİYOR`,
        message: clearance.ok ? `${remaining} sn kaldı. Pist serbest; iniş izni verebilirsin.` : clearance.message,
        callsign: priority.callsign,
        command: clearance.ok ? 'LAND' : undefined,
      };
    }
    return {
      tone: 'warning',
      label: 'ÖNCELİKLİ TRAFİK',
      title: `${priority.callsign} ÖNCELİKLİ`,
      message: `${priority.priority?.kind === 'minimumFuel' ? 'Minimum yakıt' : 'Tıbbi uçuş'} · ${remaining} sn kaldı. Trafik aralığını koruyarak yaklaşmasını tamamlat.`,
      callsign: priority.callsign,
    };
  }

  const selected = state.aircraft.find((item) => item.callsign === state.selectedCallsign);
  if (selected?.phase === 'arrival') {
    const arrival = arrivalAdvice(state.aircraft, world).get(selected.callsign);
    if (!selected.approach && arrival?.shouldDescend) {
      return {
        tone: 'info',
        label: 'YAKLAŞMA KOÇU',
        title: `${selected.callsign} İÇİN ALÇALMA`,
        message: `${arrival.runwayId} pistinde sıra ${arrival.sequence}. Yaklaşma profiline girmek için ${flightLevel(arrival.recommendedAltitude)} öneriliyor.`,
        callsign: selected.callsign,
        command: flightLevel(arrival.recommendedAltitude),
      };
    }
    if (!selected.approach && selected.assignedRunway) {
      return {
        tone: 'info',
        label: 'YAKLAŞMA KOÇU',
        title: `${selected.callsign} İÇİN ILS`,
        message: `${selected.assignedRunway} planlı pist. Uçak uygun geometriye geldiğinde localizer ve glideslope'u kendisi yakalayacak.`,
        callsign: selected.callsign,
        command: `ILS ${selected.assignedRunway}`,
      };
    }
    if (selected.approach?.status === 'armed') {
      return {
        tone: 'info',
        label: 'YAKLAŞMA KOÇU',
        title: `${selected.callsign} CAPTURE'A GİDİYOR`,
        message: `ILS ${selected.approach.runwayId} silahlı. Uçak yeşil final çizgisine oturana kadar heading, hız ve irtifayı izle.`,
        callsign: selected.callsign,
      };
    }
    if (selected.approach?.status === 'captured' && !selected.approach.landingCleared) {
      const clearance = landingClearanceStatus(state, selected.callsign, world);
      return {
        tone: clearance.ok ? 'success' : 'info',
        label: 'YAKLAŞMA KOÇU',
        title: clearance.ok ? `${selected.callsign} İNİŞE HAZIR` : `${selected.callsign} FİNALDE`,
        message: clearance.ok ? `${selected.approach.runwayId} serbest. Final aralığı emniyetli; iniş izni ver.` : clearance.message,
        callsign: selected.callsign,
        command: clearance.ok ? 'LAND' : undefined,
      };
    }
  }

  if (selected?.phase === 'departure' && !selected.handoffCleared) {
    return {
      tone: 'info',
      label: 'KALKIŞ KOÇU',
      title: `${selected.callsign} İÇİN HANDOFF'U UNUTMA`,
      message: 'Uçak sektör sınırına yaklaşırken HANDOFF ver. Koordinasyonsuz çıkış puan ve emniyet kaybına yol açar.',
      callsign: selected.callsign,
      command: 'HANDOFF',
    };
  }

  return {
    tone: 'info',
    label: 'KONTROLÖR KOÇU',
    title: 'SONRAKİ UÇAĞI SEÇ',
    message: 'Bir uçuş şeridine veya radar etiketine dokun. Koç, seçili uçak için en güvenli sıradaki işi gösterecek.',
  };
}
