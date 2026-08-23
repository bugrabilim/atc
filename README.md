# Airspace Control

Mobil ve masaüstü tarayıcılarda çalışan, klasik radar görünümüne sahip yaklaşma kontrol oyunu.

> Bu proje bir oyundur; gerçek uçuş veya operasyonel ATC kullanımı için tasarlanmamıştır.

## Core Parity sürümü

- Responsive Canvas radar
- Oyuncu vektörüne bağlı, otomatik rota izlemeyen geliş trafiği
- Canlı skill değerine göre artıp azalan sonsuz trafik
- Dokunarak, fareyle veya uçuş listesinden uçak seçimi
- Klavyede çağrı kodu tamamlama ve attention-priority `Tab` seçimi
- Bank, roll, IAS, ground speed ve rüzgâr tabanlı uçuş fiziği
- `ARMED → LOC → GS → TOWER` ILS durum makinesi
- Otomatik kule devri; standart yaklaşma modunda `LAND` komutu yoktur
- 3 NM/1.000 ft ayırma, CPA öngörüsü, paralel yaklaşma istisnası
- Altı wake kategorisi, final aralığı ve wake görselleştirmesi
- Radar pan/zoom/lock, taşınabilir etiket, kavisli predictor ve mesafe ölçümü
- Pilot readback kuyruğu ve isteğe bağlı tarayıcı TTS sesi
- PWA manifesti ve çevrimdışı kabuk
- Dört zorlukta tamamlanabilir vardiya hedefleri ve otomatik debrief
- İstanbul, Heathrow, LAX, JFK ve Atlanta için kaynaklı ve birbirinden farklı dört akışlı operasyon paketleri
- İki–üç dakikalık 10 uygulamalı Flight Academy dersi ve kalıcı ders ilerlemesi
- Telefonda radarı küçültmeyen, büyük dokunma hedefli açılır komut konsolu
- Her gün aynı seed/akışla üretilen Daily Radar, günlük seri, 30 vardiyalık yerel logbook ve Web Share sonuç kartı
- Performansa göre üç farklı sonuç üreten, olay tetikleyicili yedi bölümlük `Istanbul Control — First Watch` kariyer sezonu

## Ürün araştırması ve yol haritası

- [Flatout ATC derin araştırma ve işlevsel eşleşme planı](docs/flatout-atc-research-tr.md)
- [Endless ATC eşleşme raporu](docs/endless-atc-parity-report-tr.md)
- [Havaalanı veri politikası](docs/AIRPORT_DATA.md)
- [İlk beş havaalanı operasyon paketi: araştırma ve uygulama kaydı](docs/FLAGSHIP_AIRPORT_PACKS.md)
- [Daily Radar, streak, logbook ve paylaşım veri modeli](docs/RETENTION_SYSTEMS.md)
- [Istanbul Control — First Watch sezon tasarımı ve uygulama sözleşmesi](docs/FIRST_WATCH_SEASON.md)

## Komutlar

```text
AR101 H090
AR101 H270 L
AR101 A30
AR101 FL060
AR101 S220
AR101 I34L
AR101 L34L
AR101 RN
AR101 X
```

Birleşik readback için aynı satırda birden fazla talimat verilebilir:

```text
AR101 H090 A30 S180 I34L
```

`RN` normal hız otomasyonuna döner, `X` tırmanış/alçalışı hızlandırır, `L34L` localizer-only yaklaşmasıdır.

Çağrı kodu kısaltılabilir. Örneğin aktif trafik içinde tek bir `AR` uçuşu varsa:

```text
AR HDG 180
```

komutu otomatik olarak tam çağrı koduna çözülür.

## Kurulum

```bash
npm install
npm run dev
```

## Kontroller

```bash
npm run typecheck
npm test
npm run build
```

## Teknik yapı

- React + TypeScript + Vite
- Radar çizimi: Canvas 2D
- Simülasyon: arayüzden bağımsız TypeScript motoru
- Test: Vitest
- Mobil paketleme hedefi: Capacitor ile Android ve iOS

## Android ve iOS paketleme

Proje PWA olarak hemen kurulabilir; native mağaza paketi için Capacitor yapılandırması da eklidir.
Bir macOS/Android geliştirme ortamında aşağıdaki adımlar App Store ve Google Play için imzalı çıktıya götürür:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
```

Google Play için Android Studio’dan imzalı `.aab`, App Store için Xcode’dan imzalı `.ipa` oluşturulur. Yayın aşamasında geliştirici hesapları, sertifikalar ve mağaza gizlilik formları zorunludur.

## Özgünlük ve veri notu

Pist kimlikleri ve göreli geometri, `docs/AIRPORT_DATA.md` içinde kaynaklandırılan halka açık veriden türetilir. Taktik sektörler, sınır kapıları, trafik ritmi, olay zamanlaması ve vektör yolları oyun için özgün biçimde uyarlanmıştır; seyrüsefer verisi değildir. Proje başka bir oyunun kodunu, markasını veya görsel varlıklarını içermez. Oyun gerçek uçuş operasyonu için kullanılmaz.
