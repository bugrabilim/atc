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
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__radar" aria-hidden="true">
          <span className="landing-hero__sweep" />
          <i /><i /><i />
        </div>
        <div className="landing-hero__copy">
          <span className="landing-kicker">ATC TRAINING NETWORK · GUEST ACCESS</span>
          <h1 id="landing-title">AIRSPACE<br /><em>CONTROL</em></h1>
          <p>Radarın başına geç. Trafiği sırala, güvenli aralıkları koru ve yeni meydanların kilidini aç.</p>
          <div className="landing-actions">
            {savedSession ? <button type="button" className="landing-primary" onClick={onResume}>VARDİYAYA DEVAM ET <small>kayıtlı trafik</small></button> : null}
            <button type="button" className={savedSession ? 'landing-secondary' : 'landing-primary'} onClick={() => onStart(selectedScenario)}>MİSAFİR OLARAK BAŞLA <small>şifre veya hesap gerekmez</small></button>
          </div>
        </div>
      </section>

      <section className="airport-selector" aria-labelledby="airport-title">
        <div className="airport-selector__heading">
          <div><span className="landing-kicker">CAREER MAP</span><h2 id="airport-title">MEYDAN SEÇ</h2></div>
          <span className="airport-selector__hint">Skor yaptıkça yeni meydanlar açılır</span>
        </div>
        <div className="airport-grid">
          {scenarios.map((scenario, index) => {
            const unlocked = unlockedScenarioIds.includes(scenario.id as ScenarioId);
            const score = scenarioBestScores[scenario.id] ?? 0;
            return (
              <button key={scenario.id} type="button" disabled={!unlocked} className={`airport-card${scenario.id === selectedScenario.id ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} onClick={() => unlocked && onStart(scenario)}>
                <span className="airport-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="airport-card__mark" aria-hidden="true">{unlocked ? '◉' : '🔒'}</span>
                <span className="airport-card__body"><strong>{scenario.label}</strong><small>{scenario.briefing}</small></span>
                <span className="airport-card__score">{unlocked ? `REKOR ${score}` : 'KİLİTLİ'}</span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="landing-footer"><span>ŞİFRESİZ GİRİŞ · LOCAL CAREER SAVE</span><span>WEB · PWA · IOS · ANDROID</span></footer>
    </main>
  );
}
