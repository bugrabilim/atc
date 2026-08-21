# Flatout ATC Derin Araştırma ve İşlevsel Eşleşme Planı

**Araştırma tarihi:** 21 Ağustos 2026

**İncelenen ürün:** Flatout ATC — iOS/iPadOS uygulaması ve `flatoutatc.com` web ekosistemi

**İncelenen proje:** Airspace Control / ATC-TR, `bugrabilim/atc`

**Depo anlık görüntüsü:** `21f8f819e5e0c641048d4d086383247bfa8aef83`
**Belgenin amacı:** Flatout ATC'nin doğrulanabilen ürün sistemlerini çözümlemek, ATC-TR ile farklarını göstermek ve özgün bir uygulamayla aynı işlevsel kapsama ulaşmak için uygulama sırası belirlemek.

> Bu belge bir hukuk görüşü değildir. Ürün ve veri lisansı kararları mağaza yayını öncesinde ilgili ülke ve pazarlar için uzman tarafından ayrıca değerlendirilmelidir.

## 1. Yönetici özeti

Flatout ATC'nin başarısı tek başına radar görünümünden veya havaalanı sayısından kaynaklanmıyor. Ürün; kısa eğitim görevleri, gerçek havaalanlarına özgü operasyonlar, farklı görüş modları, vardiya sonu geri bildirim, kariyer hikâyesi, günlük geri dönüş sistemleri, canlı ADS-B trafiği ve tarayıcıdan oynanabilen web deneyimini tek bir ekosistemde birleştiriyor.

İşlevsel olarak benzer bir ürün yapmak mümkündür. Ancak yalnızca isim ve renk değiştirmek, hem fikrî mülkiyet hem de App Store incelemesi bakımından yeterli bir güvenlik sınırı değildir. Apple'ın güncel 4.1 “Copycats” kuralı, popüler bir uygulamanın adı veya arayüzünde küçük değişiklikler yapılarak yeniden sunulmasını açıkça reddedilebilir bir durum olarak tanımlar. Buna karşılık oyun fikri, ATC komutları, hız/irtifa/heading kontrolü, vardiya, günlük görev veya liderlik tablosu gibi genel yöntemler bağımsız kod, özgün arayüz ve lisanslı veriyle yeniden uygulanabilir.

Bu nedenle hedef şu şekilde tanımlanmalıdır:

> **Flatout ATC ile işlevsel kapsam ve ürün derinliği eşleşmesi; fakat bağımsız kod, özgün arayüz, özgün görevler, özgün hikâye, özgün metin/ses/görseller ve belgelenmiş veri lisansları.**

ATC-TR bugün boş bir başlangıç değildir. Mevcut depoda güçlü bir 2D radar ve simülasyon temeli, adaptif trafik, uçuş fiziği, ILS durum makinesi, ayırma/wake sistemleri, radyo readback, dört zorluk, kayıt/devam, debrief, 52 başarım ve 50 havaalanlık kariyer bulunmaktadır. Flatout ATC'ye göre belirleyici açıklar şunlardır:

1. Eğitim hâlâ tam bir kısa dersler dizisi değildir.
2. Mobil komut ergonomisi ve okunabilirlik yeterince olgun değildir.
3. Havaalanları gerçek pist geometrisine sahip olsa da güncel yayınlanmış prosedür derinliği ve havaalanına özgü operasyon hissi sınırlıdır.
4. Günlük görev, streak, kalıcı logbook, paylaşılabilir vardiya sonucu ve çevrimiçi liderlik tablosu yoktur.
5. Kullanıcı hesabı, bulut kayıt, topluluk panosu ve oturum günlüğü gönderme altyapısı yoktur.
6. Hikâyeli kariyer sezonları ve özgün olay zincirleri yoktur.
7. Canlı ADS-B, 3D radar/kule, yer kontrolü, helikopter/SAR ve okyanus kontrolü yoktur.

Doğru sıra, bütün bu açıkları aynı anda kapatmaya çalışmak değildir. Önce mobilde kusursuz 2D vardiya ve eğitim, ardından beş amiral havaalanında derinlik, sonra geri dönüş sistemleri ve çevrimiçi altyapı, en son canlı veri ile ileri operasyonlar yapılmalıdır.

## 2. Araştırma yöntemi ve kanıt sınıfları

Araştırma; resmî App Store listesi ve sürüm geçmişi, Flatout ATC'nin resmî web sayfaları, geliştirici/stüdyo sayfaları, App Store kullanıcı yorumları ve kamuya açık alan adı kayıtlarına dayanır. Uygulama paketi sökülmemiş, ağ trafiği yakalanmamış ve kaynak koduna erişilmeye çalışılmamıştır.

Belgede aşağıdaki kanıt etiketleri kullanılır:

- **Doğrulandı:** Resmî mağaza, ürün sitesi veya sürüm notunda doğrudan görülen bilgi.
- **Geliştirici iddiası:** Resmî pazarlama metninde söylenen fakat bağımsız ölçümle doğrulanmamış nitelik.
- **Çıkarım:** Birden fazla açık işaretten ulaşılan, fakat geliştirici tarafından doğrulanmamış sonuç.
- **Depo gözlemi:** ATC-TR kaynak kodu, testleri veya mevcut iç belgelerinde görülen durum.

### 2.1 Ana kaynaklar

- [Flatout ATC — Apple App Store](https://apps.apple.com/us/app/flatout-atc/id6753611831)
- [Flatout ATC resmî ana sayfası](https://flatoutatc.com/)
- [Flatout ATC — How to Play](https://flatoutatc.com/how-to-play)
- [Flatout ATC — What is ATC?](https://flatoutatc.com/what-is-atc)
- [LiveFlatout ürün sayfası](https://www.liveflatout.org/flatout-atc)
- [LiveFlatout stüdyo sayfası](https://liveflatout.com/)
- [Apple App Review Guidelines — 4.1 Copycats ve 5.2 Intellectual Property](https://developer.apple.com/app-store/review/guidelines/)
- [U.S. Copyright Office — Copyright in General](https://www.copyright.gov/help/faq/faq-general.html)
- [U.S. Copyright Office — Computer Programs](https://www.copyright.gov/register/tx-programs.html)
- [U.S. Copyright Office — Automated Databases](https://www.copyright.gov/register/tx-databases.html)
- [European Commission IP Helpdesk — Database protection](https://intellectual-property-helpdesk.ec.europa.eu/regional-helpdesks/european-ip-helpdesk/europe-frequently-asked-questions_en)
- [EU Directive 96/9/EC — Legal protection of databases](https://eur-lex.europa.eu/eli/dir/1996/9/oj/eng)
- [ATC-TR README](../README.md)
- [ATC-TR gerçek havaalanı veri politikası](./AIRPORT_DATA.md)
- [ATC-TR Endless ATC eşleşme raporu](./endless-atc-parity-report-tr.md)

### 2.2 Araştırma sınırı

Flatout ATC hakkında güçlü ve güncel bağımsız basın, kapsamlı üçüncü taraf ölçümü veya geniş Reddit/YouTube inceleme izi bulunamadı. Kullanıcı algısı bölümü ağırlıklı olarak App Store yorumlarına dayanır. ABD mağazasında görünen yaklaşık 30 değerlendirme, yön gösterir fakat geniş pazar kanıtı sayılmaz.

## 3. Doğrulanmış ürün kartı

| Alan | Bulgular | Kanıt düzeyi |
|---|---|---|
| Ürün adı | Flatout ATC | Doğrulandı |
| Alt başlık | “Realistic Approach & Tower Sim” | Doğrulandı |
| Geliştirici/satıcı | Craig Kennedy / LiveFlatout LLC | Doğrulandı |
| Platform | iPad için tasarlanmış; iPhone uyumluluğu listeleniyor | Doğrulandı |
| Android | Resmî Android sürümü bulunamadı | Araştırma sonucu |
| Dağıtım | App Store ve tarayıcıda oynanabilen web sürümü | Doğrulandı |
| Fiyat modeli | Ücretsiz indirme + uygulama içi satın alma | Doğrulandı |
| ABD taban oyun açma | $4.99 | Doğrulandı, bölge/zaman bağımlı |
| ABD sezon fiyatı | Sezon başına $2.99 | Doğrulandı, bölge/zaman bağımlı |
| Reklam | Ürün metni “no ads” diyor; App Store meta verisinde reklam ifadesiyle tutarsızlık var | Doğrulandı/tutarsız |
| Boyut | Yaklaşık 1 GB | Doğrulandı, sürüme göre değişebilir |
| Sistem gereksinimi | iOS/iPadOS 26.1 veya üzeri | Doğrulandı |
| Diller | İngilizce, Fransızca, Almanca, İtalyanca, İspanyolca | Doğrulandı |
| Erişilebilirlik | VoiceOver ve Dark Interface beyan edilmiş | Doğrulandı |
| Game Center | Başarımlar ve liderlik tabloları | Doğrulandı |
| ABD mağaza puanı | Araştırma anında yaklaşık 4,3/5 ve 30 değerlendirme | Doğrulandı, anlık |
| Havaalanı sayısı | Stüdyo sayfasında 40+ gerçek havaalanı | Geliştirici iddiası |
| Canlı trafik | New York, Londra, Atlanta; daha yeni sürüm notunda Paris | Doğrulandı |
| Görüş modları | 2D radar, 3D radar, 3D kule | Doğrulandı |

## 4. Ürünün temel tasarım tezi

Flatout ATC kendisini yalnızca bir “radar oyunu” olarak konumlandırmıyor. Ürünün vaadi üç katmanlıdır:

1. **Hemen anlaşılır kontrol:** Uçağa dokun, heading/irtifa/hız ver ve yaklaşmaya gönder.
2. **Gerçek dünyaya yakın bağlam:** Gerçek havaalanı, gerçek pist, yayınlanmış yaklaşmalar, canlı hava ve canlı uçaklardan alınan trafik bağlamı.
3. **Yaşayan kariyer:** Her vardiyanın logbook'a yazılması, günlük içerik, sezonlar, olaylar ve karakterlerin oyuncunun performansını hatırladığı hissi.

Bu üç katmandan yalnızca birinin kopyalanması eşdeğer ürün yaratmaz. Radar iyi fakat eğitim zayıfsa yeni kullanıcı kaybedilir. İçerik çok fakat komut vermek yavaşsa mobil deneyim çalışmaz. Gerçek havaalanı çok fakat aralarında operasyonel fark yoksa katalog yapay görünür. Kariyer var fakat debrief davranışa tepki vermiyorsa hikâye dekor olur.

## 5. Çekirdek oynanış mimarisi

### 5.1 Vardiya döngüsü

Doğrulanabilen temel döngü şöyledir:

1. Oyuncu havaalanı, bölüm veya canlı vardiya seçer.
2. Radar/kule çalışma alanına geliş, kalkış ve transit uçuşlar girer.
3. Oyuncu uçak seçerek heading, altitude ve speed komutları verir.
4. Direct To, Enter Pattern, yayınlanmış yaklaşma, crossing restriction ve localizer intercept gibi gelişmiş komutlar kullanılır.
5. Oyuncu ayırmayı korur, gelişleri sıralar ve piste uygun aralık oluşturur.
6. Kalkışlar bir kuyruktan serbest bırakılır; bazı görevlerde yer/taksi operasyonu da yönetilir.
7. Vardiya performansı puanlanır ve debrief/logbook çıktısına dönüşür.
8. Sonuç; madalya, skor, liderlik tablosu, kariyer ilerlemesi ve sonraki içerik açılışını etkiler.

### 5.2 Komut repertuvarı

Resmî açıklamalar ve sürüm notlarında görülen komut/sistem grupları:

- Heading
- Altitude / flight level
- Speed
- Direct To
- Published approach clearance
- Localizer intercept
- Crossing restriction
- Enter Pattern
- Landing/runway operation
- Departure release
- Go-around sonrası yeniden yönlendirme
- Bazı görevlerde taxi/ground komutları
- Helikopterlerde heliport/hospital/hover/hoist bağlamı
- Okyanus görevlerinde non-radar plotting-board işlemleri

Kesin düğme dizilimi veya komut söz dizimi ürünün yaratıcı arayüz ifadesidir; işlevler ise özgün bir komut modeliyle yeniden uygulanabilir.

### 5.3 Geliş, kalkış ve transit trafiğin birlikte kullanılması

Flatout ATC'nin derinliği yalnızca gelişleri localizer'a çevirmekten gelmiyor. Kalkışların ne zaman bırakılacağı, geliş aralığıyla pist kapasitesinin dengelenmesi ve transit uçuşların sektör içindeki akışla çatışmaması aynı vardiyada karar yükü yaratıyor.

ATC-TR için eşleşme kabul kriteri:

- Her amiral havaalanında geliş/kalkış oranı ayrı tanımlanmalı.
- Kalkış kuyruğu görünür ve oyuncu tarafından yönetilebilir olmalı.
- Transit trafik düşük zorlukta kapalı, ileri modlarda kademeli açık olmalı.
- Pist işgali, kalkış serbest bırakma ve final aralığı aynı kapasite modelini kullanmalı.
- Hızlandırma sırasında yeni trafik güvenli koruma penceresiyle üretilmeli.

## 6. Havaalanı, prosedür ve coğrafi gerçekçilik

### 6.1 Flatout ATC'nin yaklaşımı

Ürün; gerçek pistler, gerçek coğrafya ve yayınlanmış prosedürleri öne çıkarıyor. Sürüm geçmişinde aşağıdaki örnekler açıkça geçiyor:

- Brezilya havaalanlarında gerçek SID/STAR çalışmaları
- İzlanda prosedürleri
- Innsbruck yayınlanmış yaklaşma ve circle-to-land bağlamı
- San Diego FAA prosedür düzeltmeleri
- Washington Dulles MIIDY FOUR düzeltmesi
- Pist, arazi ve paralel yaklaşma mantığının tekrar tekrar yeniden yapılması

Bu ayrıntılar, içerik üretiminin yalnızca koordinat girmekten ibaret olmadığını gösteriyor. Her havaalanı bir operasyon paketi olarak ele alınıyor ve yayın sonrasında da doğrulanıyor.

### 6.2 Pazarlama iddiası ile doğrulanmış gerçek arasındaki sınır

“Satellite-accurate runway layouts”, “real procedures” ve benzeri nitelikler geliştirici iddiasıdır. Bu araştırmada her pist veya prosedür, bağımsız güncel AIP/AIRAC kaynağıyla tek tek doğrulanmamıştır. Sürüm notlarında sık düzeltme yapılması, doğruluğun gelişen bir süreç olduğunu gösterir.

### 6.3 ATC-TR'nin mevcut veri sınırı

Depodaki [`AIRPORT_DATA.md`](./AIRPORT_DATA.md) belgesine göre ATC-TR:

- 50 havaalanında kamuya açık pist kimliği, eşik koordinatı, yön, uzunluk ve yükseklik verisi kullanıyor.
- Veriyi sabitlenmiş bir OurAirports anlık görüntüsünden alıyor.
- Şehir, su ve dağ katmanlarını taktik okunabilirlik için stilize ediyor.
- Sınır kapıları, SID/STAR isimleri ve ILS koridorlarını oynanış için üretiyor.
- Güncel, seyrüsefer kalitesinde AIRAC prosedürü sunduğunu iddia etmiyor.

Bu sınır dürüst ve güvenlidir; fakat Flatout ATC işlevsel derinliğine ulaşmak için en azından amiral havaalanlarında lisans ve güncellik durumu belgelenmiş prosedür paketleri gerekir.

### 6.4 Önerilen özgün “Airport Operations Pack” şeması

Her havaalanı aşağıdaki veri gruplarını ayrı bir sürümlü pakette taşımalıdır:

- Kimlik: ICAO/IATA, şehir, ülke, yükseklik, manyetik varyasyon
- Pistler: threshold, reciprocal end, uzunluk, yön, displaced threshold, kullanım rolü
- Akışlar: rüzgâr/kapasiteye göre geliş ve kalkış pist kombinasyonları
- Yaklaşmalar: fix dizisi, irtifa/hız kısıtları, intercept şartı, missed approach
- Kalkışlar: ilk heading, SID kapıları, irtifa kısıtları
- Sektör: giriş/çıkış kapıları, minimum irtifa alanları, restricted area
- Çevre: su, şehir, dağ ve önemli taktik referanslar
- Trafik profili: geliş/kalkış/transit oranları, uçak sınıfı ve havayolu dağılımı
- Operasyon olayı: pist kapanması, rüzgâr dönüşü, düşük görüş veya acil durum
- Kaynak/provenans: URL, sağlayıcı, lisans, anlık görüntü tarihi ve doğrulayan kişi
- Testler: pist numarası, reciprocal geometri, ILS hizası, parallel separation ve spawn güvenliği

## 7. Canlı ADS-B trafiği

### 7.1 Doğrulanan ürün davranışı

Flatout ATC, gerçek ADS-B uçuşlarını bir oyun vardiyasına aktarır. Oyuncu gerçek uçağı kontrol etmez; gerçek uçuşun kimliği ve gözlenen hareketi simülasyon için başlangıç bağlamı olur, verilen komutlar yalnızca oyun içindeki kopyaya uygulanır.

Resmî kaynaklarda canlı bölgeler New York, Londra ve Atlanta olarak listelenir; 3.1.1 sürüm notlarında Paris eklenmiştir. Web ana sayfası hâlâ ağırlıklı olarak New York'u tanıtır. Bu nedenle ürün içeriği ile pazarlama sayfaları arasında güncelleme gecikmesi vardır.

### 7.2 Ücretsiz kullanım sınırı

App Store açıklamaları ve geliştirici yanıtları, günde bir ücretsiz canlı vardiya bulunduğunu; ücretli taban açılımın canlı kullanım sınırını ve kariyer içeriği kilitlerini kaldırdığını gösteriyor. Bazı kullanıcılar bu kuralı tüm oyun için “günde tek maç” olarak anlamış. Bu, fiyatlandırma değil iletişim sorunudur.

### 7.3 ATC-TR için teknik gereksinimler

Canlı ADS-B, yalnızca API çağrısı eklemek değildir. Gerekli alt sistemler:

- Ticari kullanıma ve yeniden sunuma izin veren veri sağlayıcı sözleşmesi
- Bölgesel kapsama, gecikme ve kesinti ölçümü
- Callsign, type code, origin/destination ve pozisyon normalizasyonu
- Anormal sıçrama, duplicate track ve kaybolan track filtreleri
- Gerçek track'i oyun dünyasına güvenli ilk duruma dönüştürme
- Gerçek uçuş ile simülasyon komutlarını ayıran açık kullanıcı metni
- Sağlayıcı kesildiğinde sentetik trafik fallback'i
- Veri önbelleği, oran sınırlama, maliyet ve gizlilik takibi
- Canlı vardiya için deterministik olay günlüğü ve tekrar üretilebilir hata raporu

İlk canlı bölge için İstanbul seçilmesi ürün kimliğini güçlendirir. Dünya çapında 50 havaalanını aynı anda canlı yapmak yerine önce İstanbul'da kapsama, lisans, gecikme ve oyunlaştırma doğrulanmalıdır.

## 8. Görsel sunum ve görüş modları

### 8.1 Flatout ATC'deki modlar

- Klasik 2D üstten radar
- 3D Radar
- 3D Tower
- Üç boyutlu arazi/yükseklik
- Nehir, kontur ve bina katmanları
- Gece operasyonu
- Pist/taksi yolu ışıkları
- PAPI ve rüzgâr tulumu

Bu özelliklerin bir kısmı oynanışı değiştirir, bir kısmı sunum katmanıdır. 3D kule, ürünün mağaza görsellerini zenginleştirir; ancak güçlü bir radar kontrol oyunu için ilk bağımlılık değildir.

### 8.2 ATC-TR için önerilen sıra

1. 2D radarın mobilde tam ekran ve okunabilir hale getirilmesi
2. Etiket çakışma çözümü, taşınabilir etiket ve bağlamsal veri yoğunluğu
3. Mobil alt komut çekmecesi ve tek elle kullanım
4. Düşük maliyetli topografik 2.5D/relief katmanı
5. Gece/gündüz görsel varyantı
6. 3D radar prototipi
7. 3D kule görünümü

3D, ikinci bir oyun motoru yaratacak şekilde değil, aynı simülasyon durumunun alternatif sunumu olarak tasarlanmalıdır.

## 9. Hava, kesinti ve acil durum sistemleri

Flatout ATC'nin sürüm notları ve ürün metinlerinde doğrulanan sistemler:

- Gök gürültülü fırtınalar
- Fırtınanın kademeli oluşması ve hazırlık süresi
- Rüzgâr değişikliği ve aktif pist dönüşü
- Tahmin edilen ve yürürlüğe giren pist değişiminin ayrılması
- Muson/organize cepheler
- Volkanik kül
- Hava kaçınması
- Go-around
- 7600 telsiz arızası
- Motor arızası
- Senaryolu operasyonel olaylar

ATC-TR'de statik/akışa bağlı rüzgâr ve yaklaşma etkileri vardır. İşlevsel eşleşme için olay motoru şu ortak şemayla geliştirilmelidir:

```text
event trigger
→ warning/briefing
→ grace period
→ operational change
→ player response window
→ measurable outcome
→ debrief consequence
```

Bu model pist kapanması, rüzgâr dönüşü, fırtına hücresi, acil trafik ve düşük görüş için ortak kullanılabilir.

## 10. İleri operasyonlar

Flatout ATC, klasik yaklaşma radarının ötesinde aşağıdaki içerikleri sunuyor:

### 10.1 Helikopter ve heliport

- New York şehir içi helikopter operasyonları
- Hastaneler ve medevac
- Heliport hedefleri
- Hover bağlamı

### 10.2 Search and Rescue

- Sinyal takip etme
- Hover/hoist işlemi
- Hayatta kalma süresi
- Birden fazla hava aracıyla koordineli kurtarma

### 10.3 Okyanus kontrolü

- Radar dışı plotting-board sunumu
- Okyanus geçişleri
- Radar vektörü yerine rapor ve pozisyon yönetimi

### 10.4 Yer kontrolü

- Bazı seviyelerde runway/taxiway operasyonları
- Kalkış kuyruğu ve serbest bırakma
- Pist kapasitesiyle bağlantılı yer trafiği

Bu sistemler nihai işlevsel eşleşmenin parçasıdır; ancak ilk ürün kilometre taşının parçası olmamalıdır. Her biri ayrı UX, veri, fizik ve test kapsamı oluşturur.

## 11. Yeni oyuncu deneyimi ve Flight Academy

### 11.1 Flatout yaklaşımı

Flight Academy yaklaşık üçer dakikalık on dersten oluşur. Amaç, oyuncuya uzun bir kılavuz okutmak değil, ilk dakikada ilk doğru komutu ve başarı hissini vermektir. Dersler farklı konumlara yayılır ve kavramları tek tek açar.

Resmî “How to Play” sayfası da oyunu dört sade adımda anlatır:

1. Radarı oku.
2. Talimat ver.
3. Uçağı indir veya devret.
4. Uçakları birbirinden ayır.

### 11.2 Kullanıcı yorumlarından çıkan eğitim sorunları

- Dokunulacak uçak veya kontrol için belirgin ok/vurgu isteniyor.
- Trafik pattern ve hedef havaalanı seçimi yeterince açıklanmıyor.
- Helikopter/heliport operasyonunun keşfedilebilirliği düşük.
- Bazı kullanıcılar ücretsiz sınırı yanlış anlıyor.

Geliştirici sonraki güncellemelerde onboarding kartları eklemiş ve tutorial sırasında rastgele acil durumları azaltmıştır. Bu, eğitim vardiyasının kontrollü ve başarısız olunması zor olması gerektiğini doğrular.

### 11.3 ATC-TR için özgün Academy müfredatı

“Flight Academy” ifadesini ve ders metinlerini kopyalamak yerine özgün bir ad ve sunum kullanılmalıdır. Önerilen geçici ürün adı: **Controller School / Kontrolör Okulu**.

| Ders | Kavram | Başlangıç durumu | Başarı koşulu |
|---:|---|---|---|
| 1 | Uçak seçme | Tek geliş, trafik yok | Doğru hedefe dokun |
| 2 | Heading | Tek geliş, geniş alan | Uçağı vektör koridoruna çevir |
| 3 | İrtifa | Tek geliş, çakışma yok | Doğru irtifaya alçalt |
| 4 | Hız | Aynı rotada iki trafik | Güvenli takip aralığı yarat |
| 5 | ILS | Uygun açı/irtifada tek geliş | LOC ve GS yakala |
| 6 | Ayırma | Öngörülebilir iki uçak | 3 NM/1.000 ft kaybı olmadan çöz |
| 7 | Kalkış | Bir geliş, bir kalkış | Güvenli boşlukta release et |
| 8 | Direct/route | Birkaç fix | Doğru fix'e yönlendir |
| 9 | Pist değişimi | Önceden bildirilen rüzgâr | Akışı yeni piste geçir |
| 10 | Mini vardiya | 3–4 uçak | Hatasız kısa vardiya tamamla |

Her derste:

- Radar üzerindeki hedef pulse/halo ile vurgulanmalı.
- İlgili kontrol dışındaki seçenekler gizlenmeli veya pasif olmalı.
- İlk doğru eylem tek dokunuşla uygulanabilmeli.
- Yanlış hareket ceza yerine açıklayıcı geri bildirim üretmeli.
- Görev 2–3 dakika içinde tamamlanmalı.
- Ders bitince bir cümle öğrenim özeti ve tekrar düğmesi gösterilmeli.

## 12. Mobil ergonomi, erişilebilirlik ve ses

### 12.1 Flatout gözlemleri

Uygulama iPad odaklı tanıtılır, fakat iPhone uyumludur. VoiceOver ve Dark Interface beyan edilmiştir. Yine de kullanıcı yorumlarında uçağa dokunma ve doğru hedefi seçme problemleri görülür. 1 GB boyut ve iOS 26.1 tabanı erişilebilir cihaz kitlesini sınırlar.

### 12.2 ATC-TR için mobil kabul kriterleri

- Radar, oyun sırasında ekranın birincil ve en büyük alanı olmalı.
- Uçak seçildiğinde komutlar alttan açılan büyük bir sheet içinde görünmeli.
- Dokunma hedefleri en az 44×44 CSS px olmalı.
- Kritik sayılar yatay kaydırma veya yakınlaştırma gerektirmeden okunmalı.
- Safe-area inset'leri iPhone alt/üst çentiklerinde uygulanmalı.
- Dikey ve yatay yönler desteklenmeli; radar hiçbir yönde paneller tarafından ezilmemeli.
- Seçili uçak, radar ve listede aynı anda belirginleşmeli.
- Uçak seçme hit-box'ı sembolden büyük olmalı; üst üste hedeflerde seçim listesi açılmalı.
- Komut sonrası haptik/görsel/sesli onay olmalı.
- Ses varsayılan açık olabilir; fakat platform gereği sessize alma ve erişilebilir altyazı seçeneği bulunmalı.
- Font boyutu ve kontrast erişilebilirlik testiyle doğrulanmalı.
- VoiceOver sırası, uçak listesi ve komut panelinde anlamlı olmalı.

### 12.3 Radyo/ses

Flatout ATC ses ve gerçekçi clearance sunumunu vurgular; kullanılan kesin speech motoru kamuya açık kaynaklardan doğrulanmamıştır. ATC-TR'nin özgün ses sistemi şu bileşenleri içermelidir:

- ICAO fonetik çağrı kodu
- Sayıların ATC biçiminde okunması
- Birleşik readback
- Öncelikli/acil çağrı kuyruğu
- Konuşan uçağın radar üzerinde vurgulanması
- Altyazı
- Radyo filtre/gürültüsünü isteğe bağlı açma
- Dil ve ses paketi ayrımı
- Web Speech fallback'i ve gelecekte lisanslı/üretilmiş ses paketi

## 13. Kariyer, hikâye ve kalıcı ilerleme

### 13.1 The Watch

Flatout ATC kariyeri “The Watch” adı altında sezonlara ayrılır:

- Season 1 — First Watch
- Season 2 — Incident Desk
- Season 3 — Crossing

Her sezon yaklaşık yedi bölümden oluşur. Sonraki içerikler Londra, Paris, İzlanda, Mumbai ve okyanus geçişlerini kullanır. Karakterlerin oyuncunun performansını hatırladığı, her vardiyanın debrief ve Logbook bölümüne dönüştüğü anlatılır.

Bu yapı tam dallanan sinematik hikâye olmak zorunda değildir. Düşük maliyetli formül şudur:

```text
kısa briefing
→ normal trafik
→ senaryolu operasyon olayı
→ oyuncu kararı
→ sonuç ölçümü
→ kişiselleştirilmiş debrief/logbook
```

### 13.2 ATC-TR için özgün sezon önerisi

Flatout'un sezon adları, karakterleri, diyalogları ve bölüm dizisi kullanılmamalıdır. Özgün ilk kariyer paketi:

**İstanbul Control — İlk Nöbet**

1. Sakin Başlangıç — temel gelişler
2. Akşam Bankası — yoğun geliş dalgası
3. Pist Dönüşü — rüzgâr değişimi
4. Sessiz Uçuş — telsiz arızası
5. Karanlık Hücre — fırtına kaçınması
6. Öncelikli Trafik — medevac/motor sorunu
7. Gece Zirvesi — bütün sistemlerin birleştiği final vardiyası

Her bölüm, yalnızca metin değil, simülasyon durumuna bağlanan ölçülebilir sonuçlar üretmelidir.

## 14. Geri dönüş ve ustalık sistemleri

Flatout ATC'de doğrulanan sistemler:

- Daily Challenge
- Günlük canlı vardiya
- Streak
- Ana ekran/widget
- Havaalanına özel liderlik tabloları
- Trophy Room
- 24 adet 3D madalya
- Kalıcı Logbook
- Vardiya sonrası debrief
- Save/resume
- Game Center başarımları
- Ücretli kullanıcı için custom level builder

ATC-TR'de dört zorluk, otomatik debrief, yerel kayıt/devam, 52 başarım ve havaalanı skor kilitleri vardır. Eksik olan, bu sistemleri her gün görünür bir geri dönüş döngüsüne bağlamaktır.

Önerilen döngü:

```text
bugünün meydan okuması
→ kısa vardiya
→ S/A/B/C/D derece
→ madalya + streak
→ havaalanı rekoru
→ paylaşılabilir vardiya kartı
→ kariyer/logbook kaydı
→ yarının hedefi
```

## 15. Web sitesi ve ürün ekosistemi

### 15.1 Ana sayfanın rolü

`flatoutatc.com`, klasik bir indirme landing page'i değildir. Site aynı anda pazarlama, eğitim, ücretsiz deneme, canlı içerik, hikâye ve topluluk merkezi görevi görür.

Ana gözlemler:

- “You have the frequency” ana vaadi
- App Store indirme ve tarayıcıda ücretsiz oynama için çift CTA
- Canlı New York trafiğiyle tarayıcı demosu
- The Watch sezon tanıtımları
- Tower Log
- Son topluluk/tower içeriği
- Season 1'in ücretsiz okunabilen “Midnight to Six” hikâye versiyonu
- Developer Board
- How to Play ve What is ATC eğitim sayfaları
- Play, Seasons, Tower Log, Board ve How to Play navigasyonu

### 15.2 Dönüşüm hunisi

```text
arama / sosyal / doğrudan ziyaret
→ ATC'yi anlatan kısa içerik
→ tarayıcıda ücretsiz vardiya
→ App Store veya taban oyun açılımı
→ web ile iOS satın alma köprüsü
→ günlük vardiya / logbook / topluluk
```

Web sürümünde dört ücretsiz seviye bilgisi ve iOS satın alımını web'e taşıyan tek kullanımlık redemption code akışı sürüm notlarında görülür. Ayarlar > Account içinden “Use my purchases on the web” akışı ve Sign in with Apple desteği belirtilir.

### 15.3 Web sitesinin güçlü yanları

- Değer önerisi tek cümlede anlaşılır.
- Uygulamayı indirmeden oynama sürtünmeyi azaltır.
- Eğitim içeriği ATC bilmeyen kullanıcıyı dışlamaz.
- Tower Log ve Board, ürünün yaşayan sistem olduğu hissini verir.
- Hikâye içeriği oyunu oynamayan ziyaretçiye de bağ kurma yüzeyi yaratır.
- Geliştirici görünür ve insani bir tonda iletişim kurar.
- Ayrıntılı sürüm notları güven oluşturur.

### 15.4 Web sitesinin zayıf yanları

- Ana site, App Store ve stüdyo sayfasındaki canlı bölge bilgileri aynı değil.
- Marka içeriği `flatoutatc.com`, `liveflatout.org` ve `liveflatout.com` arasında parçalanıyor.
- Ücretsiz vardiya sınırı bazı kullanıcılar tarafından yanlış anlaşılıyor.
- Bazı sayfalar ürünün güncel özelliklerinin gerisinde kalıyor.
- Geniş özellik kataloğu ilk ziyaretçiye çekirdek oyunun ne olduğunu bulanıklaştırabilir.

### 15.5 Teknik barındırma hakkında sınırlandırılmış çıkarım

Kamuya açık DNS/WHOIS verileri alan adının Amazon kayıt/Route53 altyapısıyla ilişkili olduğunu ve `hosting-site=flatout-atc-game` TXT kaydını göstermiştir. Bu kayıt Google/Firebase Hosting kullanımına işaret edebilir; ancak framework, veri tabanı ve arka uç sağlayıcısı resmî olarak doğrulanmamıştır. Tower Log, Board, hesap aktarımı ve canlı trafik nedeniyle ortak bir arka uç bulunduğu çıkarılabilir; kesin teknoloji adı yazılmamalıdır.

## 16. ATC-TR web sitesi için eşleşme modeli

ATC-TR'nin landing page ve oynanabilir web yüzeyi vardır. İşlevsel eşleşme için aşağıdaki sayfalar ayrı ürün yüzeyleri olarak tasarlanmalıdır:

1. **Ana sayfa:** tek değer önerisi, video/radar demo, hemen oyna ve mağaza CTA
2. **Play:** şifresiz ücretsiz başlangıç, devam et, havaalanı/kariyer seçimi
3. **How to Play:** dört sade adım ve kısa etkileşimli örnek
4. **What is ATC?:** SEO ve yeni başlayan eğitimi
5. **Airports:** 50 havaalanı; veri doğruluğu ve oyunlaştırma sınırı açık
6. **Career:** özgün sezon/bölüm tanıtımı
7. **Tower Log karşılığı:** özgün adıyla anonim toplu vardiya istatistikleri
8. **Developer Board:** geri bildirim, değişiklik günlüğü ve bilinen sorunlar
9. **Account:** bulut kayıt, satın alma ve cihaz bağlantısı
10. **Privacy/Data:** ADS-B, telemetri, hesap ve veri kaynağı açıklamaları

Site, Flatout sayfa düzenini veya metinlerini kopyalamamalı; aynı kullanıcı ihtiyaçlarını ATC-TR'nin bağımsız bilgi mimarisiyle karşılamalıdır.

## 17. Para kazanma ve hesap modeli

### 17.1 Flatout modeli

- Ücretsiz indirme
- Reklamsız deneyim iddiası
- Ücretsiz örnek/kariyer içeriği
- Günde bir ücretsiz canlı vardiya
- ABD'de $4.99 taban oyun açılımı
- ABD'de sezon başına $2.99
- Erken sahipler için taban oyun ve sezonlara ilişkin özel hak metni
- iOS satın alımını web'e aktarma
- Game Center başarımları ve liderlik tabloları

Fiyatlar mağaza/bölge/zamana bağlıdır ve ATC-TR fiyatı için doğrudan emsal değil, yapı referansıdır.

### 17.2 ATC-TR için önerilen model

Mağaza aşaması daha sonra olsa da ürün mimarisi bugünden entitlement modelini desteklemelidir:

- Ücretsiz: Kontrolör Okulu, İstanbul başlangıç vardiyası, günlük görev
- Taban açılım: ana kariyer ve seçilmiş havaalanları
- Opsiyonel senaryo paketleri: özgün hikâye sezonları
- Canlı trafik: sağlayıcı maliyeti doğrulandıktan sonra taban açılıma dahil kota veya ayrı paket
- Reklam: çekirdek vardiyada kullanılmaması önerilir
- Hesap olmadan başlangıç; hesapla bulut senkronizasyonu
- Web/iOS/Android entitlement eşlemesi

Ödeme uygulamadan önce mağaza kuralları, web yönlendirmeleri, vergi, iade ve aile paylaşımı ayrı karara bağlanmalıdır.

## 18. Gizlilik ve operasyonel güven

App Store gizlilik beyanında satın almalar, e-posta, kullanıcı içeriği, tanımlayıcılar, kullanım, çökme ve performans verileri gibi kategoriler görülebilir; bazıları kullanıcıyla ilişkilendirilebilir. Bu beyan geliştiricinin bildirimi olup Apple tarafından ayrıntılı doğrulanmış bir denetim değildir.

ATC-TR için minimum gereksinimler:

- Hesapsız kullanım ile hesaplı kullanım ayrılmalı.
- Telemetri varsayılanları ve amaçları açık yazılmalı.
- Oturum günlüğü kullanıcı onayı olmadan kişisel veri içermemeli.
- ADS-B verisinin gerçek uçuşu yalnızca oyun bağlamında gösterdiği açıklanmalı.
- Çocuk kullanıcı ihtimali ve yaş derecelendirmesi değerlendirilmelidir.
- Hesap silme, veri dışa aktarma ve saklama süresi tasarlanmalıdır.
- Hata günlükleri callsign/cihaz kimliği bakımından minimize edilmelidir.
- “GAME ONLY — gerçek seyrüsefer/ATC kullanımı için değildir” uyarısı korunmalıdır.

## 19. Sürüm geçmişinden ürün geliştirme yaklaşımı

Flatout ATC'nin App Store sürüm geçmişi, Mart–Ağustos 2026 arasında olağanüstü hızlı özellik ve düzeltme temposu gösterir.

| Dönem/sürüm | Başlıca görünen değişiklik |
|---|---|
| 1.6.3 — 16 Mart | Erken katalog ve temel oyun güncellemeleri |
| 1.6.4 — 22 Mart | Havaalanı kataloğunun yaklaşık 30'a ulaşması |
| 1.6.5 — 25 Mart | Orlando |
| 1.6.6 — 29 Mart | Düzeltme/iyileştirmeler |
| 1.7 — 15 Nisan | Oynanış genişlemesi |
| 1.8 — 24 Nisan | Atlanta |
| 2.0 — 27 Nisan | LAX ve localizer intercept |
| 2.1 — 2 Mayıs | Basemap, ses, custom builder, HND/GRU/Innsbruck/FAOR |
| 2.2 — 12 Mayıs | 3D radar/kule, helikopter, web satın alma köprüsü |
| 2.4 — 24 Mayıs | Katalog dengeleme, 31 meydanda helipad, landmark, terrain, CDG/SAN/IAD düzeltmeleri |
| 2.4.1 — 25 Mayıs | Lukla, Anchorage, New York metro ve Developer Board |
| 2.6 — 11 Haziran | Manhattan helikopter operasyonları, save/resume |
| 2.6.1 — 13 Haziran | Streak, widget, rüzgâr değişimi, iPhone ana ekranı |
| 2.7.1 — 18 Haziran | New York/Londra canlı ADS-B ve “no ads” konumlandırması |
| 2.8.1 — 26 Haziran | Rio/İzlanda, canlı Atlanta, yeni tutorial ve acil durumlar |
| 3.0 — 15 Temmuz | Academy, SAR, trophies, real clearances, departure list |
| 3.0.2 — 18 Temmuz | The Watch, sezonlar ve logbook |
| 3.1.1 — 10 Ağustos | Season 3, okyanus plotting, hava cepheleri ve canlı Paris |
| Son görünen, etiketi indekslenmemiş not | Beş havaalanının yeniden yapımı; paralel yaklaşma, canlı vardiya skoru/devam ve uçuş davranışı düzeltmeleri |

Son App Store sayfasında bir güncelleme notu görünürken sürüm etiketi indekslenmemiştir. Bu nedenle “mevcut sürüm kesin olarak 3.1.1” denmemelidir; 3.1.1 açıkça etiketlenen önceki sürümdür.

### 19.1 Çıkarım

Güncellemelerin dili, kullanıcıya doğrudan cevaplar ve “one person tower” ifadesi ürünün büyük ölçüde tek geliştirici tarafından yürütüldüğünü düşündürür. Hız avantaj sağlar; fakat sürüm notlarındaki tekrar eden pist, yaklaşma, scoring ve resume düzeltmeleri veri/QA borcunun da hızlı büyüdüğünü gösterir.

ATC-TR, aynı hızda özellik eklemeyi değil, her özellik için test ve veri provenansını örnek almalıdır.

## 20. Kullanıcı geri bildirimi analizi

### 20.1 Olumlu temalar

- Gerçekçilik ve öğrenilebilirlik dengesi
- Güçlü görsel sunum
- ATC karar hissi
- Düzenli güncelleme
- Geliştiricinin kişisel ve hızlı yanıtları
- Kullanıcı logu üzerinden hata inceleme yaklaşımı

### 20.2 Olumsuz temalar

- Eğitimde görsel ok/vurgu eksikliği
- Bazı haritaların fazla boş veya yavaş hissettirmesi
- Hızlandırma sırasında spawn/çarpışma sorunları
- Traffic pattern veya hedef havaalanı seçiminin anlaşılmaması
- Helikopter/helipad görevlerinin keşfedilememesi
- Uçağa dokunma ve doğru uçağı seçme sorunu
- Ücretsiz kullanım sınırının yanlış anlaşılması
- Bazı paralel yaklaşma, prosedür ve scoring hataları

### 20.3 ATC-TR için doğrudan dersler

- Tutorial yalnızca yazı değil, radar üstü rehber olmalı.
- Zaman hızlandırma ve trafik üretimi ayrı test paketi almalı.
- Uçak seçimi ölçülebilir mobil başarı metriği olmalı.
- Ücretsiz/ücretli sınır ilk ekranda tek cümleyle açıklanmalı.
- İleri içerik, eğitim tamamlanmadan rastgele etkinleşmemeli.
- Oyuncu “bu neden oldu?” sorusunun cevabını debrief'te görmeli.
- Oturum günlüğü gönderme ve bilinen sorunlar panosu yayın öncesi kurulmalı.

## 21. Güçlü yanlar, zayıflıklar ve ürün riskleri

### 21.1 Flatout ATC'nin güçlü yanları

- Gerçek uçuş/canlı trafik mesajı güçlü bir farklılaştırıcıdır.
- iOS ve web arasında sürtünmesiz deneme hunisi vardır.
- Havaalanına özel operasyonlar katalog derinliği yaratır.
- Academy yeni kullanıcı girişini kolaylaştırır.
- Günlük içerik, streak, logbook ve liderlik tablosu geri dönüş sağlar.
- Sezon/hikâye simülasyona bağlam katar.
- Geliştirici panosu güven ve topluluk oluşturur.
- 2D ile 3D'yi aynı simülasyon üzerinde birleştirir.

### 21.2 Flatout ATC'nin zayıflıkları

- Yaklaşık 1 GB boyut hafif bir oyun için yüksektir.
- iOS 26.1 tabanı eski cihazları dışarıda bırakır.
- Android sürümü görünmemektedir.
- Hızlı özellik üretimi çok sayıda veri ve regresyon düzeltmesi gerektirir.
- Resmî sayfalar arasında özellik tutarsızlığı vardır.
- Ücretsiz sınır yeterince açık anlatılmamıştır.
- ABD mağaza değerlendirme sayısı pazar liderliği iddiası için düşüktür.
- 3D, live, SAR, heli, story ve ground gibi geniş kapsam bakım maliyetini yükseltir.

### 21.3 ATC-TR'nin fırsatları

- Web + Android + iOS yaklaşımıyla daha geniş erişim
- Daha küçük paket ve daha düşük cihaz tabanı
- İstanbul merkezli özgün ürün kimliği
- Türkçe başlangıç ve uluslararası İngilizce varsayılan web
- Klasik 2D radarda daha temiz, daha hızlı mobil deneyim
- 50 havaalanlık mevcut katalog
- 52 başarımı günlük/kariyer sistemine bağlama
- Düşük maliyetli, hızlı açılan tarayıcı demosu

## 22. Flatout ATC — ATC-TR eşleşme matrisi

| Sistem | Flatout ATC | ATC-TR mevcut durum | Açık |
|---|---|---|---|
| 2D radar | Var | Güçlü temel | Mobil rafine edilmesi gerekiyor |
| 3D radar | Var | Yok | Tam |
| 3D kule | Var | Yok | Tam |
| Uçuş fiziği | Hız/bank/terrain bağlamı | Bank, roll, IAS, ground speed, rüzgâr temeli | İnce ayar ve kapsam |
| ILS | Published approach/localizer | ARMED → LOC → GS → TOWER | Yakın, veri derinliği eksik |
| Ayırma | Yaklaşma/kule bağlamlı | 3 NM/1.000 ft, CPA, parallel exception | İnce ayar |
| Wake | Operasyonel sınıflar | Altı kategori ve görselleştirme temeli | Test/denge |
| Trafik | Geliş/kalkış/transit | Adaptif sonsuz trafik ve kalkış | Transit/airport profile |
| Zorluk | Novice–Master | Dört mod | Yakın |
| Havaalanı | 40+ | 50 | Sayı üstün; derinlik eksik |
| Gerçek pist | Var | Kamu verisinden gerçek geometri | Yakın |
| Güncel prosedür | Havaalanına özel iddia | Oyunlaştırılmış SID/STAR/final | Büyük açık |
| Terrain/şehir | 3D terrain, river, building | Stilize yönsel katman | Büyük açık |
| Hava | Storm/front/ash/wind shift | Rüzgâr ve görünürlük temeli | Büyük açık |
| Acil durum | Çoklu senaryo | Öncelikli trafik/event temeli | Orta/büyük açık |
| Academy | 10 kısa ders | Tek rehber akışı | Büyük açık |
| Mobil komut | Native iOS/iPadOS | Responsive web/Capacitor, UX sorunu | Kritik açık |
| Ses/radyo | Gelişmiş sunum | TTS/readback temeli | Orta açık |
| Save/resume | Var | Yerel otomatik kayıt | Bulut eksik |
| Debrief | Var, hikâyeye bağlı | S/A/B/C/D ve olay özeti | Logbook/hikâye eksik |
| Başarım | 24 madalya + Game Center | 52 başarım | Görünürlük/platform eksik |
| Günlük görev | Var | Yok | Tam |
| Streak/widget | Var | Yok | Tam |
| Leaderboard | Havaalanı/Game Center | Yerel skor | Çevrimiçi katman eksik |
| Hikâye sezonu | Üç sezon | Yok | Tam |
| Logbook | Kalıcı ve uyarlanan | Yerel kariyer özeti | Büyük açık |
| Custom builder | Ücretli kullanıcıya var | Yok | Tam |
| Live ADS-B | Dört bölgeye kadar görünür | Yok | Tam |
| Helikopter/SAR | Var | Yok | Tam |
| Ground/taxi | Bazı seviyelerde | Yok/sınırlı | Tam |
| Oceanic | Season 3 | Yok | Tam |
| Web demo | Var | Var | Ürün hunisi geliştirilmeli |
| Hesap/köprü | Apple/web satın alma köprüsü | Hesapsız/yerel | Tam |
| Developer Board | Var | Yok | Tam |

## 23. “Birebir aynı” hedefinin güvenli tanımı

### 23.1 Yapılabilecek işlevsel eşleşme

- Uçağa dokunup heading, altitude ve speed verme
- Gerçek havaalanı/pist verisi kullanma; kaynak lisansı uygun olduğu sürece
- Published procedure kavramını bağımsız veri modelinde uygulama
- 2D/3D radar ve kule görüşü geliştirme
- Canlı ADS-B uçuşlarını lisanslı sağlayıcıdan simülasyona aktarma
- Kariyer, kısa ders, günlük görev, streak, debrief, logbook ve leaderboard kurma
- Hava, acil durum, helikopter, SAR, ground ve oceanic oyun modları geliştirme
- Web demo ile mağaza uygulamasını ortak hesapta buluşturma
- Bir defalık taban açılım ve özgün sezon paketleri sunma

### 23.2 Kopyalanmaması gereken ifade unsurları

- Kaynak kod veya uygulamadan çıkarılmış veri
- Flatout ATC adı, logosu, ikonu, paket kimliği veya benzer marka
- App Store metninin ve ekran görüntülerinin uyarlanmış kopyası
- Renk, tipografi, ikon, panel konumu ve ekran hiyerarşisinin topluca aynı görünmesi
- “The Watch”, bölüm adları, karakterler, diyaloglar ve özgün olay dizileri
- “Midnight to Six” hikâyesi veya metni
- 3D modeller, arazi mesh'i, ses dosyaları, müzik ve animasyonlar
- Tutorial metinleri, görsel okları ve ders dizisinin aynı ifadeyle yeniden üretimi
- Site metni, görsel düzeni, Tower Log/Board sunumunun ayırt edilemeyecek kopyası
- Üçüncü taraf sağlayıcıdan kullanım koşullarına aykırı veri çekme

### 23.3 Neden yalnızca isim ve renk değiştirmek yeterli değildir?

U.S. Copyright Office, fikirler, sistemler ve çalışma yöntemleri ile bunların özgün ifade biçimini birbirinden ayırır. Genel oyun mantığı her zaman aynı ölçüde korunmaz; ancak kod, yazı, grafik, ses, özgün düzenleme ve yaratıcı seçimler korunabilir. Veritabanlarında tek tek çıplak gerçekler ile verinin özgün seçimi/düzeni de aynı şey değildir. Avrupa Birliği'nde ayrıca önemli yatırım içeren veritabanları için sui generis koruma bulunabilir.

Apple ise hukuk ihlali kanıtlanmasa bile App Review Guideline 4.1 kapsamında, popüler bir uygulamanın yalnızca adını veya arayüzünü biraz değiştirerek sunulan kopyaları reddedebileceğini açıkça belirtir. Guideline 5.2, üçüncü taraf içerik ve hizmetleri kullanmak için hak/lisans bulunmasını ister.

Sonuç: **aynı işi yapan ürün** hedeflenebilir; **aynı görünen ve aynı yaratıcı içeriği kullanan ürün** hedeflenmemelidir.

## 24. Temiz oda (clean-room) geliştirme ilkeleri

1. Araştırma davranışı ve kullanıcı ihtiyacını tarif eder; kod veya asset içermez.
2. Her özellik nötr acceptance criteria'ya çevrilir.
3. Geliştirici yalnızca bu işlevsel spesifikasyon ve izinli veri kaynaklarıyla çalışır.
4. Tasarım sistemi sıfırdan, ATC-TR/Bumba Games kimliğiyle oluşturulur.
5. Hikâye, görev metni, karakter ve bölüm sırası özgün yazılır.
6. Her veri dosyası sağlayıcı, lisans, sürüm ve indirme tarihiyle kaydedilir.
7. Uygulama binary'sinden, özel API'den veya korumalı ağ akışından veri çıkarılmaz.
8. Canlı trafik yalnızca ticari yeniden kullanım hakkı veren sözleşmeyle kullanılır.
9. Mağaza gönderiminden önce UI benzerliği ve marka karışıklığı incelemesi yapılır.
10. Her özellik için “ilham kaynağı”, “özgün fark” ve “test kanıtı” kaydı tutulur.

## 25. Ürün hedefi ve ölçülebilir başarı ölçütleri

İşlevsel eşleşme, özellik kutularının işaretlenmesiyle değil sonuçlarla ölçülmelidir.

### 25.1 Yeni oyuncu

- İlk komuta ulaşma medyanı: 30 saniyenin altında
- İlk dersi tamamlama oranı: en az %85
- İlk 10 dakikada çözülemeyen arayüz hatası: %5'in altında
- Mobilde yanlış uçak seçimi: oturum başına 0,5'in altında

### 25.2 Çekirdek oynanış

- 60 FPS hedefi; desteklenen düşük cihazlarda en az kararlı 30 FPS
- Hızlandırmada oyuncu müdahalesi olmadan spawn kaynaklı separation loss: sıfır
- Parallel approach regresyon testleri: tüm amiral pist kombinasyonlarında geçer
- Komut ile görsel/readback onayı arasındaki gecikme: algılanabilir sınırın altında

### 25.3 İçerik

- Beş amiral havaalanının her biri en az üç operasyonel akışta farklı hissettirmeli
- Her amiral havaalanında en az bir özgün olay vardiyası
- Procedure paketinde kaynak ve güncellik bilgisi %100 dolu

### 25.4 Geri dönüş

- Günlük göreve geri dönüş oranı
- 7 günlük retention
- İlk havaalanından ikinciye geçiş oranı
- Debrief paylaşım oranı
- Başarım/madalya tamamlanma dağılımı

Bu oranların hedef değerleri gerçek kullanıcı telemetrisi toplandıktan sonra belirlenmelidir; uydurma endüstri kıyasları kullanılmamalıdır.

## 26. Aşamalı geliştirme yol haritası

### Faz 0 — Kapsam, veri ve ölçüm temeli

**Amaç:** İşlevsel eşleşmeyi ölçülebilir ve hukuken/teknik olarak izlenebilir hale getirmek.

Teslimatlar:

- Bu araştırmanın ürün gereksinimlerine bağlanması
- Özgün tasarım sistemi ve marka kullanım ilkeleri
- Airport Operations Pack şeması
- Veri provenans/lisans manifesti
- Anonim olay telemetrisi şeması
- Mobil cihaz/test matrisi
- Feature parity panosu

Çıkış ölçütü:

- Her hedef özelliğin sahibi, bağımlılığı, acceptance criteria'sı ve veri kaynağı tanımlı.

### Faz 1 — Academy ve mobil radar çekirdeği

**Amaç:** ATC bilmeyen bir kişinin telefonda yardımsız ilk vardiyayı tamamlaması.

Teslimatlar:

- 10 kısa Kontrolör Okulu dersi
- Radar üstü hedef vurgusu ve tek eylemlik eğitim adımları
- Büyük alt komut sheet'i
- 44 px+ dokunma hedefleri
- Üst üste uçak seçim çözümü
- Safe-area, yatay/dikey yön ve dinamik font
- Hızlandırmada spawn koruması
- Ses/readback altyazısı
- Mobil görsel regresyon testleri

Çıkış ölçütü:

- Gerçek iPhone ve Android cihazlarda ilk üç ders okunabilir ve tek elle tamamlanır.
- Tutorial dışı panel radarın kritik alanını kapatmaz.
- Hızlandırma regresyon testlerinde yapay çarpışma oluşmaz.

### Faz 2 — Beş amiral havaalanı

**Amaç:** Katalog genişliğini gerçek operasyon derinliğine çevirmek.

Önerilen sıra:

1. İstanbul
2. Heathrow
3. LAX
4. JFK
5. Frankfurt veya Atlanta

Teslimatlar:

- Sürümlü airport pack
- Doğrulanmış pist konfigürasyonları
- Kaynağı belgelenmiş yaklaşma/SID/STAR seçkisi
- Havaalanına özgü geliş/kalkış/transit oranı
- Minimum irtifa ve coğrafi engel bağlamı
- En az üç akış ve bir düşük kapasite senaryosu
- Parallel runway ve missed approach testleri
- Havaalanına özel briefing/debrief

Çıkış ölçütü:

- Beş havaalanı yalnızca pist sayısı bakımından değil, oyuncunun uyguladığı trafik stratejisi bakımından ayrışır.

### Faz 3 — Debrief, logbook ve günlük döngü

**Amaç:** Tek vardiyayı kalıcı kariyere dönüştürmek.

Teslimatlar:

- Ayrıntılı debrief: güvenlik, verim, gecikme, komut kalitesi
- Kalıcı vardiya logbook'u
- Havaalanı/zorluk madalyaları
- Günlük meydan okuma
- Streak
- Paylaşılabilir vardiya sonuç kartı
- “Son vardiyaya devam et” ana ekran kartı
- 52 başarımın kariyer haritasıyla bağlanması

Çıkış ölçütü:

- Oyuncu her vardiyadan sonra neyi doğru/yanlış yaptığını ve sıradaki hedefini görebilir.

### Faz 4 — Hesap, bulut ve topluluk altyapısı

**Amaç:** Web, iOS ve Android ilerlemesini güvenilir biçimde birleştirmek.

Teslimatlar:

- Şifresiz başlangıç korunarak isteğe bağlı hesap
- Apple/Google/e-posta veya passkey stratejisi
- Bulut kayıt ve conflict resolution
- Havaalanı liderlik tabloları
- Developer Board karşılığı
- Oturum günlüğü gönderme
- Bilinen sorunlar/değişiklik günlüğü
- Gizlilik, silme ve dışa aktarma akışları
- Entitlement/satın alma veri modeli

Çıkış ölçütü:

- Aynı kullanıcı web ve mobil arasında ilerlemesini kaybetmeden geçebilir.
- Hata raporuna ilgili deterministik oturum bilgisi eklenebilir.

### Faz 5 — Özgün hikâyeli kariyer

**Amaç:** Flatout'un yaşayan vardiya hissine özgün içerikle ulaşmak.

Teslimatlar:

- İstanbul Control — İlk Nöbet sezonu
- Yedi özgün bölüm
- Event trigger motoru
- Senaryoya uyarlanan briefing/debrief
- Karar/performans bayrakları
- Logbook bölüm metinleri
- Sonraki uluslararası sezon için şablon

Çıkış ölçütü:

- Bölüm sonucu oyuncunun gerçek performansına göre en az üç anlamlı biçimde değişir.

### Faz 6 — İstanbul canlı trafik pilotu

**Amaç:** Live ADS-B'nin lisans, maliyet ve oynanış değerini tek bölgede doğrulamak.

Teslimatlar:

- Sağlayıcı ve ticari kullanım sözleşmesi
- Live ingest/normalization servisi
- Track kalite filtresi
- Sentetik fallback
- Günlük canlı vardiya
- Maliyet, gecikme, kapsama ve hata dashboard'u
- Açık “simülasyon kopyası” kullanıcı açıklaması

Çıkış ölçütü:

- İstanbul'da belirlenen servis düzeyinde kesintisiz vardiya, kontrollü maliyet ve anlaşılır kullanıcı deneyimi.

### Faz 7 — Hava ve ileri operasyonlar

**Amaç:** Radar karar çeşitliliğini artırmak.

Önerilen sıra:

1. Dinamik rüzgâr ve pist dönüşü
2. Fırtına hücreleri ve weather avoidance
3. Telsiz/motor/tıbbi acil durumlar
4. Yer kontrolü ve taxi
5. Helikopter/heliport
6. SAR
7. Okyanus non-radar modu

Çıkış ölçütü:

- Her sistem eğitim, bağımsız görev, debrief ölçütü ve otomatik teste sahiptir.

### Faz 8 — 3D sunum ve mağaza ürünleşmesi

**Amaç:** Aynı simülasyonu yüksek görsel sunum ve native mağaza kalitesiyle yayınlamak.

Teslimatlar:

- 3D radar
- 3D kule
- Terrain/building/lighting pipeline
- Gece operasyonu
- Performans profilleri ve asset indirme stratejisi
- App Store/Google Play paketleri
- Game Center/Play Games başarımları
- Store görseli, gizlilik formu ve erişilebilirlik denetimi
- Apple 4.1 copycat benzerlik incelemesi

Çıkış ölçütü:

- 3D kapalıyken hafif 2D paket korunur.
- Desteklenen cihazlarda performans hedefi sağlanır.
- Mağaza varlıkları ve UI, Flatout ATC ile karıştırılmayacak bağımsız kimliğe sahiptir.

## 27. İlk uygulanacak iş paketi

Araştırma sonucuna göre ilk kodlama paketi aşağıdaki sırada ele alınmalıdır:

1. Kontrolör Okulu için veri tabanlı ders/senaryo şeması
2. İlk üç ders: seçme, heading, altitude
3. Radar üstü pulse/spotlight/arrow rehberi
4. Mobil uçağa dokunma hit-box ve çakışan hedef seçimi
5. Büyük alt komut sheet'i
6. Dikey/yatay safe-area ve radar boyutlandırması
7. Hızlandırma + spawn güvenlik koruması
8. Mobil erişilebilirlik ve regresyon testleri
9. Kalan yedi eğitim dersi
10. Academy tamamlama ve ilk İstanbul vardiyasına geçiş

Bu paket tamamlanmadan 3D, canlı ADS-B, helikopter veya yeni havaalanı eklenmemelidir.

## 28. Nihai değerlendirme

Flatout ATC, geniş özellik kataloğuna rağmen hâlâ küçük ve hızla gelişen bağımsız bir üründür. Güçlü tarafı, gerçek dünya bağlamını kısa vardiyalar ve güçlü bir geri dönüş sistemiyle birleştirmesidir. Zayıf tarafı ise yüksek cihaz/asset maliyeti, geniş QA yükü, sayfalar arası ürün tutarsızlığı ve hızlı kapsam büyümesinin doğurduğu regresyonlardır.

ATC-TR'nin rakibiyle aynı ürün derinliğine ulaşması teknik olarak mümkündür. Mevcut motor, 50 havaalanı ve kariyer temeli bu hedefi sıfırdan başlamaktan daha uygulanabilir kılar. Fakat sürdürülebilir hedef, yalnızca adı ve rengi değişmiş bir kopya değil; aynı kullanıcı işlerini daha hafif, daha okunaklı, web/Android/iOS erişimli ve İstanbul merkezli özgün bir ürünle karşılamaktır.

Başarı için değişmez öncelik sırası:

> **Mobil okunabilirlik ve eğitim → beş havaalanında operasyon derinliği → günlük/logbook döngüsü → bulut/topluluk → özgün sezon → İstanbul canlı trafik → ileri operasyonlar → 3D ve mağaza ürünleşmesi.**
