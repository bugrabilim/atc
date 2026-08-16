# Endless ATC Derin İnceleme ve Airspace Control Eşleşme Raporu

**Tarih:** 16 Ağustos 2026  
**İncelenen Endless ATC sürümü:** v5.8.6 (1 Ağustos 2026)  
**İncelenen proje:** `bugrabilim/atc`, `main` — `6bee2d34a43bad701ef7438961c330da4307abb6`

## 1. Yönetici özeti

Endless ATC'nin gücü havaalanı sayısı, görev metinleri veya geniş menüler değildir. Ürünün asıl omurgası şu geri besleme döngüsüdür:

1. Oyuncu birkaç uçakla başlar.
2. Uçakları doğrudan radar vektörleriyle sıraya dizer.
3. Doğru kurulmuş ILS yaklaşmaları beceri değerini artırır.
4. Becerinin artması aynı anda kontrol edilen uçak sayısını ve zamanla aktif pist kapasitesini yükseltir.
5. Artan iş yükü daha kısa karar süresi ve daha iyi trafik planı gerektirir.
6. Hata beceriyi düşürür; trafik azalır, oyuncu toparlanır ve yeniden tırmanır.

Bu yapı oyunu hem erişilebilir hem de uzun süre oynanabilir yapar. Oyuncu yeni içerik tükettiği için değil, aynı sade sistem içinde kendi zihinsel kapasitesinin sınırını zorladığı için devam eder.

Bizim oyun bugün çalışan bir teknik prototiptir; ancak Endless ATC'nin çekirdek oynanışına yaklaşık **%20–25**, ürün olgunluğuna yaklaşık **%10–15** seviyesinde yakındır. Bu bir kod kalitesi eleştirisi değildir. Mevcut motor iyi bir başlangıçtır; fakat bazı temel tasarım tercihleri hedef oyunun döngüsünden farklıdır.

En kritik farklar:

- Bizde gelişler çoğunlukla prosedür rotalarını otomatik izliyor; Endless ATC'nin varsayılan havaalanları esas olarak oyuncu vektörüne dayanıyor.
- Bizde trafik, toplam üretilen uçak sayısına göre tek yönlü artıyor; Endless ATC'de trafik oyuncunun canlı beceri değerine göre artıp azalıyor.
- Bizde uçak dönüşü sabit derece/saniye ile modelleniyor; Endless ATC'de hız, bank açısı ve roll davranışı dönüş yarıçapını etkiliyor.
- Bizde ILS yakalama irtifa/glideslope koşulunu yeterince sınamıyor; Endless ATC'de localizer ve glideslope ayrı aşamalar ve yaklaşma aşağıdan kurulmalı.
- Bizde standart döngüde oyuncu `LAND` izni veriyor; Endless ATC yaklaşma kontrolünü kuleye otomatik devrediyor. Yaklaşma kontrol oyunu açısından otomatik kule devri daha doğru modeldir.
- Bizde radarın üstünde görev, eğitim ve koç panelleri fazla alan kaplıyor; Endless ATC'de radar birincil çalışma alanıdır ve bilgi yoğun ama sade bir kontrol çubuğu kullanılır.

Sonuç: Şimdilik yeni havaalanı, kariyer, hikâye ve olay eklemek durdurulmalı. Önce tek bir kurgusal sektörde Endless ATC seviyesinde çalışan vektör, fizik, ILS, ayırma, beceri ve trafik döngüsü kurulmalıdır.

## 2. Araştırma kapsamı ve kaynak güvenilirliği

Araştırma aşağıdaki kaynaklara dayanır:

- [Geliştiricinin güncel tam kullanım talimatı ve v5.8.6 değişiklik günlüğü](https://startgrid.blogspot.com/2013/11/endless-atc-instructions.html)
- [Resmî itch.io ürün ve demo sayfası](https://startgrid.itch.io/endlessatc)
- [Steam mağaza sayfası](https://store.steampowered.com/app/666610/)
- [Google Play tam sürüm sayfası](https://play.google.com/store/apps/details?id=com.dirgtrats.endlessatc)
- [Resmî özel havaalanı oluşturma rehberi](https://startgrid.itch.io/custom-airports)
- [EndlessATC/Airports örnek veri dosyası](https://raw.githubusercontent.com/EndlessATC/Airports/master/example.txt)
- [Steam başarımları](https://steamcommunity.com/stats/666610/achievements)
- Uzun süreli oyuncu değerlendirmeleri ve topluluk tartışmaları; örneğin [1.200 saatten fazla oynayan kullanıcının döngü analizi](https://steamcommunity.com/id/skoormit/recommended/666610)

Resmî kullanım talimatı 1 Ağustos 2026'da v5.8.6 için güncellenmiştir. Dolayısıyla bu rapor eski ekran görüntülerine veya yıllar önceki özellik listelerine değil, güncel davranışa dayanır.

## 3. Endless ATC tam olarak nasıl bir oyun?

Endless ATC, bir kule veya tüm havaalanı yönetim simülatörü değildir. Temel rol **terminal yaklaşma kontrolörüdür**. Oyuncunun ana işi:

- Sektöre farklı yönlerden giren gelişleri almak,
- Heading, irtifa ve hız komutlarıyla trafik akışı oluşturmak,
- Uçakları localizer'a uygun açı ve glideslope'un altında yerleştirmek,
- Aynı piste giden uçaklar arasında ayırma ve wake mesafesi bırakmak,
- Kalkışların güvenli tırmanmasını ve sektör çıkışını izlemek,
- Trafik arttıkça daha verimli bir düzen kurmaktır.

Oyun “hardcore prosedür simülasyonu” ile “arcade zaman yönetimi” arasında bilinçli bir orta nokta seçer. Varsayılan havaalanlarında ayrıntılı STAR yaklaşma rotaları kullanılmamasının nedeni de budur: geliştirici, yoğun trafikte esas eğlencenin oyuncunun vektör vermesi olduğunu açıkça belirtmektedir.

## 4. Çekirdek oynanış döngüsü

### 4.1 Giriş ve temas

Gelişler sektör sınırındaki giriş yönlerinden üretilir. Başlangıç irtifaları yüksektir. Uçak oyuncunun dikkatini istediğinde hedef çevresinde yanıp sönen bir halka gösterilir. Kontrol dışındaki uçak etiketi daha küçüktür; oyuncu uçağı seçtiğinde tam etiket ve kontrol seçenekleri açılır.

Bu tasarımın amacı oyuncuya sürekli şu üç soruyu sordurmaktır:

- Şimdi hangi uçak dikkat istiyor?
- Hangisini önce alçaltmalıyım?
- Hangi trafik akışına dahil etmeliyim?

### 4.2 Vektörleme

Varsayılan ana oynanışta uçaklar final rotasını kendi başına tamamlamaz. Oyuncu heading, irtifa ve hız vererek uçağı ILS hattına taşır. Direct-to ve hold seçenekleri vardır; ancak hold, gecikme ve sektör kalabalığı yarattığı için temel çözüm değil, kapasite yönetim aracıdır.

Fareyle heading sürüklemek, beacon'a direct vermek, kontrol çubuğundaki değerleri değiştirmek veya klavyeden kısa komutlar yazmak mümkündür. Klavye örnekleri callsign seçimi, `A30`, `S170`, `DPAM`, `T360`, `I`, `HO` gibi az tuşlu komutlardır. Tasarım ilkesi, oyuncunun düşündüğü trafik çözümünü arayüze mümkün olduğunca hızlı aktarabilmesidir.

### 4.3 ILS yakalama

ILS bir “piste gönder” düğmesi değildir. Bir uçağın yaklaşmayı doğru yakalaması için:

- ILS modu açık olmalı,
- Localizer'a sığ bir açıyla girmeli; oyun 60 dereceye kadar izin verse de yaklaşık 30 derece hedeflenmeli,
- Uçak glideslope'u aşağıdan yakalayacak kadar alçak olmalı,
- Önce localizer, sonra glideslope yakalanmalıdır.

Talimatlarda 2.000, 3.000 ve 4.000 feet için farklı yakalama mesafeleri özellikle gösterilir. Uçak yüksekse final daha uzun kurulmalıdır. Localizer'ı geçmek, yukarıdan glideslope yakalamaya çalışmak veya pisti çok yakın kesmek missed approach üretir.

v5.8.4 ile varsayılan localizer kullanılabilir mesafesi touchdown noktasından 25 NM'ye çıkarılmıştır. v5.8.6 ile özel yaklaşma rotalarının localizer'a 300 feet'e kadar düşük irtifada bağlanmasına ve birden fazla yaklaşma rotasının seçilmesine izin verilmiştir.

### 4.4 Kule devri ve iniş

Uçak doğru şekilde ILS'e yerleşince kuleye otomatik devredilir ve oyuncu beceri puanı kazanır. Standart yaklaşma kontrolörünün görevi piste iniş izni vermek değildir. Pist işgali veya final aralığı yetersizse uçak go-around yapabilir; oyuncu yeniden vektörlemek zorundadır.

Bu ayrıntı bizim oyun için önemlidir: mevcut `LAND` komutu ana döngüden çıkarılmalı veya yalnızca isteğe bağlı ileri gerçekçilik modu haline getirilmelidir.

### 4.5 Skill, skor ve trafik geri beslemesi

Endless ATC iki yakın değeri kullanır:

- **Skill:** Oyuncunun canlı performansı; artabilir ve azalabilir.
- **Game score:** O vardiyada ulaşılan en yüksek skill değeri; geriye düşmez.

Aynı anda kontrol edilen uçak sayısı skill değerine yaklaşık olarak eşittir. Örneğin 8,4 skill yaklaşık sekiz uçaklık yük demektir. Başarılı kule devirleri skill'i küçük adımlarla artırır. Ayırma ihlali, divert, go-around, missed approach veya ciddi gecikme skill'i düşürür. Böylece oyun hata sonrasında yükü doğal olarak azaltır ve toparlanma alanı açar.

Bu, Endless ATC'nin en önemli sistemidir. Bizdeki “spawn sayısı arttıkça seviye yükselsin” yaklaşımı aynı etkiyi vermez; çünkü oyuncu kötü oynasa bile zorluk artmaya devam eder.

### 4.6 Trafik üretimi ve kapasite

Normal modda trafik rastgele ve beceriye bağlıdır. Yeni uçak üretimi yalnızca sabit zamanlayıcı değildir; hedef aktif trafik sayısı, uçak hızı, pist yapısı ve güvenli giriş mesafeleri dikkate alınır. 2026 güncellemelerinden biri, yavaş uçağın hemen arkasında geliş üretilmesini ayrıca engellemiştir.

Skill belirli eşikleri geçtikçe daha fazla pist aktif olabilir. Bu, sadece daha fazla uçak değil, daha karmaşık pist dağıtımı anlamına gelir.

Custom modda oyuncu:

- Skill'i sabitleyebilir veya üst sınır koyabilir,
- Saatlik sabit trafik akışı belirleyebilir,
- Minimum–maksimum akışla saatlik geliş/kalkış pikleri oluşturabilir,
- Kalkışları veya ikincil havaalanı trafiğini kapatabilir.

Önce normal adaptif mod yapılmalı; özel trafik ayarları daha sonra eklenmelidir.

## 5. Uçuş fiziği

### 5.1 Dönüş modeli

Endless ATC'nin uçakları sabit dönüş oranıyla dönmez. Uçaklar yaklaşık 25–30 derece maksimum bank açısına yuvarlanır. Hız yükseldikçe aynı bank açısında dönüş yarıçapı büyür. Roll rate, uçağın banka girme ve banktan çıkma süresini belirler.

Bizde bugün her uçak tipi için `turnRateDegPerSecond` bulunuyor. Bu oran hıza bağlı olmadığı için 160 knot ve 300 knot'ta geometrik olarak benzer dönüş oluşuyor. Hedef benzerlik için dönüş şu fizik temeline taşınmalıdır:

`turnRate = g × tan(bankAngle) / trueAirspeed`

Simülasyon için tam aerodinamik modele gerek yoktur; bank açısı, roll rate ve gerçek hava hızı kullanılarak kararlı ve tahmin edilebilir bir dönüş yeterlidir.

### 5.2 Hız modeli

Endless ATC etikette ground speed gösterir; oyuncunun verdiği değer IAS hedefidir. İrtifa arttıkça IAS ile ground speed arasında fark oluşur. Rüzgâr track ve ground speed'i etkiler.

Normal hız otomasyonu yaklaşma evresine göre çalışır:

- FL100 altında yaklaşık 250 knot,
- Hedef havaalanına 15 NM içinde yaklaşık 220 knot,
- Localizer yakalarken yaklaşık 200 knot,
- Pistten 6 NM'de yaklaşık 160 knot,
- 4 NM'de uçak tipinin final yaklaşma hızı.

Oyuncu hız verdiğinde otomatik hız geçici olarak devre dışı kalır. `Resume Normal Speed` komutu ve localizer yakalama normal davranışı yeniden açabilir.

Bizde mevcut hız hedefi, yeni komut gelene kadar kalıcıdır. Faz tabanlı normal hız sistemi eklenmelidir.

### 5.3 Dikey hareket

Uçak tipleri farklı minimum/maksimum hız, alçalma, tırmanma, hızlanma, bank ve roll değerlerine sahiptir. Ağır uçaklar genellikle daha yavaş döner ve tırmanır, daha yüksek final hızına ihtiyaç duyar. Expedite modu dikey hızı yükseltir. Yüksek irtifada tırmanma performansı bir miktar azalır.

Bizde jet ve heavy olmak üzere iki temel profil vardır. Bu başlangıç için uygundur; fakat uçuş davranışının sınıf bazında en az altı wake kategorisi ve birkaç performans ailesine ayrılması gerekir.

## 6. Ayırma ve wake turbulence

### 6.1 Temel ayırma

Genel asgari ayırma 3 NM yatay veya 1.000 feet dikeydir. Oyun bazı kontrollü istisnalar uygular:

- Farklı localizer'larda yerleşmiş paralel gelişler,
- Minimum sektör irtifasının altındaki uçaklar,
- En az 15 derece ayrışan iki kalkış,
- Go-around sonrasında kısa toparlanma süresi.

Bizde 5 NM/1.500 feet altında uyarı, 3 NM/1.000 feet altında kayıp tanımı vardır; ancak yukarıdaki operasyonel istisnalar yoktur. Bu durum paralel yaklaşmayı gereksiz yere cezalandırabilir.

### 6.2 Wake turbulence

Endless ATC altı RECAT benzeri ağırlık kategorisi kullanır. Localizer üzerindeki lider–takipçi kombinasyonuna göre gerekli NM mesafesi değişir. Güvenli wake mesafesi liderin arkasında yay olarak çizilir. Kalkışlar için ayrıca zaman bazlı wake aralığı bulunur.

Bizde yalnızca birkaç uçak tipi için 4–5,5 NM final önerisi vardır ve ağırlıklı olarak `LAND` kontrolünde kullanılır. Gerekli hedef:

- 6×6 lider/takipçi wake matrisi,
- Localizer üzerinde canlı takipçi belirleme,
- Radar üzerinde wake yayı,
- Kalkışlar için zaman ayırması,
- Go-around riskinin wake ihlaline bağlanması.

## 7. Radar, etiket ve kontrol ergonomisi

### 7.1 Radar önceliği

Endless ATC ekranı, profesyonel radarın sadeleştirilmiş halidir. Radar alanı olabildiğince büyüktür. Ayar ve kontrol çubuğu dar tutulur. Oyuncunun bakışı sürekli uçak hedefleri, etiketler, localizer hatları ve ayırma halkaları arasında dolaşır.

Bizde üst bar, operasyon barı, görev alanı, eğitim ve koç aynı anda radarın dikey alanını azaltıyor. İlk eğitim bittikten sonra bunlar katlanmalı veya radar üstü küçük durum satırlarına dönüşmelidir.

### 7.2 Etiket içeriği

Endless ATC etiketi seçilebilir 2, 3 veya 4 satır formatına sahiptir. Tam etiket şu tür bilgileri taşır:

- Callsign,
- Mevcut ve seçili irtifa,
- Ground speed,
- Ağırlık kategorisi,
- ILS/DCT/HOLD modu,
- Gerekirse ikincil havaalanı hedefi.

Etiketler v5.8.6 itibarıyla serbestçe taşınabilir; varsayılan etiket konumu da ayarlanabilir. Bu, yoğun ekranda çakışmaları oyuncunun çözebilmesini sağlar.

Bizde etiket lider çizgisi ve temel uçuş bilgisi var; ancak etiketler sabit, çakışma çözümü yok ve mobilde yoğunluk arttıkça okunabilirlik hızla bozulacaktır.

### 7.3 Tahmin ve ölçüm araçları

Önemli radar araçları:

- Hıza bağlı kavisli heading tahmin çizgisi,
- Ayırma halkaları,
- Wake mesafesi yayı,
- Birden fazla distance line,
- Cursor'a tahmini varış zamanı,
- Pan, zoom ve görünüm kilidi,
- Track history,
- Radar sweep ve pilot delay ayarları.

Bizde düz hedef heading çizgisi, range ring, CPA uyarısı ve 60 saniyelik track history vardır. Pan/zoom, kavisli tahmin, distance tool, label drag ve wake yayı eksiktir.

### 7.4 Giriş hızının önemi

Endless ATC'nin arayüz başarısı, bir komutu düşünce hızına yakın girebilmesidir. Fare, klavye ve dokunmatik aynı simülasyon durumunu yönetir.

Bizim ürünün özgün şartı “çizerek değil, kod vererek” oynamaktır. Bu nedenle heading sürüklemeyi ana yöntem olarak kopyalamamalıyız. Aynı hızı şu yolla sağlamalıyız:

- Callsign yazıp `Tab`/boşlukla tamamlama,
- Terse komutlar: `A30`, `S170`, `H270`, `I34L`, `DCT FIX`, `HO`, `E`, `NS`, `LLZ`,
- Seçili uçakta callsign yazmadan komut,
- Birden çok komutu tek satırda verme,
- Mobilde kod üreten bağlamsal numara pedleri,
- Enter ile gönderme ve Esc ile iptal,
- Yanıp sönen/öncelikli uçağa Tab ile geçiş.

## 8. Radyo ve pilot davranışı

Endless ATC cihazın text-to-speech sistemini kullanır. Birden fazla İngilizce ses, çağrı kodu ve talimat çeşitliliği sağlar. Radyo kuyruğunda readback'ler yeni çağrılardan önce gelebilir; aynı uçağa art arda verilen komutlarda gereksiz çift readback azaltılır. Radyo gürültüsü, konuşan uçağı gösteren RDF ve altyazı seçenekleri vardır.

Bizde deterministik readback gecikmesi ve metin mesajı vardır. Bu doğru bir temel, fakat yalnızca ilk katmandır. Hedef sistem:

- Komutları aynı readback içinde birleştirme,
- Readback öncelik kuyruğu,
- Yeni trafik çağrısı ve acil çağrı önceliği,
- Web Speech API ile ses,
- İsteğe bağlı radyo gürültüsü,
- Konuşan uçağı radar üzerinde vurgulama,
- Tam altyazı ve sessiz mod.

## 9. Hava, alanlar, olaylar ve gecikmeler

Bu bölüm hedef eşleşme için gereklidir; ancak kullanıcı kararı gereği çekirdek tamamlanana kadar uygulanmamalıdır.

Endless ATC'de:

- Rüzgâr irtifayla güçlenebilir, track ve ground speed'i değiştirir,
- Hava şartları sabit veya zamanla değişken olabilir,
- Bulut/fırtına hücreleri trafik rotasını etkiler,
- İrtifa kısıtlı dairesel/poligonal alanlar bulunur,
- Pist konfigürasyonu değiştirilebilir; geçiş birkaç dakika operasyonel gecikme yaratır,
- Düşük yakıt, tıbbi veya motor kaynaklı aciller oluşabilir,
- Uzun süre indirilmeyen uçaklar gecikme yaşar ve sonunda divert edebilir,
- Olay sıklığı düşük, yüksek veya kapalı seçilebilir.

Bizde akışa bağlı statik rüzgâr, QNH/görüş bilgisi ve minimum yakıt/tıbbi öncelik etiketi var. Rüzgâr henüz uçağın gerçek ground track'ine uygulanmıyor; hava hücresi, restricted area, dinamik pist değişimi ve yakıt/delay modeli yok.

## 10. Oyun modları, kayıt ve başarı hedefleri

Endless ATC üç ana trafik modu sunar:

- **Normal:** Skill'e göre sonsuz ve adaptif trafik.
- **Custom:** Sabit/capped skill veya saatlik flow.
- **Scenario:** Önceden tanımlı trafik, bazen süre sınırı ve ardışık açılma.

Otomatik kayıt vardır; oyun yeniden açıldığında aynı vardiya devam eder. Steam'de 10 başarım bulunur. Başarım dağılımı tasarımın zorluk eğrisini gösterir: oyuncuların çoğu ilk uçağı indirirken, 30 skill'e ulaşanların oranı yaklaşık %1,7 seviyesindedir. Hedefler “25 hatasız uçak”, “30 ayırma olayı olmadan”, “tek oyunda 100 iniş” gibi sistem ustalığını ölçer.

Bizde autosave, debrief ve kariyer rekorları vardır. Bunlar korunabilir; ancak skill–trafik geri beslemesi kurulmadan skor hedefleri anlamlı değildir.

## 11. Modlanabilir havaalanı veri modeli

Endless ATC'nin özel havaalanı formatı ürünün olgunluğunu gösteren önemli bir referanstır. Tek metin dosyası şu veri alanlarını taşıyabilir:

- `[airspace]`: yarıçap/sınır poligonu, floor, ceiling, arrival/descent/above irtifaları, hız kısıtları, localizer hızı, transition altitude, separation, manyetik varyasyon, beacon/hold, handoff ve wake matrisi.
- `[airportN]`: ana ve ikincil havaalanları, pist geometrisi, displaced threshold, elevation, glideslope/localizer açıları, kule frekansı, SID noktaları, giriş noktaları ve havayolu dağılımı.
- `[areaN]`: daire/poligon kısıtlı saha ve minimum irtifa.
- `[configurations]`: skill eşiğine göre aktif pistler, landing/takeoff/reverse/intersection/backtrack seçenekleri ve kalkış offset heading'i.
- `[departureN]`: piste bağlı SID waypoint dizileri ve irtifa kısıtları.
- `[approachN]`: APP beacon, farklı geliş bearing'lerine göre rotalar, waypoint irtifa/hız kısıtları ve ILS intercept mesafesi.
- `[planetypes]`: altı wake sınıfı, hız, turn rate, descent/climb, final hız, acceleration, bank ve roll rate.
- `[scenario]`: zamanlanmış geliş/kalkış, skor, rüzgâr, bulut, pist config ve mesaj olayları.
- `[background]`: radar arka plan çizgileri ve etiketler.

Bizim `RadarWorld` modeli pist, fix, prosedür, giriş/çıkış ve akışları içeriyor. İyi bir başlangıç olsa da hard-coded TypeScript yapısıdır. Çekirdek motor tamamlanınca JSON şeması ve doğrulayıcıya ayrılması gerekir. Şimdilik özel havaalanı editörü yapmak öncelik değildir.

## 12. Bizim oyunun mevcut teknik durumu

### 12.1 Güçlü temel

Mevcut depo yaklaşık 3.000 satır TypeScript/TSX/CSS ve 41 otomatik testten oluşmaktadır. Olumlu taraflar:

- React arayüzünden ayrılmış saf TypeScript simülasyon motoru,
- Canvas tabanlı responsive radar,
- Heading/altitude/speed değişiminin zaman içinde uygulanması,
- Komut parser'ı ve callsign tamamlama,
- DCT, HOLD, ILS, LAND, HANDOFF komutları,
- Pilot readback gecikmesi,
- ILS localizer geometrisi ve basit glideslope,
- Pist işgali ve finalde öndeki uçağa göre clearance kontrolü,
- CPA tahmini ve ayırma uyarısı,
- Trafik üretimi ve iki pist arasında yük dağıtımı,
- Statik rüzgâr bileşeni ve yaklaşma hızı etkisi,
- Otomatik kayıt, debrief ve olay zaman çizgisi,
- İlk iniş eğitimi ve bağlamsal koç,
- PWA kabuğu ve Vercel üretim dağıtımı.

### 12.2 Alt sistem eşleşme tablosu

| Alt sistem | Bizde bugün | Endless ATC seviyesi | Eşleşme |
|---|---|---|---:|
| Radar hedef/etiket | Temel etiket, lider çizgisi, trail, CPA | Taşınabilir çok biçimli etiket, attention, range/wake, ölçüm | %35 |
| Komut girişi | Kod satırı, Tab, hızlı komut | Çok kısa klavye komutları + fare/dokunmatik kontrol çubuğu | %45 |
| Uçuş fiziği | Sabit turn rate, sabit climb/descent, hedef hız | Hız/bank/roll sınırlı dönüş, IAS/GS, irtifa etkisi | %25 |
| ILS | Armed/captured ve basit yatay geometri | LOC→GS durum makinesi, alttan/mesafe/açı şartı, LLZ | %25 |
| Trafik döngüsü | Spawn sayısına göre 1–5 yoğunluk | Canlı skill'e göre artan/azalan aktif trafik | %20 |
| Ayırma | 5 NM uyarı, 3 NM/1000 ft kayıp, CPA | Operasyonel istisnalar, paralel yaklaşma, go-around grace | %30 |
| Wake | Tip bazlı basit final aralığı | 6×6 RECAT matrisi, görsel yay, kalkış zamanı | %15 |
| Hız otomasyonu | Kalıcı target speed | Faz/mesafe tabanlı normal speed ve override | %20 |
| Pist operasyonu | Flow seçimi ve pist cooldown | Skill'e göre kapasite, config geçişi, intersecting runways | %25 |
| Radyo | Metin readback gecikmesi | TTS, ses çeşitliliği, birleştirme, RDF, gürültü | %20 |
| Hava/alan | Statik akış rüzgârı | Ground track rüzgârı, değişken hava, bulut, alanlar | %15 |
| Kayıt | Autosave ve devam | Autosave ve havaalanı başına devam | %70 |
| Eğitim | Adımlı eğitim ve koç | Yardım, ipuçları, öğretici ekranlar | %70 |
| Modlama | Hard-coded iki dünya | Geniş dosya şeması ve topluluk ekosistemi | %10 |

### 12.3 Genel değerlendirme

Mevcut oyun “özellik isimleri” bakımından zengin görünse de oynanış yükünün büyük kısmı oyuncu yerine otomatik rotalar tarafından taşınmaktadır. Bu yüzden çok sayıda sistem olmasına rağmen Endless ATC hissi oluşmamaktadır.

## 13. Bugün yanlış yönde olan beş temel karar

### 13.1 Otomatik geliş rotaları

Yeni gelişler route navigation ile GATE→FINAL izliyor. Oyuncunun çoğu durumda yapması gereken ILS'i başlatmak ve LAND vermek oluyor. Hedef oyunda varsayılan havaalanlarının özü, gelişleri oyuncunun heading vektörleriyle final dizisine sokmasıdır.

**Karar:** Normal modda gelişlerin otomatik prosedür rotası kaldırılmalı. Uçak boundary entry heading'iyle gelir; oyuncu vektörler. DCT/HOLD yardımcı araçtır. Ayrıntılı yaklaşma rotaları gelecekte ayrı prosedür modu olabilir.

### 13.2 Tek yönlü zorluk artışı

Bizde `trafficLevel`, üretilmiş uçak sayısından hesaplanıyor. Hata yapan oyuncunun yükü düşmüyor.

**Karar:** `skill` canlı performans değişkeni olmalı; trafik scheduler hedef aktif uçak sayısını skill'den türetmeli. Hata skill'i düşürmeli ve yük doğal olarak gevşemeli.

### 13.3 LAND komutu

LAND, yaklaşma kontrolörünün ana işi değildir ve oyuncuya ikinci bir “doğru zamanda düğmeye bas” görevi ekleyerek asıl vektör işini gölgeler.

**Karar:** Standart modda LOC+GS established sonrası otomatik tower handoff. LAND yalnızca isteğe bağlı tower/advanced modunda kalabilir.

### 13.4 Sabit dönüş oranı

Hızın dönüş yarıçapına etkisi olmadığı için oyuncu hız–heading ilişkisini planlamak zorunda kalmıyor.

**Karar:** Bank/roll tabanlı dönüş. Radar heading predictor aynı fizik modelinden çizilmeli.

### 13.5 Radarın ikincil kalması

Görev/eğitim/koç alanları oynanış sırasında sürekli görünerek radar alanını daraltıyor.

**Karar:** İlk eğitimden sonra tek satırlık uyarı/koç; ayrıntı isteğe bağlı açılır. Masaüstünde uçuş şeritleri isteğe bağlı olmalı. Mobilde seçili uçak kontrol alanı radarın üstüne bindirilmemeli.

## 14. Hedef ürün: “Core Parity 1.0”

Yeni içerik eklemeden önce aşağıdaki tanım tamamlanmalıdır.

### 14.1 Tek sektör

- Bir kurgusal ana havaalanı,
- İki paralel geliş pisti ve bir kalkış pisti,
- 30–40 NM radar alanı,
- 4–6 boundary giriş yönü,
- Birkaç beacon; ancak gelişler otomatik rotaya bağlı değil.

### 14.2 Adaptif sonsuz oyun

- Başlangıç skill: yaklaşık 3–4,
- Hedef aktif trafik: skill'e bağlı,
- Başarılı tower handoff küçük skill artışı,
- Ayırma/go-around/divert/delay skill kaybı,
- Ulaşılan maksimum değer vardiya skoru,
- Skill düşünce trafik yükü azalır,
- Skill eşiğinde ikinci geliş pisti aktive olur.

### 14.3 Tam vektör döngüsü

- Heading sol/sağ/shortest,
- İrtifa,
- Hız,
- Expedite,
- Direct-to,
- Hold at fix/current position,
- ILS arm,
- LLZ only,
- Resume normal speed,
- Departure SID resume/handoff.

### 14.4 Yaklaşma durum makinesi

`NONE → ILS_ARMED → LOC_CAPTURED → GS_CAPTURED → TOWER → LANDED`

Yan yollar:

- Localizer overshoot,
- Above-glideslope missed approach,
- Wake/runway conflict go-around,
- Controller-cancelled approach,
- LLZ capture without GS.

### 14.5 Gerçekçi ama hesaplı fizik

- Sabit simülasyon tick'i,
- IAS, TAS ve GS ayrımı,
- Bank angle ve roll rate,
- Hıza bağlı dönüş yarıçapı,
- Uçak sınıfına göre climb/descent/acceleration,
- Rüzgâr vektörünün ground track'e etkisi,
- Faz bazlı normal hız davranışı.

### 14.6 Tam emniyet modeli

- 3 NM/1.000 feet,
- Predicted conflict,
- Paralel localizer istisnası,
- Diverging departures istisnası,
- Go-around grace,
- 6×6 wake matrisi,
- Wake arc ve kalkış wake süresi.

### 14.7 Radar ergonomisi

- Pan/zoom/lock,
- Taşınabilir etiket,
- 2/3/4 satır etiket,
- Kavisli heading predictor,
- Range ve wake halkaları,
- Birden çok distance line,
- Attention ve konuşan uçak vurgusu,
- Katlanabilir eğitim/koç.

## 15. Önerilen teknik mimari

Mevcut `simulation.ts` 400 satırı aşan tek merkez haline gelmiştir. Yeni fizik eklenmeden bölünmelidir.

```text
src/engine/
  clock.ts                 sabit timestep, hız ve pause
  aircraftDynamics.ts      bank, roll, IAS/TAS/GS, dikey hareket
  guidance.ts              heading, DCT, HOLD, SID
  approach.ts              LOC/GS/tower/go-around durum makinesi
  separation.ts            3NM/1000ft, CPA, istisnalar
  wake.ts                  RECAT matrisi ve lider/takipçi
  trafficScheduler.ts      skill tabanlı hedef trafik
  skill.ts                 başarı/ceza ve runway eşikleri
  radio.ts                 komut/readback/çağrı kuyruğu
  worldSchema.ts           veri doğrulama
  simulation.ts            yalnızca orkestrasyon
```

### 15.1 Deterministik simülasyon

- Fizik 20 Hz veya 30 Hz sabit adımla ilerlemeli.
- Canvas `requestAnimationFrame` ile ara konumları yumuşatmalı.
- Trafik üretimi seed'li PRNG kullanmalı.
- Aynı seed ve komut günlüğü aynı sonucu üretmeli.
- Bu yapı test, replay ve hata tekrarı için gereklidir.

### 15.2 State değişiklikleri

`Aircraft` için önerilen yeni alanlar:

```ts
indicatedAirspeed
trueAirspeed
groundSpeed
track
bankAngle
targetBankAngle
verticalSpeed
wakeCategory
speedMode: 'normal' | 'assigned'
guidanceMode: 'vector' | 'direct' | 'hold' | 'sid'
approachState: 'none' | 'armed' | 'loc' | 'gs' | 'tower'
attentionState
lastInstructionAt
goAroundGraceUntil
```

`GameState` için:

```ts
skill
peakSkill
trafficMode
targetControlledAircraft
runwayConfiguration
seed
commandHistory
radioQueue
```

### 15.3 UI ve motor ayrımı

- UI, güvenli komut olup olmadığına karar vermemeli.
- Parser yalnızca komutu üretmeli.
- Bir `clearanceValidator` komutu mevcut duruma göre kabul/ret etmeli.
- Motor kabul edilen komutu radyo kuyruğuna koymalı.
- Pilot delay sonunda state değişmeli.
- UI yalnızca olayları ve öngörülen sonucu göstermeli.

### 15.4 Performans

İlk sürümde 30 uçak için React + Canvas yeterlidir. Ancak simülasyon yoğunlaştığında Web Worker'a taşınabilecek şekilde saf veri mesajları kullanılmalıdır. UI render döngüsü ile fizik tick'i birbirine bağlanmamalıdır.

## 16. Uygulama sırası

### Faz A — Motor temelini düzelt

1. Seed'li deterministik clock ve trafik üretimi.
2. `simulation.ts` modüler ayrımı.
3. Skill/peakSkill ve geri beslemeli trafik scheduler.
4. Spawned-count tabanlı yoğunluk sistemini kaldır.

**Kabul ölçütü:** Hatasız oynandığında trafik yükseliyor; art arda hata sonrasında aktif trafik sayısı doğal biçimde düşüyor.

### Faz B — Vektör ve yaklaşma dikey dilimi

1. Normal gelişlerde otomatik route navigation kaldır.
2. Bank/roll/hız tabanlı dönüş.
3. LOC ve GS ayrı durumlar.
4. İrtifa–mesafe–açı capture şartları.
5. Otomatik tower handoff; LAND'i standart moddan çıkar.
6. Normal speed ve expedite.

**Kabul ölçütü:** Oyuncu heading, altitude ve speed kullanmadan yeni bir geliş kendi kendine inemiyor. Yanlış açı veya yüksek irtifa missed approach üretiyor.

### Faz C — Ayırma ve kapasite

1. 3 NM/1.000 feet modelini ve istisnaları uygula.
2. 6×6 wake matrisi.
3. Localizer lider/takipçi ve wake arc.
4. Runway occupation ve kalkış wake zamanı.
5. Skill eşiğine göre pist aktivasyonu.

**Kabul ölçütü:** Paralel yaklaşmalar farklı irtifayla kurulabiliyor; heavy arkasındaki takipçi doğru aralıkta değilse go-around riski oluşuyor.

### Faz D — Düşünce hızında kontrol ve radar

1. Kısa komut söz dizimi ve çoklu talimat.
2. Attention-priority Tab seçimi.
3. Etiket taşıma ve çakışma yönetimi.
4. Kavisli heading predictor.
5. Pan/zoom/lock ve distance line.
6. Koç/eğitim alanını katlanabilir hale getir.

**Kabul ölçütü:** Deneyimli kullanıcı seçme dahil iki–üç saniye içinde komut verebiliyor; mobilde klavye açmadan temel komut oluşturabiliyor.

### Faz E — Radyo ve ürün sertleştirme

1. Birleştirilmiş readback kuyruğu.
2. Web Speech API ve altyazı.
3. Ses/alert öncelikleri.
4. Uzun vardiya soak testleri.
5. Mobil dokunma, düşük FPS ve yeniden yükleme testleri.

**Kabul ölçütü:** 30–60 dakikalık vardiyada trafik kilitlenmiyor, görünmez uçak kalmıyor, kayıt deterministik biçimde devam ediyor.

### Faz F — Daha sonra yapılacak zenginleştirme

- Hava hücreleri ve değişken rüzgâr,
- Restricted areas,
- Emergency/fuel/delay,
- Secondary airport,
- Senaryo zinciri,
- Yeni havaalanları,
- Custom airport import/editör,
- Native Android/iOS paketleri.

## 17. İlk geliştirme backlog'u

| Öncelik | İş | Boyut | Neden |
|---|---|---:|---|
| P0 | Skill/peakSkill ve adaptif trafik | L | Endless döngüsünün merkezi |
| P0 | Normal gelişlerde otomatik rotayı kaldır | M | Oyuncuya gerçek vektör işi verir |
| P0 | LOC/GS durum makinesi | L | Yaklaşmayı “düğme” olmaktan çıkarır |
| P0 | Bank/hız tabanlı dönüş | L | Vektör ve hız planını anlamlı yapar |
| P0 | Otomatik tower handoff | M | Yaklaşma kontrol rolünü düzeltir |
| P1 | Normal speed + expedite | M | Sıralama ve final yönetimini derinleştirir |
| P1 | Ayırma istisnaları | M | Paralel operasyonu mümkün kılar |
| P1 | Wake matrisi ve arc | L | Final sıralamasını anlamlı yapar |
| P1 | Radar pan/zoom + curved predictor | L | Yoğun trafikte kullanılabilirlik sağlar |
| P1 | Kısa/çoklu komutlar | M | Kod tabanlı kontrol hızını yükseltir |
| P2 | TTS/radio queue | L | İmmersiyon ve dikkat yönetimi |
| P2 | Events/weather/areas | XL | Çekirdekten sonra çeşitlilik |

## 18. Neyi aynen yapacağız, neyi yapmayacağız?

### İşlevsel olarak eşleştirilecek

- Sonsuz adaptif trafik,
- Skill–yük geri beslemesi,
- Vektör ağırlıklı yaklaşma,
- Gerçekçi ama erişilebilir uçuş davranışı,
- LOC/GS yaklaşma geometrisi,
- Ayırma ve wake,
- Radar odaklı yoğun arayüz,
- Hızlı klavye/dokunmatik komut,
- Pilot readback ve ses,
- Autosave ve yüksek skor.

### Kopyalanmayacak

- Endless ATC adı, logo ve marka dili,
- Kod veya binary içeriği,
- Ekranın piksel piksel yerleşimi,
- Orijinal ikon, ses, renk paleti ve metinleri,
- Varsayılan havaalanı dosyalarının izinsiz ürün içi dağıtımı,
- Steam başarımlarının adları ve birebir tanımları.

Hedef, aynı problemi aynı kalite seviyesinde çözen özgün bir oyun üretmektir. Bu yaklaşım hem hukuken daha güvenli hem de bizim kod tabanlı komut farkımızı korur.

## 19. Son karar

Bugün yeni havaalanı veya olay eklemeye devam edersek geniş ama yüzeysel bir ürün oluşur. Doğru sıra:

1. Adaptif skill–trafik döngüsü,
2. Oyuncu vektörüne bağımlı gelişler,
3. Bank/hız tabanlı fizik,
4. LOC/GS yaklaşma durumu,
5. Ayırma/wake,
6. Radar ve komut ergonomisi,
7. Radyo,
8. Sonra içerik zenginleştirme.

Bu altı çekirdek başlık tamamlandığında oyun yalnızca Endless ATC'ye görsel olarak değil, karar yoğunluğu ve oynanış hissi açısından yaklaşacaktır. Mevcut kod atılmayacak; parser, Canvas radar, kayıt, readback, CPA, trafik planlama ve eğitim sistemleri yeni mimarinin parçaları olarak korunabilir.
