# Airspace Control

Mobil ve masaüstü tarayıcılarda çalışan, klasik radar görünümüne sahip yaklaşma kontrol oyunu.

> Bu proje bir oyundur; gerçek uçuş veya operasyonel ATC kullanımı için tasarlanmamıştır.

## İlk oynanabilir sürüm

- Responsive Canvas radar
- Kurgusal, genişletilebilir yaklaşma kontrol senaryosu
- Dokunarak, fareyle veya uçuş listesinden uçak seçimi
- Klavyede çağrı kodu için `Tab` tamamlama
- Kademeli heading, irtifa ve hız değişimi
- Temel ayırma uyarıları
- PWA manifesti ve çevrimdışı kabuk

## Komutlar

```text
AR101 HDG 090
AR101 HDG 270 L
AR101 FL060
AR101 ALT 3000
AR101 SPD 220
```

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

## Veri notu

Pist yerleşimi, prosedürler ve çağrı kodları tamamen kurgusaldır. Oyun gerçek uçuş operasyonu için kullanılmaz.
