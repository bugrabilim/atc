import type { AirportOperationsProfile, FlowConfiguration, ScenarioId } from './types';

export type BoundaryId = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export interface AirportOperationsSource {
  publisher: string;
  title: string;
  url: string;
  purpose: string;
  accessedOn: string;
}

export interface ProcedureFixTemplate {
  id: string;
  /** Tactical bearing/distance from the airport. Chart order is retained. */
  bearing: number;
  distanceNm: number;
  minimumAltitudeFt?: number;
  maximumAltitudeFt?: number;
  maximumSpeedKt?: number;
}

export interface PublishedProcedureTemplate {
  id: string;
  kind: 'arrival' | 'departure';
  compatibleRunwayIds: string[];
  fixes: ProcedureFixTemplate[];
}

export interface AirportOperationsPack extends AirportOperationsProfile {
  airportId: Extract<ScenarioId, 'ist' | 'lhr' | 'lax' | 'jfk' | 'atl'>;
  briefing: string;
  focus: string;
  boundaryLabels: Record<BoundaryId, string>;
  procedures: PublishedProcedureTemplate[];
  flows: FlowConfiguration[];
  sources: AirportOperationsSource[];
  /** Explicit product boundary: source facts are adapted into game geometry. */
  gameOnlyNotice: string;
}

const ACCESSED_ON = '2026-08-24';
const PACK_VERSION = '2026.08.2';

const ist: AirportOperationsPack = {
  airportId: 'ist',
  packVersion: PACK_VERSION,
  referenceCycle: 'DHMI operational snapshot · 2026-08',
  strategyLabel: 'Üçlü bağımsız pist bankası',
  briefing: 'İstanbul Yaklaşma: kuzey akışındaki sıralamayı üç bağımsız geliş pistine büyüt; kıyı rüzgâr değişiminde tek piste düşen kapasiteyi yönet.',
  focus: 'Üç bağımsız geliş akışı, paralel pist dengeleme ve Black Sea rüzgâr değişimi',
  boundaryLabels: { NORTH: 'BLACK SEA', EAST: 'ANATOLIA', SOUTH: 'MARMARA', WEST: 'THRACE' },
  procedures: [
    {
      id: 'RIXEN1W', kind: 'arrival', compatibleRunwayIds: ['16R', '17L', '18'],
      fixes: [
        { id: 'RIXEN', bearing: 1, distanceNm: 40, minimumAltitudeFt: 14000, maximumAltitudeFt: 16000, maximumSpeedKt: 250 },
        { id: 'FM966', bearing: 24, distanceNm: 36, minimumAltitudeFt: 14000, maximumAltitudeFt: 16000, maximumSpeedKt: 250 },
        { id: 'FM967', bearing: 42, distanceNm: 31, minimumAltitudeFt: 14000, maximumAltitudeFt: 16000, maximumSpeedKt: 250 },
        { id: 'FM918', bearing: 54, distanceNm: 25, maximumAltitudeFt: 12000, maximumSpeedKt: 230 },
        { id: 'FM917', bearing: 42, distanceNm: 20, maximumAltitudeFt: 12000, maximumSpeedKt: 230 },
        { id: 'FM916', bearing: 24, distanceNm: 16, maximumAltitudeFt: 10000, maximumSpeedKt: 230 },
        { id: 'FM914', bearing: 8, distanceNm: 13, maximumAltitudeFt: 7000, maximumSpeedKt: 220 },
        { id: 'ULQAL', bearing: 4, distanceNm: 10, minimumAltitudeFt: 6000, maximumAltitudeFt: 7000, maximumSpeedKt: 220 },
      ],
    },
    {
      id: 'VICEN1S', kind: 'departure', compatibleRunwayIds: ['36'],
      fixes: [
        { id: 'FM032', bearing: 4, distanceNm: 8, minimumAltitudeFt: 2200, maximumSpeedKt: 250 },
        { id: 'FM033', bearing: 18, distanceNm: 14 }, { id: 'FM034', bearing: 22, distanceNm: 20 },
        { id: 'FILFU', bearing: 165, distanceNm: 15 }, { id: 'FM043', bearing: 172, distanceNm: 23 },
        { id: 'ROCHE', bearing: 190, distanceNm: 31 }, { id: 'NENVI', bearing: 142, distanceNm: 35 },
        { id: 'IBSIN', bearing: 126, distanceNm: 38 }, { id: 'LECKI', bearing: 119, distanceNm: 40 },
        { id: 'VICEN', bearing: 110, distanceNm: 42 },
      ],
    },
  ],
  trafficPattern: ['arrival', 'arrival', 'arrival', 'departure', 'arrival', 'departure'],
  heavyArrivalEvery: 4,
  procedureReferences: ['RIXEN 1W RNAV STAR', 'VICEN 1S RNAV SID', 'ILS-aligned finals for every runway end'],
  flows: [
    { id: 'north-parallel', label: 'KUZEY · PARALEL', arrivalRunwayIds: ['34L', '35R'], departureRunwayIds: ['36'], windDirection: 350, windSpeedKt: 10, visibilityNm: 12, qnh: 1016 },
    { id: 'north-single', label: 'KUZEY · TEK PİST', arrivalRunwayIds: ['34L'], departureRunwayIds: ['36'], windDirection: 340, windSpeedKt: 18, visibilityNm: 7, qnh: 1009 },
    { id: 'north-lowvis', label: 'KUZEY · DÜŞÜK GÖRÜŞ', arrivalRunwayIds: ['35R'], departureRunwayIds: ['36'], windDirection: 2, windSpeedKt: 21, visibilityNm: 4, qnh: 1003 },
    { id: 'south-triple', label: 'GÜNEY · ÜÇLÜ BAĞIMSIZ', arrivalRunwayIds: ['16R', '17L', '18'], departureRunwayIds: ['16L', '17R'], windDirection: 175, windSpeedKt: 11, visibilityNm: 11, qnh: 1012 },
  ],
  disruption: {
    id: 'black-sea-wind-shift', triggerSeconds: 225, durationSeconds: 175,
    reducedFlowId: 'north-single', recoveryFlowId: 'south-triple',
    message: 'OPERASYON DEĞİŞİKLİĞİ · BLACK SEA rüzgâr değişimi · tek geliş pistine geç, paralel sıraları birleştir',
    recoveryMessage: 'AKIŞ TOPARLANDI · üçlü bağımsız güney bankası açıldı · gelişleri üç piste yeniden dağıt',
  },
  sources: [
    { publisher: 'DHMI', title: 'LTFM STAR-14 / RIXEN 1W, AIRAC AMDT 03/26', url: 'https://www.dhmi.gov.tr/AIPDocuments/LT_AD_2_LTFM_STAR_14_en.pdf', purpose: 'Published waypoint order and crossing constraints for RIXEN 1W', accessedOn: ACCESSED_ON },
    { publisher: 'DHMI', title: 'LTFM SID-8A / VICEN 1S, AIRAC AMDT 03/26', url: 'https://www.dhmi.gov.tr/AIPDocuments/LT_AD_2_LTFM_SID_08_A_en.pdf', purpose: 'Published waypoint order and initial constraints for VICEN 1S', accessedOn: ACCESSED_ON },
    { publisher: 'DHMI', title: 'Triple runway operations have been in service for one year', url: 'https://www.dhmi.gov.tr/Sayfalar/Haber/triple-runway-operations-have-been-in-service-for-one-year.aspx', purpose: 'Three simultaneous independent arrival/departure operating concept', accessedOn: ACCESSED_ON },
    { publisher: 'DHMI', title: 'İstanbul Airport general information', url: 'https://www.dhmi.gov.tr/sayfalar/havalimani/istanbul/GenelBilgiler.aspx', purpose: 'Airport identity and official context', accessedOn: ACCESSED_ON },
  ],
  gameOnlyNotice: 'Boundary names, timing and traffic cadence are gameplay adaptations; not for navigation.',
};

const lhr: AirportOperationsPack = {
  airportId: 'lhr',
  packVersion: PACK_VERSION,
  referenceCycle: 'Heathrow/NATS snapshot · 2026-08-06',
  strategyLabel: 'Dört stack birleşimi ve pist alternasyonu',
  briefing: 'Heathrow Director: dört bekleme yığınını tek geliş pistinde birleştir, paralel pistte kalkışları koru ve alternasyonda sırayı kaybetmeden yeniden vektörle.',
  focus: 'Bovingdon, Lambourne, Biggin ve Ockham birleşimi ile batı/doğu pist alternasyonu',
  boundaryLabels: { NORTH: 'BOVINGDON', EAST: 'LAMBOURNE', SOUTH: 'BIGGIN', WEST: 'OCKHAM' },
  procedures: [
    { id: 'BNN-STACK', kind: 'arrival', compatibleRunwayIds: ['27L', '27R', '09L'], fixes: [{ id: 'BNN', bearing: 330, distanceNm: 22, minimumAltitudeFt: 7000, maximumAltitudeFt: 16000, maximumSpeedKt: 220 }] },
    { id: 'LAM-STACK', kind: 'arrival', compatibleRunwayIds: ['27L', '27R', '09L'], fixes: [{ id: 'LAM', bearing: 70, distanceNm: 22, minimumAltitudeFt: 7000, maximumAltitudeFt: 16000, maximumSpeedKt: 220 }] },
    { id: 'BIG-STACK', kind: 'arrival', compatibleRunwayIds: ['27L', '27R', '09L'], fixes: [{ id: 'BIG', bearing: 145, distanceNm: 23, minimumAltitudeFt: 7000, maximumAltitudeFt: 16000, maximumSpeedKt: 220 }] },
    { id: 'OCK-STACK', kind: 'arrival', compatibleRunwayIds: ['27L', '27R', '09L'], fixes: [{ id: 'OCK', bearing: 225, distanceNm: 20, minimumAltitudeFt: 7000, maximumAltitudeFt: 16000, maximumSpeedKt: 220 }] },
  ],
  trafficPattern: ['arrival', 'arrival', 'arrival', 'departure', 'arrival'],
  heavyArrivalEvery: 3,
  procedureReferences: ['BNN, LAM, BIG and OCK holding stacks', 'ILS-aligned game finals from approximately 13 NM'],
  flows: [
    { id: 'lhr-primary', label: 'BATI · ALTERNASYON A', arrivalRunwayIds: ['27L'], departureRunwayIds: ['27R'], windDirection: 270, windSpeedKt: 10, visibilityNm: 12, qnh: 1015 },
    { id: 'lhr-reverse', label: 'BATI · ALTERNASYON B', arrivalRunwayIds: ['27R'], departureRunwayIds: ['27L'], windDirection: 265, windSpeedKt: 12, visibilityNm: 10, qnh: 1012 },
    { id: 'lhr-lowvis', label: 'BATI · DÜŞÜK GÖRÜŞ', arrivalRunwayIds: ['27L'], departureRunwayIds: ['27R'], windDirection: 275, windSpeedKt: 17, visibilityNm: 4, qnh: 1005 },
    { id: 'lhr-easterly', label: 'DOĞU · 09 OPERASYONU', arrivalRunwayIds: ['09L'], departureRunwayIds: ['09R'], windDirection: 90, windSpeedKt: 11, visibilityNm: 9, qnh: 1009 },
  ],
  disruption: {
    id: 'runway-alternation', triggerSeconds: 210, durationSeconds: 165,
    reducedFlowId: 'lhr-reverse', recoveryFlowId: 'lhr-primary',
    message: 'OPERASYON DEĞİŞİKLİĞİ · HEATHROW pist alternasyonu · gelişleri 27R sırasına taşı, dört stack arasındaki boşlukları koru',
    recoveryMessage: 'AKIŞ TOPARLANDI · 27L geliş düzeni yeniden aktif · stack sırasını kapasiteye göre çöz',
  },
  sources: [
    { publisher: 'Heathrow Airport', title: 'Arrival flight paths', url: 'https://www.heathrow.com/company/local-community/noise/operations/arrival-flight-paths', purpose: 'Four holding stacks, approximate stack levels and final-vector concept', accessedOn: ACCESSED_ON },
    { publisher: 'Heathrow Airport', title: 'Easterly alternation', url: 'https://www.heathrow.com/company/local-community/noise/operations/easterly-alternation', purpose: 'Runway direction and alternation operating context', accessedOn: ACCESSED_ON },
    { publisher: 'NATS', title: 'Aeronautical chart dataset checklist', url: 'https://nats-uk.ead-it.com/cms-nats/opencms/en/Publications/digital-datasets/Checklists/Dataset_Checklist_2026_08_06.html', purpose: 'Current UK chart-cycle reference', accessedOn: ACCESSED_ON },
  ],
  gameOnlyNotice: 'Stack positions and transitions are simplified into a 42 NM tactical sector; not for navigation.',
};

const lax: AirportOperationsPack = {
  airportId: 'lax',
  packVersion: PACK_VERSION,
  referenceCycle: 'FAA 2608 / LAWA snapshot · 2026-08',
  strategyLabel: 'Kuzey/güney kompleks dengelemesi',
  briefing: 'Los Angeles Yaklaşma: batı geliş bankasını kuzey ve güney pist komplekslerine böl; kuzey kompleksi bakım için kapandığında güney kapasitesini koru.',
  focus: 'İki pist kompleksi, okyanus üstü ters akış ve kuzey kompleks bakım kapanışı',
  boundaryLabels: { NORTH: 'NORTH FEED', EAST: 'DESERT FEED', SOUTH: 'SOUTH FEED', WEST: 'OCEAN FEED' },
  procedures: [
    { id: 'IRNMN2', kind: 'arrival', compatibleRunwayIds: ['24R', '25L'], fixes: [
      { id: 'IRNMN', bearing: 310, distanceNm: 40, minimumAltitudeFt: 12000, maximumSpeedKt: 250 },
      { id: 'SYMON', bearing: 300, distanceNm: 33, minimumAltitudeFt: 12000 },
    ] },
    { id: 'RYDRR2', kind: 'arrival', compatibleRunwayIds: ['24R', '25L'], fixes: [
      { id: 'RYDRR', bearing: 75, distanceNm: 40, minimumAltitudeFt: 11000, maximumSpeedKt: 250 },
      { id: 'KEVVI', bearing: 80, distanceNm: 33, minimumAltitudeFt: 10000 },
      { id: 'BAYST', bearing: 83, distanceNm: 27, minimumAltitudeFt: 9000, maximumSpeedKt: 240 },
      { id: 'JUUSE', bearing: 88, distanceNm: 20, minimumAltitudeFt: 8000, maximumAltitudeFt: 9000 },
      { id: 'CLIFY', bearing: 92, distanceNm: 15, minimumAltitudeFt: 7000, maximumAltitudeFt: 8000, maximumSpeedKt: 210 },
      { id: 'GADDO', bearing: 95, distanceNm: 11, minimumAltitudeFt: 6000 },
    ] },
    { id: 'WAYVE1', kind: 'arrival', compatibleRunwayIds: ['24R', '25L'], fixes: [
      { id: 'WAYVE', bearing: 350, distanceNm: 40, minimumAltitudeFt: 12000, maximumSpeedKt: 250 },
      { id: 'SAUGS', bearing: 340, distanceNm: 31 }, { id: 'KIMMO', bearing: 325, distanceNm: 23 },
      { id: 'UPDOC', bearing: 305, distanceNm: 15, maximumSpeedKt: 220 },
    ] },
  ],
  trafficPattern: ['arrival', 'arrival', 'departure', 'departure', 'arrival'],
  heavyArrivalEvery: 4,
  procedureReferences: ['IRNMN TWO', 'RYDRR TWO RNAV', 'WAYVE ONE RNAV', 'FAA d-TPP 2608 approach inventory'],
  flows: [
    { id: 'lax-primary', label: 'BATI · İKİ KOMPLEKS', arrivalRunwayIds: ['24R', '25L'], departureRunwayIds: ['24L', '25R'], windDirection: 255, windSpeedKt: 11, visibilityNm: 14, qnh: 1014 },
    { id: 'lax-reverse', label: 'DOĞU · OKYANUS ÜSTÜ', arrivalRunwayIds: ['6R', '7R'], departureRunwayIds: ['6L', '7L'], windDirection: 80, windSpeedKt: 8, visibilityNm: 10, qnh: 1010 },
    { id: 'lax-lowvis', label: 'BATI · GÜNEY KOMPLEKS', arrivalRunwayIds: ['25L'], departureRunwayIds: ['25R'], windDirection: 250, windSpeedKt: 16, visibilityNm: 4, qnh: 1007 },
    { id: 'lax-south-complex', label: 'BATI · KUZEY BAKIMDA', arrivalRunwayIds: ['25L'], departureRunwayIds: ['25R'], windDirection: 260, windSpeedKt: 9, visibilityNm: 11, qnh: 1012 },
  ],
  disruption: {
    id: 'north-complex-maintenance', triggerSeconds: 240, durationSeconds: 180,
    reducedFlowId: 'lax-south-complex', recoveryFlowId: 'lax-primary',
    message: 'OPERASYON DEĞİŞİKLİĞİ · LAX kuzey kompleks bakımı · tüm geliş/kalkış talebini güney kompleksinde sırala',
    recoveryMessage: 'AKIŞ TOPARLANDI · kuzey kompleksi yeniden kullanılabilir · 24R/25L geliş yükünü dengele',
  },
  sources: [
    { publisher: 'FAA', title: 'IRNMN TWO arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00237IRNMN_C.PDF', purpose: 'Published arrival route and crossing constraints', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'RYDRR TWO arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00237RYDRR_C.PDF', purpose: 'Published arrival route and crossing constraints', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'WAYVE ONE arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00237WAYVE.PDF', purpose: 'Published arrival route sequence', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'Digital Terminal Procedures Publication', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/', purpose: 'Current 2608 chart inventory and runway approaches', accessedOn: ACCESSED_ON },
    { publisher: 'Los Angeles World Airports', title: 'Runway 6R-24L closure advisory', url: 'https://www.lawa.org/news-releases/2025/runway-6r-24l-135-hour-closure-routine-maintenance-activities-june-28-2025-0030', purpose: 'Westerly operation and south-complex-only disruption pattern', accessedOn: ACCESSED_ON },
  ],
  gameOnlyNotice: 'Complex use and closure timing are compressed for play; not for navigation. Always consult current charts/NOTAMs in real operations.',
};

const jfk: AirportOperationsPack = {
  airportId: 'jfk',
  packVersion: PACK_VERSION,
  referenceCycle: 'FAA d-TPP 2608 · 2026-08-06',
  strategyLabel: 'Kesişen pist akışı yönetimi',
  briefing: 'Kennedy Yaklaşma: dört adlandırılmış geliş akışını birleştirirken 22/31 kesişen pist geometrisini koru; düşük görüşte kaybolan çoklu akış kapasitesini yönet.',
  focus: 'CAMRN, PARCH, PAWLN ve PUCKY bankaları ile kesişen akış sıralaması',
  boundaryLabels: { NORTH: 'PARCH', EAST: 'PAWLN', SOUTH: 'CAMRN', WEST: 'PUCKY' },
  procedures: [
    { id: 'CAMRN5', kind: 'arrival', compatibleRunwayIds: ['22L', '22R', '31R'], fixes: [
      { id: 'SIE', bearing: 205, distanceNm: 40, minimumAltitudeFt: 18000 },
      { id: 'CAMRN', bearing: 210, distanceNm: 24, minimumAltitudeFt: 11000, maximumSpeedKt: 250 },
    ] },
    { id: 'PARCH4', kind: 'arrival', compatibleRunwayIds: ['04L', '04R', '13L', '13R', '22L', '22R', '31L', '31R'], fixes: [
      { id: 'PARCH', bearing: 50, distanceNm: 40, minimumAltitudeFt: 12000, maximumSpeedKt: 250 },
      { id: 'CCC', bearing: 60, distanceNm: 29 }, { id: 'ROBER', bearing: 45, distanceNm: 20 },
      { id: 'CRAIL', bearing: 28, distanceNm: 13 },
    ] },
    { id: 'PAWLN1', kind: 'arrival', compatibleRunwayIds: ['04L', '04R', '22L', '22R'], fixes: [{ id: 'PAWLN', bearing: 82, distanceNm: 38, minimumAltitudeFt: 12000, maximumSpeedKt: 250 }] },
    { id: 'PUCKY1', kind: 'arrival', compatibleRunwayIds: ['04L', '04R', '22L', '22R', '31R'], fixes: [{ id: 'PUCKY', bearing: 275, distanceNm: 38, minimumAltitudeFt: 12000, maximumSpeedKt: 250 }] },
  ],
  trafficPattern: ['arrival', 'arrival', 'arrival', 'departure', 'departure'],
  heavyArrivalEvery: 3,
  procedureReferences: ['CAMRN FIVE', 'PARCH FOUR RNAV', 'PAWLN ONE RNAV', 'PUCKY ONE RNAV', 'FAA ILS/LOC runway inventory'],
  flows: [
    { id: 'jfk-primary', label: 'GÜNEYBATI · 22/31 KESİŞİM', arrivalRunwayIds: ['22L', '22R'], departureRunwayIds: ['31L'], windDirection: 225, windSpeedKt: 12, visibilityNm: 11, qnh: 1013 },
    { id: 'jfk-reverse', label: 'KUZEYBATI · 31 BANKASI', arrivalRunwayIds: ['31R'], departureRunwayIds: ['31L'], windDirection: 315, windSpeedKt: 14, visibilityNm: 9, qnh: 1009 },
    { id: 'jfk-lowvis', label: 'GÜNEYBATI · TEK GELİŞ', arrivalRunwayIds: ['22L'], departureRunwayIds: ['31L'], windDirection: 220, windSpeedKt: 18, visibilityNm: 4, qnh: 1004 },
    { id: 'jfk-northeast', label: 'KUZEYDOĞU · 04 BANKASI', arrivalRunwayIds: ['04L', '04R'], departureRunwayIds: ['13R'], windDirection: 45, windSpeedKt: 10, visibilityNm: 10, qnh: 1011 },
  ],
  disruption: {
    id: 'crossing-runway-protection', triggerSeconds: 230, durationSeconds: 170,
    reducedFlowId: 'jfk-lowvis', recoveryFlowId: 'jfk-primary',
    message: 'OPERASYON DEĞİŞİKLİĞİ · JFK düşük görüş · tek geliş pistinde ağır jet aralığını ve 31L kalkış penceresini koru',
    recoveryMessage: 'AKIŞ TOPARLANDI · 22L/22R geliş bankası yeniden açıldı · CAMRN/PARCH/PAWLN/PUCKY sırasını böl',
  },
  sources: [
    { publisher: 'FAA', title: 'CAMRN FIVE arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00610CAMRN.PDF', purpose: 'Published CAMRN route and crossing constraints', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'PARCH FOUR arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00610PARCH.PDF', purpose: 'Published PARCH route and runway transitions', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'JFK terminal procedures, cycle 2608', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=11&sort=state&volume=NE-2', purpose: 'Current STAR names and ILS/LOC runway inventory', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'Digital Terminal Procedures Publication', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/', purpose: 'Cycle/effective-date provenance', accessedOn: ACCESSED_ON },
  ],
  gameOnlyNotice: 'Named feeds reference public FAA chart names but their positions/routes are deliberately simplified; not for navigation.',
};

const atl: AirportOperationsPack = {
  airportId: 'atl',
  packVersion: PACK_VERSION,
  referenceCycle: 'FAA d-TPP 2608 · 2026-08-06',
  strategyLabel: 'Beş paralel pistte yüksek kapasite',
  briefing: 'Atlanta Yaklaşma: beş paralel pistte yüksek kapasiteli doğu/batı bankasını sürdür; PRM tarzı düşük görüş aralığında hız kontrolüyle tek geliş hattına geç.',
  focus: 'Beş paralel pist hattı, dengeli geliş/kalkış ve yüksek hacimli doğu/batı dönüşü',
  boundaryLabels: { NORTH: 'GNDLF FEED', EAST: 'SITTH FEED', SOUTH: 'SOUTH FEED', WEST: 'WEST FEED' },
  procedures: [
    { id: 'SITTH3-09', kind: 'arrival', compatibleRunwayIds: ['09L', '09R', '10'], fixes: [
      { id: 'SITTH', bearing: 95, distanceNm: 40, minimumAltitudeFt: 14000 },
      { id: 'TIZZY', bearing: 92, distanceNm: 31, minimumAltitudeFt: 12000, maximumAltitudeFt: 12000 },
      { id: 'FRYES', bearing: 90, distanceNm: 24, minimumAltitudeFt: 12000, maximumAltitudeFt: 12000 },
      { id: 'REMAC', bearing: 88, distanceNm: 17, minimumAltitudeFt: 7000 },
      { id: 'DACTL', bearing: 87, distanceNm: 12 }, { id: 'STUMP', bearing: 86, distanceNm: 8, maximumAltitudeFt: 4000 },
    ] },
    { id: 'SITTH3-08', kind: 'arrival', compatibleRunwayIds: ['08L', '08R'], fixes: [
      { id: 'SITTH', bearing: 95, distanceNm: 40, minimumAltitudeFt: 14000 },
      { id: 'TIZZY', bearing: 92, distanceNm: 31, minimumAltitudeFt: 12000, maximumAltitudeFt: 12000 },
      { id: 'GAASS', bearing: 89, distanceNm: 24, minimumAltitudeFt: 12000, maximumAltitudeFt: 12000 },
      { id: 'KLOWD', bearing: 87, distanceNm: 19 }, { id: 'KUNFU', bearing: 86, distanceNm: 14, minimumAltitudeFt: 7000 },
      { id: 'TRAPE', bearing: 85, distanceNm: 10 }, { id: 'SNEVE', bearing: 84, distanceNm: 7, maximumAltitudeFt: 5000 },
    ] },
    { id: 'GNDLF3', kind: 'arrival', compatibleRunwayIds: ['26L', '27L', '28'], fixes: [
      { id: 'GNDLF', bearing: 350, distanceNm: 40, minimumAltitudeFt: 11000 },
      { id: 'PAYTN', bearing: 345, distanceNm: 29 }, { id: 'OCNNR', bearing: 330, distanceNm: 21 },
      { id: 'DAWWN', bearing: 315, distanceNm: 14, maximumSpeedKt: 240 },
    ] },
  ],
  trafficPattern: ['arrival', 'departure', 'arrival', 'departure'],
  heavyArrivalEvery: 6,
  procedureReferences: ['GNDLF THREE RNAV', 'SITTH THREE RNAV', 'HAALO THREE RNAV', 'FAA ILS/PRM approach inventory'],
  flows: [
    { id: 'atl-primary', label: 'BATI · ÜÇLÜ GELİŞ', arrivalRunwayIds: ['26L', '27L', '28'], departureRunwayIds: ['26R', '27R'], windDirection: 270, windSpeedKt: 10, visibilityNm: 13, qnh: 1015 },
    { id: 'atl-reverse', label: 'DOĞU · ÜÇLÜ GELİŞ', arrivalRunwayIds: ['08R', '09R', '10'], departureRunwayIds: ['08L', '09L'], windDirection: 90, windSpeedKt: 12, visibilityNm: 11, qnh: 1011 },
    { id: 'atl-lowvis', label: 'BATI · TEK GELİŞ', arrivalRunwayIds: ['27L'], departureRunwayIds: ['27R'], windDirection: 265, windSpeedKt: 17, visibilityNm: 4, qnh: 1005 },
    { id: 'atl-prm', label: 'BATI · PRM ARALIĞI', arrivalRunwayIds: ['26L', '27L', '28'], departureRunwayIds: ['26R', '27R'], windDirection: 275, windSpeedKt: 14, visibilityNm: 7, qnh: 1008 },
  ],
  disruption: {
    id: 'prm-spacing-interval', triggerSeconds: 250, durationSeconds: 160,
    reducedFlowId: 'atl-lowvis', recoveryFlowId: 'atl-primary',
    message: 'OPERASYON DEĞİŞİKLİĞİ · ATL düşük görüş aralığı · geliş bankasını 27L üzerinde birleştir, kalkış pencerelerini koru',
    recoveryMessage: 'AKIŞ TOPARLANDI · üç paralel geliş hattı yeniden kullanılabilir · yükü 26L/27L/28 arasında dengele',
  },
  sources: [
    { publisher: 'FAA', title: 'SITTH THREE arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00026SITTH_C.PDF', purpose: 'Published east-flow runway transitions and crossing constraints', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'GNDLF THREE arrival, cycle 2608', url: 'https://aeronav.faa.gov/d-tpp/2608/00026GNDLF.PDF', purpose: 'Published west-flow arrival route', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'Atlanta terminal procedures, cycle 2608', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=6&sort=proc&volume=SE-4', purpose: 'Current GNDLF/HAALO procedures and airport chart inventory', accessedOn: ACCESSED_ON },
    { publisher: 'FAA', title: 'Atlanta terminal procedures — SITTH and ILS entries', url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/?cycle=2608&dir=asc&page=4&sort=flag&volume=SE-4', purpose: 'Current SITTH arrival and ILS runway inventory', accessedOn: ACCESSED_ON },
  ],
  gameOnlyNotice: 'PRM timing, feeds and tactical geometry are gameplay abstractions; not for navigation.',
};

export const FLAGSHIP_AIRPORT_OPERATIONS = [ist, lhr, lax, jfk, atl] as const;

export const airportOperationsById = new Map<ScenarioId, AirportOperationsPack>(
  FLAGSHIP_AIRPORT_OPERATIONS.map((pack) => [pack.airportId, pack]),
);
