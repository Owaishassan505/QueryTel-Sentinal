import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, currentPage, onNavigate }) => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
            <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
            <div className="pl-[260px] flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 md:p-6 relative overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
