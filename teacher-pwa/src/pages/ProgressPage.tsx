import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getJson } from '../lib/http-client';

interface StudentOption {
  id: string;
  code: string;
  sessionCount: number;
  lastSessionAt: string;
}

interface ProgressSession {
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  literalScore: number | null;
  inferentialScore: number | null;
  globalScore: number | null;
  globalLevel: string | null;
}

interface StudentProgress {
  student: { id: string; code: string } | null;
  sessions: ProgressSession[];
}

function scoreLabel(label: string, value: number | null) {
  return <p>{label}: {value === null ? 'No disponible' : value}</p>;
}

export function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<StudentOption[] | null>(null);
  const [studentsError, setStudentsError] = useState(false);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [progressError, setProgressError] = useState(false);
  const selectedId = searchParams.get('studentId') ?? '';

  useEffect(() => {
    let active = true;
    getJson<StudentOption[]>('/students').then((data) => {
      if (active) setStudents(data);
    }).catch(() => {
      if (active) setStudentsError(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setProgress(null);
      setProgressError(false);
      return;
    }
    let active = true;
    setProgress(null);
    setProgressError(false);
    getJson<StudentProgress>(`/students/${encodeURIComponent(selectedId)}/progress`).then((data) => {
      if (active) setProgress(data);
    }).catch(() => {
      if (active) setProgressError(true);
    });
    return () => { active = false; };
  }, [selectedId]);

  const hasResult = (session: ProgressSession) =>
    session.literalScore !== null || session.inferentialScore !== null || session.globalScore !== null || session.globalLevel !== null;

  return (
    <main>
      <h1>Progress</h1>
      {students === null && !studentsError && <p role="status">Loading students...</p>}
      {studentsError && <p role="alert">Unable to load students. Please try again.</p>}
      {students && <label htmlFor="progress-student">Student</label>}
      {students && <select
        id="progress-student"
        value={selectedId}
        onChange={(event) => setSearchParams(event.target.value ? { studentId: event.target.value } : {})}
      >
        <option value="">Select a student</option>
        {students.map((student) => <option key={student.id} value={student.id}>Estudiante {student.code}</option>)}
      </select>}
      {!selectedId && students && <p>Select an authorized student to view their session history.</p>}
      {selectedId && !progress && !progressError && <p role="status">Loading progress...</p>}
      {progressError && <p role="alert">Unable to load student progress.</p>}
      {progress && (progress.student === null || progress.sessions.length === 0) && (
        <p>No hay sesiones registradas para este estudiante.</p>
      )}
      {progress?.student && progress.sessions.length > 0 && <section>
        <h2>Historial de Estudiante {progress.student.code}</h2>
        {progress.sessions.length === 1 && <p>No hay suficientes sesiones para mostrar una evolución histórica.</p>}
        <ol>
          {progress.sessions.map((session) => (
            <li key={session.sessionId}>
              <time dateTime={session.startedAt}>{new Date(session.startedAt).toLocaleString()}</time>
              {!hasResult(session) ? <p>Resultado de comprensión no disponible.</p> : <>
                {scoreLabel('Comprensión literal', session.literalScore)}
                {scoreLabel('Comprensión inferencial', session.inferentialScore)}
                {session.globalScore === null
                  ? <p>Puntaje global no disponible.</p>
                  : <p>Puntaje global: {session.globalScore}</p>}
                {session.globalLevel && <p>Nivel global: {session.globalLevel}</p>}
              </>}
            </li>
          ))}
        </ol>
      </section>}
    </main>
  );
}
