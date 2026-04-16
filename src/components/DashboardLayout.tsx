import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        notificationCount={3}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
