import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from './store/useAppStore';
import { initializeDatabase, db } from './db';

import Setup         from './pages/Setup';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Groups        from './pages/Groups';
import Lecturers     from './pages/Lecturers';
import Rooms         from './pages/Rooms';
import Courses       from './pages/Courses';
import Timetable     from './pages/Timetable';
import Conflicts     from './pages/Conflicts';
import Settings      from './pages/Settings';
import Holidays      from './pages/Holidays';
import MasterGrid        from './pages/MasterGrid';
import TimetableHistory  from './pages/TimetableHistory';
import Layout            from './components/layout/Layout';
import AppLogo           from './components/AppLogo';

function AppRoutes() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const [ready, setReady] = useState(false);

  // Reactive — updates as soon as a user is created during setup
  const userCount = useLiveQuery(() => db.users.count());
  const usersExist = (userCount ?? 0) > 0;

  useEffect(() => {
    initializeDatabase()
      .then(() => setReady(true))
      .catch(err => { console.error('Init error:', err); setReady(true); });
  }, []);

  if (!ready || userCount === undefined) {
    return (
      <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center gap-4">
        <AppLogo size="lg" onDark className="max-w-[240px]" />
        <div className="text-slate-300 text-sm animate-pulse">Chargement...</div>
      </div>
    );
  }

  // First launch — no accounts yet (skip if user just finished setup and is already signed in)
  if (!usersExist && !isAuthenticated) {
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="timetable"         element={<Timetable />} />
        <Route path="timetable-history" element={<TimetableHistory />} />
        <Route path="master-grid"       element={<MasterGrid />} />
        <Route path="groups"      element={<Groups />} />
        <Route path="lecturers"   element={<Lecturers />} />
        <Route path="rooms"       element={<Rooms />} />
        <Route path="courses"     element={<Courses />} />
        <Route path="conflicts"   element={<Conflicts />} />
        <Route path="holidays"    element={<Holidays />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
