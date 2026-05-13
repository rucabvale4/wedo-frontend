import { useState } from 'react';
import { Navbar } from './Navbar';
import { UserManagement } from './admin/UserManagement';
import { SquadManagement } from './admin/SquadManagement';
import { ActionManagement } from './admin/ActionManagement';

type View = 'home' | 'users' | 'squads' | 'actions';

export const AdminPortal = ({ token, onLogout }: { token: string; onLogout: () => void }) => {
    const [view, setView] = useState<View>('home');

    return (
        <>
            <Navbar setView={(v) => setView(v as View)} currentView={view} onLogout={onLogout} />
            
            <main className="container mx-auto px-6 py-8">
                {/* Botão de Voltar para navegação rápida entre secções */}
                {view !== 'home' && (
                    <button 
                        onClick={() => setView('home')} 
                        className="mb-8 text-slate-400 hover:text-slate-800 font-bold flex items-center gap-2 transition-colors"
                    >
                        <span className="text-xl">←</span> Voltar
                    </button>
                )}

                {/* Switch de Vistas */}
                {view === 'home' && <AdminDashboard setView={setView} />}
                {view === 'users' && <UserManagement token={token} />}
                {view === 'squads' && <SquadManagement token={token} />}
                {view === 'actions' && <ActionManagement token={token} />}
            </main>
        </>
    );
};

const AdminDashboard = ({ setView }: { setView: (v: View) => void }) => (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-16">
        
        {/* TÍTULO PROPORCIONAL: WeDo em Verde + Command Center */}
        <div className="flex flex-col items-center gap-0">
            <h1 className="text-8xl font-black text-green-500 italic tracking-tighter select-none drop-shadow-md">
                WeDo
            </h1>
            <h2 className="text-5xl font-extrabold text-slate-800 italic -mt-2">
                Command Center
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <button onClick={() => setView('users')} className="p-10 bg-white border-2 rounded-[3rem] hover:border-blue-500 transition-all group shadow-sm">
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">👤</span>
                <span className="text-xl font-bold">Users</span>
            </button>
            <button onClick={() => setView('squads')} className="p-10 bg-white border-2 rounded-[3rem] hover:border-blue-500 transition-all group shadow-sm">
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">🛡️</span>
                <span className="text-xl font-bold">Squads</span>
            </button>
            <button onClick={() => setView('actions')} className="p-10 bg-white border-2 rounded-[3rem] hover:border-blue-500 transition-all group shadow-sm">
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">⚙️</span>
                <span className="text-xl font-bold">Actions</span>
            </button>
        </div>
    </div>
);