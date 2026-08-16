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
