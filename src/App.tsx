import { useState, useEffect } from 'react';
import { AuthView } from './components/AuthView';
import { UserPortal } from './components/UserPortal';
import { AdminPortal } from './components/AdminPortal';

function App() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('wedo_token'));
    const [role, setRole] = useState<string | null>(() => localStorage.getItem('wedo_role'));
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (token && role) {
            localStorage.setItem('wedo_token', token);
            localStorage.setItem('wedo_role', role);
        } else {
            localStorage.removeItem('wedo_token');
            localStorage.removeItem('wedo_role');
        }
    }, [token, role]);

    const handleLoginSuccess = (newToken: string, newRole: string) => {
        setToken(newToken);
        setRole(newRole);
    };

    const handleLogout = () => {
        setToken(null);
        setRole(null);
        setShowLogoutModal(false);
    };

    if (!token) {
        return <AuthView onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 relative text-slate-800 font-sans">
            
            {role === 'ADMIN' ? (
                <AdminPortal token={token} onLogout={() => setShowLogoutModal(true)} />
            ) : (
                <UserPortal onLogout={() => setShowLogoutModal(true)} />
            )}

            {showLogoutModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">⏻</div>
                        <h3 className="text-2xl font-bold mb-8">Deseja sair da WeDo?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-slate-100 rounded-full font-bold">Não</button>
                            <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-100">Sair</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;