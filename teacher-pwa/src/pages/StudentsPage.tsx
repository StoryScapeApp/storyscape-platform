import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../lib/http-client';

interface StudentSummary {
  id: string;
  code: string;
  sessionCount: number;
  lastSessionAt: string;
}

export function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<StudentSummary[]>('/students').then((data) => {
      if (active) setStudents(data);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, []);

  return (
    <main>
      <h1>Students</h1>
      {students === null && !error && <p role="status">Loading students...</p>}
      {error && <p role="alert">Unable to load students. Please try again.</p>}
      {students?.length === 0 && <p>No hay estudiantes con sesiones registradas.</p>}
      {students && students.length > 0 && (
        <ul>
          {students.map((student) => (
            <li key={student.id}>
              <Link to={`/students/${student.id}`}>Estudiante {student.code}</Link>
              <p>Sessions: {student.sessionCount}</p>
              <p>Last session: {new Date(student.lastSessionAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
