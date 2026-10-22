import React from 'react';
import { Outlet } from 'react-router-dom';
import ExtraMileHeader from '../ExtraMileHeader/ExtraMileHeader';
import './AppShell.css';

export default function AppShell() {
  return (
    <div className="ddd-user-shell">
      <ExtraMileHeader />
      <div className="ddd-user-main">
        <Outlet />
      </div>
    </div>
  );
}
