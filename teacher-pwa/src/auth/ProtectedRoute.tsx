import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AppShell } from '../components/AppShell';
export function ProtectedRoute(){const auth=useAuth();const navigate=useNavigate();const[loggingOut,setLoggingOut]=useState(false);const[error,setError]=useState('');if(auth.status==='loading')return <main className="auth-loading" role="status">Preparando el portal…</main>;if(auth.status==='unauthenticated')return <Navigate to="/login" replace/>;async function handleLogout(){setLoggingOut(true);setError('');try{await auth.logout();navigate('/login',{replace:true})}catch{setError('No se pudo cerrar la sesión. Inténtelo nuevamente.');setLoggingOut(false)}}return <AppShell onLogout={handleLogout} loggingOut={loggingOut} logoutError={error}/>}
