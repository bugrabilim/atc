# Airspace Control — güncel proje devri

Güncelleme: 2026-08-31

Bu belge, Airspace Control projesinin devralınabilir güncel durumunu tek yerde
özetler. Çalışan kod için tek kaynak GitHub `main` dalıdır. Tarihsel dosyalar
yalnızca izlenebilirlik amacıyla [`docs/archive`](./archive/README.md) altında
tutulur ve uygulama derlemesine girmez.

## Kanonik adresler

| Konu | Adres / kural |
| --- | --- |
| GitHub | `https://github.com/bugrabilim/atc` |
| Üretim landing | `https://atc-tr.vercel.app` |
| Doğrudan oyun | `https://atc-tr-play.vercel.app` |
| Kaynak gerçekliği | GitHub `main` |
| Dağıtım | Vercel, GitHub `main` üzerinden |
| Canlı commit kanıtı | Her iki alan adında `/build-info.json` |
| Yerel kalıcılık | Tarayıcı `localStorage`; sunucu hesabı yok |

## Doğrulanmış ürün durumu

| Alan | Güncel kapsam |
| --- | --- |
| Oynanabilir platform | Responsive web/PWA; masaüstü ve mobil tarayıcı |
| Havalimanı kataloğu | 50 |
| Yayımlanmış runtime rotası olan meydan | 29 |
| Generated vector kullanan meydan | 21 |
| Zorluk seviyesi | 4 |
| Flight Academy | 10 uygulamalı ders |
| Hikâye kariyeri | 7 bölümlük `Istanbul Control — First Watch` |
| Başarım | 52 |
| Otomatik test | 20 test dosyasında 137 test |
| Kalite kapısı | Typecheck + test + production build + dağıtım artefaktı kontrolü |
| Son doğrulanan ana JavaScript paketi | 520.565 bayt; üst sınır 530.000 bayt |
| Son temiz yerel doğrulama | 2026-08-31; Node 24.19.0, 137/137 test ve production build başarılı |

Bu sayılar, arşivlenmiş ilk prototiplerin değil güncel TypeScript kod ağacının
durumudur. Prosedür kapsamı için ayrıntılı ve meydan bazlı liste
[`PUBLISHED_PROCEDURES.md`](./PUBLISHED_PROCEDURES.md) dosyasındadır.

## Uygulanan işlevler

### Simülasyon ve kontrol

- Oyuncu vektörüne bağlı geliş ve gidiş trafiği; controller komutu verilmeden
  uçakların kendiliğinden finale dönmediği simülasyon.
- Heading, sol/sağ dönüş, irtifa/flight level, hız, normal hız otomasyonu ve
  hızlandırılmış tırmanış/alçalış komutları.
- `DCT`, `HOLD`, yayımlanmış `STAR`/`SID`, ILS ve localizer-only komutları.
- Bank/roll, IAS, ground speed ve rüzgâr etkisini kullanan uçuş dinamiği.
- `ARMED → LOC → GS → TOWER` yaklaşma durum makinesi ve otomatik kule devri.
- 3 NM / 1.000 ft ayırma kaybı, CPA öngörüsü ve paralel yaklaşma istisnası.
- Altı wake kategorisi, wake aralığı ve radar üzeri wake gösterimi.
- Skill değerine göre artıp azalan deterministik trafik üretimi.
- Tıbbi öncelik ve minimum yakıt trafiği; düşük görüş, pist kapasitesi ve akış
  değişikliği olayları.
- Tamamlanabilir vardiya hedefi, kayıp/başarı koşulları ve ayrıntılı debrief.

### Arayüz ve erişim

- Canvas 2D radar; pan, zoom, lock, predictor, mesafe ölçümü ve taşınabilir
  uçuş etiketi.
- Dokunma, fare, uçuş listesi ve klavye ile seçim; çağrı kodu tamamlama ve
  attention-priority `Tab` akışı.
- Telefon ekranında radar alanını koruyan açılır komut konsolu ve büyük dokunma
  hedefleri.
- Pilot readback kuyruğu, görsel ses göstergeleri ve isteğe bağlı tarayıcı TTS.
- İngilizce öncelikli landing sayfası, ayrı doğrudan oyun alan adı ve PWA
  manifest/offline kabuğu.

### İçerik ve geri dönüş döngüsü

- 50 meydanlık skorla açılan kariyer kataloğu; İstanbul ürün kararıyla ilk
  sıradadır, kalan sıralama ACI 2025 yolcu trafiğine dayanır.
- İlk beş meydan için elle araştırılmış dört akışlı operasyon paketleri.
- Her gün aynı seed ve akışı üreten Daily Radar, günlük seri, son 30 vardiyalık
  logbook ve Web Share sonuç kartı.
- 10 kısa Flight Academy dersi, controller coach ve kalıcı ders ilerlemesi.
- Performansa göre dallanan sonuçları ve olay tetikleyicileri olan yedi bölümlük
  First Watch sezonu.
- 52 başarımın kariyer kilitleri, görev paneli ve debrief ile bütünleşmesi.

## Komut sözleşmesi

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
AR101 DCT FIX
AR101 HOLD FIX
AR101 STAR PROCEDURE_ID
AR101 SID PROCEDURE_ID
```

Aynı satırda birden fazla talimat birleştirilebilir. Aktif trafikte benzersizse
çağrı kodu kısaltılabilir. Parser ve uygulama sözleşmesinin kanonik kodu
`src/engine/commands.ts`, radyo kuyruğu `src/engine/radio.ts` içindedir.

## Teknik mimari

| Sorumluluk | Kanonik dosya / klasör |
| --- | --- |
| Uygulama orkestrasyonu | `src/ui/App.tsx` |
| Radar çizimi | `src/ui/RadarScope.tsx` |
| Simülasyon çevrimi | `src/engine/simulation.ts` |
| Uçuş dinamiği | `src/engine/aircraftDynamics.ts` |
| Komut ayrıştırma | `src/engine/commands.ts` |
| Yaklaşma durum makinesi | `src/engine/approach.ts` |
| Ayırma / CPA | `src/engine/separation.ts` |
| Rota takibi | `src/engine/navigation.ts` |
| Trafik yöneticisi | `src/engine/trafficDirector.ts` |
| Dünya ve senaryolar | `src/engine/scenario.ts` |
| 50 meydan verisi | `src/engine/airportCatalog.ts` |
| Flagship operasyonları | `src/engine/airportOperations.ts` |
| Prosedür kataloğu | `src/engine/publishedProcedureCatalog.ts` |
| FAA üretilmiş veri | `src/engine/generated/faaCifpProcedures.ts` |
| Uluslararası prosedürler | `src/engine/*PublishedProcedures.ts` |
| Academy | `src/engine/academy.ts` |
| Başarım/kariyer ilerlemesi | `src/engine/progression.ts` |
| First Watch | `src/engine/careerSeason.ts` |
| Daily/streak/logbook | `src/engine/engagement.ts` |
| Kayıt şeması | `src/engine/session.ts` |

Motor, React arayüzünden bağımsız TypeScript modülleri olarak tutulur. Testler
ilgili modülün yanında `*.test.ts` şeklindedir. Runtime yığını React 19,
TypeScript 7, Vite 8 ve Vitest 4'tür; hedef Node sürümü 24'tür.

## Veri ve prosedür doğruluğu

- Meydan/pist geometrisinin tabanı OurAirports commit
  `be07e33e6cc10087f57064f2bb3fccfcd39f5801` anlık görüntüsüdür.
- Yolcu sırası ACI 2025 listesidir; İstanbul bilinçli ürün kararıyla 1. sıraya
  taşınmıştır.
- ABD prosedürleri FAA d-TPP/CIFP cycle 2608 verisinden türetilmiştir.
- İncelenen uluslararası prosedürlerin otorite, döngü ve uyarlama kayıtları
  `docs/PUBLISHED_PROCEDURES.md` ile ilgili paketlerin kaynak manifestlerindedir.
- 29 meydanda yayımlanmış kimlik ve fix sırası taşıyan runtime rotaları vardır.
  Kalan 21 meydan bunları gerçek prosedür gibi göstermeden generated vector
  kullanır.
- Radar geometrisi kompakt oyun sahasına projekte edilir; bu veri seyrüsefer
  derecesinde değildir. `GAME ONLY` sınırı korunmalıdır.

FAA'nın yaklaşık 53 MB'lık ham CIFP dosyası lisans/döngü/boyut nedeniyle depoya
konmaz. Tekrarlanabilir importer `scripts/import-faa-cifp.mjs`, incelenebilir
deterministik çıktı ise repodadır. Tüm kaynak ve saklama kararları
[`SOURCE_INVENTORY.md`](./SOURCE_INVENTORY.md) içinde kayıtlıdır.

## Kalıcılık ve çevrimiçi servis sınırı

Uygulama şu anahtarlarla yalnızca tarayıcıda saklama yapar:

- `airspace-control-career-v1`
- `airspace-control-session-v1`
- `airspace-control-academy-v1`

Kullanıcı hesabı, parola, Supabase, sunucu veritabanı veya çevrimiçi leaderboard
yoktur. Bulut kayıt ve leaderboard bilinçli olarak ertelenmiştir. Mevcut kayıt
şemaları eski veya elle değiştirilmiş veriyi doğrulayarak geri yükler.

## Yayın ve kalite kapısı

Bu sürümde yayın güvenlik ağı şunları zorunlu kılar:

1. `.node-version` ve `package.json` ile Node 24.
2. Tam kilitli npm sürümleri ve temiz ortamda `npm ci`.
3. GitHub Actions `Quality Gate`: `npm run verify`.
4. TypeScript typecheck, 137 test, production build ve gerekli PWA dosyaları.
5. Ana JavaScript paketi için 530.000 bayt üst sınır.
6. Build sırasında commit/dal/zaman içeren `dist/build-info.json`.
7. Her iki üretim alanında commit eşleşmesini sınayan `npm run verify:live`.
8. Yayın sonrası landing, doğrudan oyun, bir gerçek komut ve tarayıcı konsolu
   kontrolü.

Ayrıntılı sıra [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) dosyasındadır.
`dist`, `node_modules` ve TypeScript build-info dosyaları kaynak kontrolüne
alınmaz.

## Açık işler ve bilinen riskler

1. **Prosedür kapsamı:** 21/50 meydan hâlâ generated vector kullanıyor.
2. **Prosedür derinliği:** Kapsam ağırlıklı olarak STAR; dünya çapında SID,
   yaklaşma ve missed-approach katmanı henüz eşit derinlikte değil.
3. **Acil durumlar:** 7600 telsiz arızası, motor arızası, fırtına hücresi ve
   volkanik kül simülasyonu yok.
4. **Mobil kabul:** Responsive/PWA çalışıyor; imzalı Android `.aab` ve iOS `.ipa`
   üretimi, gerçek cihaz matrisi ve mağaza formları tamamlanmadı.
5. **Dayanıklılık:** 30–60 dakikalık otomatik uzun vardiya ve tarayıcı uçtan uca
   testi yok.
6. **Ses kabulü:** Tarayıcı TTS/ses kodu mevcut; farklı gerçek cihazlarda
   duyulabilirlik kabulü tamamlanmadı.
7. **Paket boyutu:** Tek ana JS paketi bütçenin altında olsa da sınırına yakındır;
   sonraki büyük arayüz modülleri code-splitting gerektirebilir.
8. **Bulut:** Hesap, cihazlar arası kayıt ve çevrimiçi sıralama ertelenmiştir.

## Korunacak ürün kararları

- Trafik üretimi deterministik/seed tabanlıdır; AI trafik eklenmeyecektir.
- İstanbul kariyerin ilk meydanıdır.
- Mevcut 50 meydan, prosedürler, acil durum/öncelik içerikleri ve yerel ilerleme
  geriye dönük uyumluluk gözetilmeden kaldırılmamalıdır.
- Proje başka bir oyunun kodunu, markasını veya görsel varlığını kopyalamaz.
- Navigasyon doğruluğu iddiası yapılmaz; kaynak ve oyun uyarlaması ayrımı her
  yeni veri paketinde yazılı tutulur.
- Bulut/Supabase/leaderboard ancak ayrı ürün kararıyla açılır.

## Önerilen uygulama sırası

1. Kalan 21 meydanın erişilebilir yetkili kaynaklarla prosedür kapsamı.
2. SID, yaklaşma ve missed-approach veri modeli/oynanışı.
3. 7600, motor arızası, fırtına ve kül acil durumları.
4. Gerçek telefon/tablet kabul matrisi ve 30–60 dakikalık vardiya testleri.
5. Playwright benzeri uçtan uca kritik akış paketi.
6. Paket bölme ve performans bütçesinin iyileştirilmesi.
7. Android/iOS imzalama ve mağaza hazırlığı.
8. Ürün kararı verilirse hesap, bulut kayıt ve leaderboard.

Her adım ayrı dalda yapılmalı; `npm run verify`, preview tarayıcı testi ve
production commit doğrulaması tamamlanmadan sıradaki adım başlatılmamalıdır.

## Geliştirici komutları

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run verify
EXPECTED_COMMIT=$(git rev-parse HEAD) npm run verify:live
```

## Devir ve arşiv

- Tarihsel 26 sayfalık devir belgesi:
  [`archive/2026-08/ATC_Master_Handoff_2026-08-26.docx`](./archive/2026-08/ATC_Master_Handoff_2026-08-26.docx)
- Toplanan özgün prototipler ve QA kanıtı:
  [`archive/README.md`](./archive/README.md)
- Kaynak, checksum ve dışarıda bırakma kaydı:
  [`SOURCE_INVENTORY.md`](./SOURCE_INVENTORY.md)

Eski `feat/academy-mobile-core` dalı güncel `main`e göre tarihsel ve eksiktir;
benzersiz üretim değişikliği kaynağı olarak kullanılmamalı ve doğrudan
birleştirilmemelidir.
