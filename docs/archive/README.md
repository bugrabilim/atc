# ATC tarihsel arşivi

Bu klasör, güncel uygulama kaynak kodu olmayan fakat proje gelişimini ve teslim
kanıtlarını oluşturan benzersiz dosyaları saklar. Uygulama bu dosyaları import
etmez ve Vite üretim paketine dahil etmez.

## 2026-08 paketi

[`2026-08/`](./2026-08/) içinde şunlar bulunur:

- 10 Ağustos ilk İstanbul MVP ZIP'i;
- 16 Ağustos ilk oynanabilir React kaynak ZIP'i;
- 16 Ağustos bağımsız demo ve faz 2 HTML dosyaları;
- 22 Ağustos mobil QA ekran görüntüsü;
- 26 Ağustos 26 sayfalık Word proje devri, üretim betiği ve erişilebilirlik
  raporu;
- tüm dosyalar için SHA-256 manifesti.

Dosya kökeni, boyutu, checksum'u ve arşiv dışında bırakılan kopyalar için
[`../SOURCE_INVENTORY.md`](../SOURCE_INVENTORY.md) kanonik kayıttır.

`ATC_Master_Handoff_builder_2026-08-26.py` tarihsel üretim kaynağıdır; özgün
çalışma ortamının mutlak yollarını ve o tarihteki içerik snapshot'ını taşır.
Güncel devir belgesi üretmek için doğrudan çalıştırılmamalıdır.

Checksum doğrulaması:

```bash
cd docs/archive/2026-08
sha256sum -c SHA256SUMS
```
