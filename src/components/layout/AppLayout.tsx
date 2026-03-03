import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChat } from '../ai/AIChat';
import { AICommandExecutor } from '../ai/AICommandExecutor';

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* AI Global Logic */}
            <AICommandExecutor />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
                <Header onMenuToggle={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    <div className="max-w-[1400px] mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* AI Assistant */}
            <AIChat />
        </div>
    );
}
