# Kaynak ve toplanan dosya envanteri

Güncelleme: 2026-08-31

Bu kayıt, güncel uygulama verisinin nereden geldiğini, hangi benzersiz çalışma
çıktılarının GitHub'da saklandığını ve hangi dosyaların neden bilinçli olarak
saklanmadığını açıklar.

## Kanonik uygulama kaynakları

| Veri / araştırma | Sabitlenen kaynak | Repodaki karşılığı |
| --- | --- | --- |
| 2025 yolcu sırası | Airports Council International; İstanbul ürün kararıyla 1. sırada | `docs/AIRPORT_DATA.md`, `src/engine/airportCatalog.ts` |
| Meydan ve pist geometrisi | OurAirports commit `be07e33e6cc10087f57064f2bb3fccfcd39f5801` | `src/engine/airportCatalog.ts` |
| ABD prosedürleri | FAA d-TPP/CIFP cycle 2608 | `src/engine/generated/faaCifpProcedures.ts` |
| Uluslararası prosedürler | DHMI, NATS, AIM India, Korea AIM, GCAA, SIA, CAAS, LVNL, ENAIRE, CAAM, CAAT, Hong Kong CAD, QCAA; döngüler meydan bazında kayıtlı | `docs/PUBLISHED_PROCEDURES.md`, `src/engine/*PublishedProcedures.ts` |
| İlk beş operasyon paketi | Yetkili meydan/otorite yayınları ve belgelenmiş oyun uyarlaması | `docs/FLAGSHIP_AIRPORT_PACKS.md`, `src/engine/airportOperations.ts` |
| Ürün araştırması | Flatout ATC ve Endless ATC işlevsel incelemeleri | `docs/flatout-atc-research-tr.md`, `docs/endless-atc-parity-report-tr.md` |

Kaynak URL'leri, erişim tarihleri ve doğruluk sınırları ilgili belgelerde
korunur. Runtime veri ile oyun için üretilmiş taktik geometri birbirine
karıştırılmaz.

## Saklanan benzersiz tarihsel çıktılar

Tüm dosyalar `docs/archive/2026-08/` altındadır. SHA-256 değerleri, kopyalama
sırasında özgün dosyalarla birebir doğrulanmıştır.

| Dosya | Bayt | SHA-256 | Açıklama |
| --- | ---: | --- | --- |
| `IST_ATC_MVP_2026-08-10.zip` | 4.797 | `c3fd74c44a2ee950a3d62e510494a6195bf2d4c08a9ad2b9f22330a878263410` | İlk tek dosyalı İstanbul MVP kaynak arşivi |
| `atc-ilk-oynanabilir-surum_2026-08-16.zip` | 103.271 | `0a0f4c408500d8a914f38b0117adaba21bf4432ca65902500e49ee92a92c7409` | Erken React/TypeScript oynanabilir sürüm, kaynak ve dönemsel build |
| `ATC-DEMO_2026-08-16.html` | 213.703 | `918b4cd3017b1326359f6d3e3bc67452777f98e9dbb97ae69d0fd8576ed246dd` | Bağımsız erken demo |
| `ATC-DEMO-FAZ-2_2026-08-16.html` | 219.373 | `1603f236a362c1f10070a1bb5e0ec55fb9a9b17cfe52c7daa7b5f853b004c250` | Bağımsız faz 2 demo |
| `mobile-qa_2026-08-22.png` | 560.998 | `15fbc869ed7dc77e1c7094e54cb1464da451962d1788108cc8a9da1f2b7c01c3` | Mobil tarayıcı QA ekran görüntüsü; tam Library kopyası |
| `ATC_Master_Handoff_2026-08-26.docx` | 71.957 | `ba45b66ac2472362fd2cc1647793f02a34e80b497c23cafb48ada57a18553697` | 26 sayfalık tarihsel proje devir belgesi |
| `ATC_Master_Handoff_builder_2026-08-26.py` | 65.074 | `3594bc5d16d09be98d7fe40f882a58e57c126e676c081af496ba6f781390891e` | Devir belgesini üreten dönemsel, ortama bağlı betik |
| `ATC_Master_Handoff_a11y_2026-08-26.json` | 146 | `3af5cc87221e4e0fc06419d8a03f88ac92bfa9d621255477acce46900c34a7b0` | Son devir belgesi erişilebilirlik taraması: 0 bulgu |

Word belgesi ayrıca PDF'e render edilerek 26 sayfanın tamamında taşma, üst üste
binme ve kırpılma açısından görsel kontrol edilmiştir. İki ZIP için `unzip -t`
doğrulaması hatasızdır. Makine tarafından okunabilir checksum listesi
`docs/archive/2026-08/SHA256SUMS` dosyasındadır.

## Bilinçli olarak tekrar saklanmayanlar

- `ENDLESS_ATC_DERIN_INCELEME_RAPORU.md`, repodaki
  `docs/endless-atc-parity-report-tr.md` ile byte düzeyinde aynıdır; ikinci kopya
  oluşturulmadı.
- Eski `README.md`, `package*.json`, `src/` ve `public/` kopyaları Git geçmişinin
  eksik anlık görüntüleridir; güncel `main` bunların üst kümesidir.
- `node_modules`, `dist`, `*.tsbuildinfo`, render edilmiş ara PDF/PNG sayfaları ve
  geçici repo klonları yeniden üretilebilir çıktılardır; depoya eklenmedi.
- Aynı mobil görselin 110.592 baytta kesilmiş yerel kopyası yerine 560.998 baytlık
  eksiksiz özgün kopya saklandı.
- ATC ile ilgisiz fiyatlandırma ve sosyal medya görselleri arşive alınmadı.

Bu seçimler veri kaybı değil, kopya ve geçici çıktı ayıklamasıdır. Benzersiz ATC
çalışma ürünlerinin tamamı yukarıdaki manifestte yer alır.

## Ham üçüncü taraf dosyalar

- FAA'nın yaklaşık 53 MB ham CIFP dosyası repoda tutulmaz. `npm run import:cifp`
  ile resmi döngüden yeniden üretilebilir; deterministik seçilmiş çıktı
  `src/engine/generated/faaCifpProcedures.ts` olarak saklanır.
- Otorite chart PDF'leri/AIP sayfaları güncellik ve yeniden dağıtım hakları
  nedeniyle kopyalanmaz; doğrudan yetkili kaynak bağlantısı, döngü ve erişim
  tarihi belgelenir.
- ACI ve OurAirports girdileri yeniden dağıtılmak yerine kaynak ve sabit commit
  ile izlenir.

Yeni dış veri eklenirken aynı kural uygulanmalıdır: kaynak, erişim tarihi,
döngü/sürüm, runtime'a yapılan oyun uyarlaması ve dağıtım hakkı kaydedilmelidir.
