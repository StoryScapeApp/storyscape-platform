import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getJson } from '../lib/http-client';

interface SessionResultDetail {
  literalScore: number;
  inferentialScore: number;
  globalScore: number | null;
  globalLevel: string;
}

interface SessionDetail {
  id: string;
  student: { id: string; code: string };
  bookRefId: string;
  startedAt: string;
  completedAt: string | null;
  result: SessionResultDetail | null;
  activitySummary: { activityCount: number; attemptCount: number };
  hintSummary: { hintUsageCount: number };
}

export function SessionDetailPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setSession(null);
    setError(false);
    getJson<SessionDetail>(`/sessions/${encodeURIComponent(sessionId)}`).then((data) => {
      if (active) setSession(data);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [sessionId]);

  return (
    <main>
      <h1>Session Detail</h1>
      {!session && !error && <p role="status">Loading session...</p>}
      {error && <p role="alert">Unable to load session.</p>}
      {session && <>
        <p>Estudiante {session.student.code}</p>
        <p>Fecha: {new Date(session.startedAt).toLocaleString()}</p>
        <p>Libro: {session.bookRefId}</p>
        {session.result === null ? (
          <p>Resultado de comprensión aún no disponible.</p>
        ) : (
          <section aria-label="Comprehension result">
            <h2>Resultado de comprensión</h2>
            <p>Comprensión literal: {session.result.literalScore}</p>
            <p>Comprensión inferencial: {session.result.inferentialScore}</p>
            {session.result.globalScore === null
              ? <p>Puntaje global no disponible.</p>
              : <p>Puntaje global: {session.result.globalScore}</p>}
            {session.result.globalLevel && <p>Nivel global: {session.result.globalLevel}</p>}
          </section>
        )}
        <h2>Actividad</h2>
        <p>Actividades: {session.activitySummary.activityCount}</p>
        <p>Intentos: {session.activitySummary.attemptCount}</p>
        <p>Pistas utilizadas: {session.hintSummary.hintUsageCount}</p>
      </>}
    </main>
  );
}
