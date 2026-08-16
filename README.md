# İstanbul Radar

Mobil ve masaüstü tarayıcılarda çalışan, klasik radar görünümüne sahip yaklaşma kontrol oyunu.

> Bu proje bir oyundur; gerçek uçuş veya operasyonel ATC kullanımı için tasarlanmamıştır.

## İlk oynanabilir sürüm

- Responsive Canvas radar
- İST/LTFM temalı prototip senaryo
- Dokunarak, fareyle veya uçuş listesinden uçak seçimi
- Klavyede çağrı kodu için `Tab` tamamlama
- Kademeli heading, irtifa ve hız değişimi
- Temel ayırma uyarıları
- PWA manifesti ve çevrimdışı kabuk

## Komutlar

```text
TK1953 HDG 090
TK1953 HDG 270 L
TK1953 FL060
TK1953 ALT 3000
TK1953 SPD 220
```

Çağrı kodu kısaltılabilir. Örneğin aktif trafik içinde tek bir `TK` uçuşu varsa:

```text
TK HDG 180
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

## Veri notu

Mevcut pist yerleşimi ve aktif pistler oynanabilir prototip senaryosudur. Üretim sürümündeki LTFM pist, yaklaşma, SID/STAR ve minimum irtifa verileri güncel Türkiye AIP kaynaklarıyla ayrıca doğrulanacaktır.

