import { useState, useEffect } from 'react';

interface UserFriendsProps {
    token: string;
}

export const UserFriends = ({ token }: UserFriendsProps) => {
    const [users, setUsers] = useState<any[]>([]);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Erro ao carregar utilizadores:", err);
        }
    };

    const handleProcurarAmigos = () => {
        setToastMessage("Já és amigo de toda a gente! 🌍");
        setTimeout(() => setToastMessage(''), 3000);
    };

    return (
        <section className="animate-in fade-in duration-500">
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-lg border border-blue-400/50 flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-sm font-bold tracking-tight">{toastMessage}</span>
                    </div>
                </div>
            )}

            <header className="mb-12 flex justify-between items-end">
                <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Comunidade</h2>
                
                <button 
                    onClick={handleProcurarAmigos}
                    className="px-6 py-2 bg-slate-800 text-white rounded-full text-xs font-bold hover:bg-slate-900 transition-all shadow-md"
                >
                    🔍 Procurar Amigos
                </button>
            </header>

            {users.length === 0 ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl">
                    {users.map((user) => (
                        <div key={user.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=f8fafc&color=64748b&size=128&bold=true`} 
                                alt={user.nome} 
                                className="w-16 h-16 rounded-full border-2 border-slate-100 shrink-0"
                            />
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{user.nome}</h3>
                                <p className="text-xs text-slate-500 truncate mb-2">{user.email}</p>
                                <span className="px-2 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-md text-[9px] font-black uppercase tracking-wider">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};