import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJson } from '../lib/http-client';

interface StudentSummary {
  id: string;
  code: string;
  sessionCount: number;
  lastSessionAt: string;
}

interface ReadingSessionSummary {
  id: string;
  bookRefId: string;
  startedAt: string;
  completedAt: string | null;
}

export function StudentDetailPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [sessions, setSessions] = useState<ReadingSessionSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setStudent(null);
    setSessions(null);
    setError(false);
    Promise.all([
      getJson<StudentSummary>(`/students/${encodeURIComponent(studentId)}`),
      getJson<ReadingSessionSummary[]>(`/students/${encodeURIComponent(studentId)}/sessions`),
    ]).then(([studentData, sessionData]) => {
      if (active) {
        setStudent(studentData);
        setSessions(sessionData);
      }
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [studentId]);

  return (
    <main>
      <h1>Student Detail</h1>
      {student === null && !error && <p role="status">Loading student...</p>}
      {error && <p role="alert">Unable to load student.</p>}
      {student && <>
        <p>Estudiante {student.code}</p>
        <p><Link to={`/progress?studentId=${encodeURIComponent(student.id)}`}>Ver progreso histórico</Link></p>
        <p>Sessions: {student.sessionCount}</p>
        <p>Last session: {new Date(student.lastSessionAt).toLocaleString()}</p>
        <h2>Reading sessions</h2>
        {sessions === null && <p role="status">Loading sessions...</p>}
        {sessions?.length === 0 && <p>No hay sesiones registradas para este estudiante.</p>}
        {sessions && sessions.length > 0 && <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              <Link to={`/sessions/${session.id}`}>
                {new Date(session.startedAt).toLocaleString()} · {session.bookRefId}
              </Link>
              <p>{session.completedAt ? 'Completada' : 'En curso'}</p>
            </li>
          ))}
        </ul>}
      </>}
    </main>
  );
}
