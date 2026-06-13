import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useSessionLock } from '../../hooks/useSessionLock';

export default function Layout() {
  useSessionLock();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
