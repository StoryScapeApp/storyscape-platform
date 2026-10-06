import { useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  if (auth.status === 'loading') return <main><p>Loading...</p></main>;
  if (auth.status === 'unauthenticated') return <Navigate to="/login" replace />;

  async function handleLogout() {
    setLoggingOut(true);
    setError('');
    try {
      await auth.logout();
      navigate('/login', { replace: true });
    } catch {
      setError('Unable to sign out. Please try again.');
      setLoggingOut(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleLogout} disabled={loggingOut}>Sign out</button>
      {error && <p role="alert">{error}</p>}
      <Outlet />
    </>
  );
}
