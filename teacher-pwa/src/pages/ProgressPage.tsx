import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getJson } from '../lib/http-client';
import './ProgressPage.css';

interface Student { id: string; code: string; name?: string | null; sessionCount?: number; lastSessionAt?: string }
interface Session { id: string; startedAt: string; completedAt: string | null }
interface Attempt { attemptNumber: number; letter: string; isCorrect: boolean }
type Result = 'first_attempt' | 'second_attempt' | 'incorrect' | 'no_answer';
interface Question { chapterRefId: string; chapterTitle: string; questionNumber: number; questionType: string; questionText: string; correctLetter: string; correctOptionText: string; attempts: Attempt[]; result: Result }
interface Chapter { chapterRefId: string; title: string; correct: number; total: number; questions: { questionNumber: number; result: Result }[] }
interface Detail {
  student: { id: string; code: string; name?: string | null };
  session: { id: string; startedAt: string; completedAt: string | null };
  summary: { totalQuestions: number; correctTotal: number; correctFirstAttempt: number; correctSecondAttempt: number; toReinforce: number };
  chapters: Chapter[]; questions: Question[]; suggestion: string | null;
}

const date = (value: string) => new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const resultLabel: Record<Result, string> = { first_attempt: '1.er Intento', second_attempt: '2.º Intento', incorrect: 'Reforzar', no_answer: 'Sin respuesta' };
// En los bloques por capítulo la captura dice "Incorrecta"; en la tabla, "Reforzar"
const blockLabel: Record<Result, string> = { ...resultLabel, incorrect: 'Incorrecta' };
const resultClass: Record<Result, string> = { first_attempt: 'first', second_attempt: 'second', incorrect: 'reinforce', no_answer: 'reinforce' };

export function ProgressPage() {
  const [params, setParams] = useSearchParams();
  const studentId = params.get('studentId') ?? '';
  const sessionId = params.get('sessionId') ?? '';
  const [students, setStudents] = useState<Student[] | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(false);
  const [studentsError, setStudentsError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<Student[]>('/students').then((value) => { if (active) setStudents(value); }).catch(() => { if (active) setStudentsError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!studentId) { setSessions([]); setDetail(null); return; }
    let active = true;
    setLoadingSessions(true); setLoadingDetail(false); setDetail(null); setError(false);
    getJson<Session[]>(`/students/${encodeURIComponent(studentId)}/sessions`).then((value) => {
      if (!active) return;
      setSessions(value); setLoadingSessions(false);
      if (!value.length) return;
      const chosen = value.some((session) => session.id === sessionId) ? sessionId : value[0].id;
      if (chosen !== sessionId) setParams({ studentId, sessionId: chosen }, { replace: true });
    }).catch(() => { if (active) { setLoadingSessions(false); setError(true); } });
    return () => { active = false; };
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !sessionId || loadingSessions) return;
    let active = true;
    setLoadingDetail(true); setDetail(null); setError(false);
    getJson<Detail>(`/students/${encodeURIComponent(studentId)}/progress-detail?sessionId=${encodeURIComponent(sessionId)}`)
      .then((value) => { if (active) { setDetail(value); setLoadingDetail(false); } })
      .catch(() => { if (active) { setLoadingDetail(false); setError(true); } });
    return () => { active = false; };
  }, [studentId, sessionId, loadingSessions]);

  const selectedStudent = students?.find((student) => student.id === studentId);
  const changeStudent = (value: string) => setParams(value ? { studentId: value } : {});
  const changeSession = (value: string) => setParams(value ? { studentId, sessionId: value } : { studentId });

  return <main className="progress-page">
    <header className="progress-heading">
      <div><p className="eyebrow">PORTAL DOCENTE · STORYSCAPE</p><h1>Progreso del estudiante</h1><p className="subtitle">Resultados de las preguntas de comprensión de <em>El Principito</em> (capítulos 1 y 2).</p></div>
    </header>
    {students === null && !studentsError && <p className="state" role="status">Cargando estudiantes…</p>}
    {studentsError && <p className="state error" role="alert">No se pudieron cargar los estudiantes. Intenta nuevamente.</p>}
    {students?.length === 0 && <p className="state">No hay estudiantes disponibles.</p>}
    {!!students?.length && <>
      <section className="student-banner" aria-label="Estudiante seleccionado">
        <div className="book-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 3.5h14v17H5zM8 7h8M8 10h8" /></svg></div>
        <div className="student-ident"><p className="eyebrow">ESTUDIANTE SELECCIONADO</p>
          {detail?.student.name || selectedStudent?.name ? <><h2>{detail?.student.name || selectedStudent?.name}</h2><p className="student-code">{detail?.student.code || selectedStudent?.code}</p></> : <h2>{detail?.student.code || selectedStudent?.code || 'Selecciona un estudiante'}</h2>}
          {detail && <p className="muted">{detail.session.completedAt ? `Sesión del ${date(detail.session.startedAt)}` : `Sesión del ${date(detail.session.startedAt)}`} · Identificado por código</p>}
        </div>
        <div className="selectors"><label htmlFor="progress-student">Seleccionar estudiante</label><select id="progress-student" aria-label="Seleccionar estudiante" value={studentId} onChange={(event) => changeStudent(event.target.value)}><option value="">Seleccionar…</option>{students?.map((student) => <option key={student.id} value={student.id}>{student.name ? `${student.name} · ${student.code}` : student.code}</option>)}</select>
          {sessions.length > 1 && <><label htmlFor="progress-session">Sesión</label><select id="progress-session" aria-label="Seleccionar sesión" value={sessionId} onChange={(event) => changeSession(event.target.value)}>{sessions.map((session) => <option key={session.id} value={session.id}>{date(session.startedAt)}</option>)}</select></>}
        </div>
      </section>
      {loadingSessions && <p className="state" role="status">Cargando sesiones…</p>}
      {error && <p className="state error" role="alert">No se pudo cargar el progreso. Intenta nuevamente.</p>}
      {studentId && !loadingSessions && !error && sessions.length === 0 && <p className="state">Este estudiante todavía no tiene respuestas</p>}
      {loadingDetail && <p className="state" role="status">Cargando respuestas…</p>}
      {detail && <>
        <section className="summary-grid" aria-label="Resumen del progreso">
          <Summary label="Aciertos totales" value={<>{detail.summary.correctTotal} <small>de {detail.summary.totalQuestions}</small></>} note={`Capítulos ${detail.chapters.map((chapter) => chapter.title.replace(/^Capítulo\s*/i, '')).join(' y ') || '—'} completados`} />
          <Summary label="Correctas al 1.er intento" value={detail.summary.correctFirstAttempt} note="Comprendió sin necesitar otro intento" tone="blue" />
          <Summary label="Correctas al 2.º intento" value={detail.summary.correctSecondAttempt} note="Necesitó reconsiderar su respuesta" tone="amber" />
          <Summary label="Preguntas por reforzar" value={detail.summary.toReinforce} note="Incorrecta tras los 2 intentos" />
        </section>
        <section className="chapters-grid" aria-label="Resultados por capítulo">{detail.chapters.map((chapter) => <article className="chapter-card" key={chapter.chapterRefId}><div className="chapter-title"><h2>{chapter.title}</h2><strong>{chapter.correct}/{chapter.total}</strong></div>
          {chapter.questions.length ? <div className="question-blocks">{chapter.questions.map((entry) => { const result = entry.result; return <div className={`question-block ${resultClass[result]}`} key={`${chapter.chapterRefId}-${entry.questionNumber}`}>P{entry.questionNumber} · {blockLabel[result]}</div>; })}</div> : <p className="muted">Sin respuestas todavía</p>}
        </article>)}</section>
        <section className="detail-card"><p className="eyebrow">DETALLE DE LA SESIÓN · {date(detail.session.startedAt)}</p><h2>Respuestas por pregunta</h2>
          <div className="table-scroll"><table><thead><tr><th>CAP.</th><th>PREGUNTA</th><th>INTENTO 1</th><th>INTENTO 2</th><th>RESULTADO</th></tr></thead><tbody>
            {detail.questions.map((question) => <tr className={question.result === 'incorrect' ? 'reinforce-row' : ''} key={`${question.chapterRefId}-${question.questionNumber}`}><td>{detail.chapters.findIndex((chapter) => chapter.chapterRefId === question.chapterRefId) + 1}</td><td className="question-text">{question.questionText}<small>Correcta: {question.correctLetter}) {question.correctOptionText}</small></td>
              {[1, 2].map((attemptNumber) => { const attempt = question.attempts.find((item) => item.attemptNumber === attemptNumber); return <td key={attemptNumber}>{attempt ? `${attempt.letter} · ${attempt.isCorrect ? 'correcta' : 'incorrecta'}` : '—'}</td>; })}<td><span className={`result-pill ${resultClass[question.result]}`}>{resultLabel[question.result]}</span></td></tr>)}
          </tbody></table></div>
        </section>
        {detail.suggestion && <aside className="suggestion"><span className="bulb" aria-hidden="true">♧</span><div><h2>Sugerencia para la clase</h2><p>{detail.suggestion}</p></div></aside>}
      </>}
    </>}
    <footer className="progress-footer">StoryScape solo registra los resultados de las preguntas de comprensión. No se guardan audios, imágenes ni las consultas hechas al personaje.</footer>
  </main>;
}

function Summary({ label, value, note, tone = '' }: { label: string; value: React.ReactNode; note: string; tone?: string }) {
  return <article className="summary-card"><p>{label}</p><strong className={tone}>{value}</strong><span>{note}</span></article>;
}
