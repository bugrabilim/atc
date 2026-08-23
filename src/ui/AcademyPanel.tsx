import { ACADEMY_LESSONS, type AcademyAction, type AcademyEvaluation, type AcademyLessonId } from '../engine/academy';

interface AcademyPanelProps {
  lessonId: AcademyLessonId;
  completedLessonIds: AcademyLessonId[];
  evaluation: AcademyEvaluation;
  onAction: (action: AcademyAction) => void;
  onRestart: () => void;
  onNext: () => void;
  onExit: () => void;
}
export function AcademyPanel({ lessonId, completedLessonIds, evaluation, onAction, onRestart, onNext, onExit }: AcademyPanelProps) {
  const lesson = ACADEMY_LESSONS.find((item) => item.id === lessonId)!;
  const isLast = lesson.number === ACADEMY_LESSONS.length;
  return (
    <aside className={`academy-panel${evaluation.complete ? ' is-complete' : ''}`} aria-label={`Academy dersi ${lesson.number}: ${lesson.title}`}>
      <div className="academy-panel__topline">
        <span>ACADEMY · {String(lesson.number).padStart(2, '0')}/{ACADEMY_LESSONS.length}</span>
        <button type="button" onClick={onExit} aria-label="Academy'den çık">ÇIKIŞ ×</button>
      </div>
      <div className="academy-panel__progress" aria-label={`${completedLessonIds.length} ders tamamlandı`}>
        {ACADEMY_LESSONS.map((item) => <i key={item.id} className={completedLessonIds.includes(item.id) || item.id === lessonId && evaluation.complete ? 'is-done' : item.id === lessonId ? 'is-active' : ''} />)}
      </div>
      {evaluation.complete ? (
        <div className="academy-panel__complete">
          <span>✓ DERS TAMAMLANDI</span>
          <h2>{lesson.title}</h2>
          <p>{isLast ? 'Temel Academy tamamlandı. Artık ilk vardiyana hazırsın.' : 'Bir sonraki kısa derste yeni bir kontrol aracını kullanacaksın.'}</p>
          <button type="button" className="academy-panel__primary" onClick={onNext}>{isLast ? 'İSTANBUL VARDİYASINA GEÇ' : 'SONRAKİ DERS →'}</button>
        </div>
      ) : (
        <>
          <span className="academy-panel__duration">{lesson.durationMinutes} DK · UYGULAMALI DERS</span>
          <h2>{lesson.title}</h2>
          <p>{lesson.briefing}</p>
          <strong>{lesson.objective}</strong>
          <small>{evaluation.progressLabel} · {evaluation.hint}</small>
          <div className="academy-panel__actions">
            {evaluation.action ? <button type="button" className="academy-panel__primary" onClick={() => onAction(evaluation.action!)}>{evaluation.action.label}</button> : null}
            <button type="button" onClick={onRestart}>YENİDEN BAŞLAT</button>
          </div>
        </>
      )}
    </aside>
  );
}
