import React, { useState } from 'react';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'Dashboard' && <Dashboard />}
      {currentPage === 'Logs Analysis' && <Analysis />}

      {currentPage !== 'Dashboard' && currentPage !== 'Logs Analysis' && (
        <div className="flex flex-col items-center justify-center p-20 text-slate-500 opacity-50">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <span className="font-mono text-xs uppercase tracking-widest">Module Access Restricted used: {currentPage}</span>
        </div>
      )}
    </Layout>
  );
}

export default App;
