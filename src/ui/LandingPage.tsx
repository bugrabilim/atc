import type { GameScenario } from '../engine/scenario';
import type { ScenarioId } from '../engine/types';

interface LandingPageProps {
  scenarios: GameScenario[];
  selectedScenario: GameScenario;
  unlockedScenarioIds: ScenarioId[];
  scenarioBestScores: Record<string, number>;
  savedSession: boolean;
  onStart: (scenario: GameScenario) => void;
  onResume: () => void;
}

export function LandingPage({ scenarios, selectedScenario, unlockedScenarioIds, scenarioBestScores, savedSession, onStart, onResume }: LandingPageProps) {
  const firstUnlocked = scenarios.find((item) => unlockedScenarioIds.includes(item.id as ScenarioId)) ?? selectedScenario;
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Ana menü">
        <a className="landing-brand" href="#top" aria-label="Airspace Control ana sayfa"><span className="landing-brand__mark">✦</span><span><strong>AIRSPACE CONTROL</strong><small>BY BUMBA GAMES</small></span></a>
        <div className="landing-nav__links"><a href="#experience">Deneyim</a><a href="#airports">Meydanlar</a><a href="#how">Nasıl oynanır?</a></div>
        <button type="button" className="landing-nav__cta" onClick={() => onStart(firstUnlocked)}>ÜCRETSİZ BAŞLA <span>↗</span></button>
      </nav>

      <section id="top" className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy"><span className="landing-kicker"><i /> BUMBA GAMES ORIGINAL · RADAR STRATEGY</span><h1 id="landing-title">Gökyüzünün<br /><em>kontrolü</em><br />sende.</h1><p className="landing-hero__lead">Gerçek zamanlı radar trafiğini yönet. Doğru komutları ver, güvenli aralıkları koru ve kariyer haritanda yeni havalimanlarının kilidini aç.</p><div className="landing-actions">{savedSession ? <button type="button" className="landing-primary" onClick={onResume}>VARDİYAYA DEVAM ET <small>Kayıtlı oturumun hazır</small></button> : null}<button type="button" className={savedSession ? 'landing-secondary' : 'landing-primary'} onClick={() => onStart(firstUnlocked)}>HEMEN OYNA <small>Hesap ve şifre gerekmez</small></button></div><div className="landing-proof"><span>● ŞİFRESİZ GİRİŞ</span><span>● WEB + MOBİL</span><span>● ÜCRETSİZ BAŞLANGIÇ</span></div></div>
        <div className="landing-hero__visual" aria-label="Radar ekranı ön izlemesi"><div className="landing-hero__visual-top"><span>LIVE SCOPE</span><b>IST / 01</b><span className="live-dot">LIVE</span></div><div className="landing-hero__radar" aria-hidden="true"><span className="landing-hero__sweep" /><i /><i /><i /><b>IST</b></div><div className="landing-hero__visual-bottom"><span>TRAFFIC <b>08</b></span><span>SKILL <b>74%</b></span><span>WIND <b>→ 12KT</b></span></div></div>
      </section>

      <section id="experience" className="landing-section landing-experience" aria-labelledby="experience-title"><div className="landing-section__heading"><span className="landing-kicker">NEDEN AIRSPACE CONTROL?</span><h2 id="experience-title">Bir oyundan fazlası.<br /><em>Bir kontrol odası deneyimi.</em></h2></div><div className="landing-feature-grid"><article className="landing-feature"><span className="landing-feature__icon">⌁</span><h3>Radarın başına geç</h3><p>Klasik radar görünümünde yaklaşan trafiği takip et, uçuşları seç ve sezgisel komut paneliyle yönlendir.</p></article><article className="landing-feature"><span className="landing-feature__icon">↗</span><h3>Kararların fark yaratır</h3><p>Baş, irtifa, hız ve pist kararlarını doğru zamanda ver. Güvenli operasyon becerin skoruna yansısın.</p></article><article className="landing-feature"><span className="landing-feature__icon">✦</span><h3>Kariyerini büyüt</h3><p>Her meydanda ustalaş, yeni senaryoları aç ve 52 başarımdan oluşan kariyer koleksiyonunu tamamla.</p></article></div></section>

      <section id="airports" className="landing-section landing-airports" aria-labelledby="airport-title"><div className="landing-section__heading landing-section__heading--row"><div><span className="landing-kicker">CAREER MAP · 08 MEYDAN</span><h2 id="airport-title">İlk vardiyanı seç.</h2></div><p>Skor yaptıkça haritan genişler.<br />Her meydan yeni bir meydan okuma.</p></div><div className="airport-grid">{scenarios.map((scenario, index) => { const unlocked = unlockedScenarioIds.includes(scenario.id as ScenarioId); const score = scenarioBestScores[scenario.id] ?? 0; return <button key={scenario.id} type="button" disabled={!unlocked} className={`airport-card${scenario.id === selectedScenario.id ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} onClick={() => unlocked && onStart(scenario)}><span className="airport-card__number">{String(index + 1).padStart(2, '0')}</span><span className="airport-card__mark" aria-hidden="true">{unlocked ? '◉' : '🔒'}</span><span className="airport-card__body"><strong>{scenario.label}</strong><small>{scenario.briefing}</small></span><span className="airport-card__score">{unlocked ? `REKOR ${score}` : 'SKORLA AÇILIR'}</span></button>; })}</div></section>

      <section id="how" className="landing-section landing-how" aria-labelledby="how-title"><div className="landing-section__heading"><span className="landing-kicker">ÜÇ ADIMDA BAŞLA</span><h2 id="how-title">Kural basit.<br /><em>Ustalık sende.</em></h2></div><div className="landing-steps"><div><b>01</b><h3>Trafiği gör</h3><p>Radar ekranındaki her uçuşun yönünü, irtifasını ve hızını oku.</p></div><div><b>02</b><h3>Komutunu ver</h3><p>Uçağı seç, gerçek ATC komutlarıyla rotasını ve yaklaşmasını yönet.</p></div><div><b>03</b><h3>Güvenli bitir</h3><p>Çakışmaları önle, inişleri tamamla ve bir sonraki meydanın kilidini aç.</p></div></div></section>

      <footer className="landing-footer"><div className="landing-footer__brand"><span className="landing-brand__mark">✦</span><span><strong>BUMBA GAMES</strong><small>PLAY WITH PURPOSE.</small></span></div><div className="landing-footer__meta"><span>AIRSPACE CONTROL © 2026</span><span>ŞİFRESİZ GİRİŞ · LOCAL CAREER SAVE</span><span>WEB · PWA · IOS · ANDROID</span></div></footer>
    </main>
  );
}
