import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getJson } from '../lib/http-client';

interface StudentSummary {
  id: string;
  code: string;
  sessionCount: number;
  lastSessionAt: string;
}

export function StudentDetailPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    getJson<StudentSummary>(`/students/${encodeURIComponent(studentId)}`).then((data) => {
      if (active) setStudent(data);
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
        <p>Sessions: {student.sessionCount}</p>
        <p>Last session: {new Date(student.lastSessionAt).toLocaleString()}</p>
        <p>Los resultados detallados se incorporarán en la siguiente etapa.</p>
      </>}
    </main>
  );
}
