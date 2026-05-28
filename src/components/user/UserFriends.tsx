import { useState, useEffect } from 'react';

interface UserFriendsProps {
    token: string;
    userData?: any;
}

export const UserFriends = ({ token, userData }: UserFriendsProps) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [globalUsers, setGlobalUsers] = useState<any[]>([]);
    const [searchGlobal, setSearchGlobal] = useState('');
    const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

    useEffect(() => {
        fetchMyFriends();
    }, []);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const fetchMyFriends = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/users/friends', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data);
            }
        } catch (err) {
            console.error("Erro ao carregar amigos:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const openAddModal = async () => {
        setShowAddModal(true);
        setSearchGlobal('')
        setIsLoadingGlobal(true);
        try {
            const res = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGlobalUsers(data);
            }
        } catch (err) {
            console.error("Erro ao buscar rede global", err);
        } finally {
            setIsLoadingGlobal(false);
        }
    };

    const handleAddFriend = async (friendId: number) => {
        try {
            const res = await fetch('http://localhost:3000/api/users/friends', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendId })
            });

            if (res.ok) {
                triggerToast("Amigo adicionado! ✨");
                fetchMyFriends();
            } else {
                alert("Atenção Backend: A rota POST /api/users/friends falhou.");
            }
        } catch (err) {
            alert("Erro na ligação com o servidor.");
        }
    };

    const filteredFriends = friends.filter(friend => 
        friend.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const myFriendsIds = friends.map(f => f.id);
    const filteredGlobalUsers = globalUsers.filter(user => {
        const isNotMe = userData ? user.id !== userData.id : true;
        const isNotAdmin = user.role !== 'ADMIN';
        const isNotAlreadyFriend = !myFriendsIds.includes(user.id);
        const matchesSearch = user.nome.toLowerCase().includes(searchGlobal.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchGlobal.toLowerCase());
        
        return isNotMe && isNotAdmin && isNotAlreadyFriend && matchesSearch;
    });

    return (
        <section className="animate-in fade-in duration-500">
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[800] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-lg border border-blue-400/50 flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-sm font-bold tracking-tight">{toastMessage}</span>
                    </div>
                </div>
            )}

            <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">
                        Os Meus Amigos
                    </h2>
                    <p className="text-slate-400 text-xs mt-2">Histórico de amigos e conexões confirmadas</p>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    {friends.length > 0 && (
                        <input 
                            type="text" 
                            placeholder="🔍 Pesquisar nos amigos..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 flex-1 sm:w-64 shadow-sm transition-colors"
                        />
                    )}
                    <button 
                        onClick={openAddModal}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-md shrink-0 flex items-center gap-2"
                    >
                        <span>+</span> Adicionar Amigos
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : friends.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 shadow-sm border border-slate-200 text-center max-w-3xl mx-auto">
                    <div className="text-7xl mb-8">👥</div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-2">Ainda sem amigos?</h3>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
                        Clica no botão abaixo para pesquisar e adicionar utilizadores!
                    </p>
                    <button onClick={openAddModal} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all">
                        🔍 Encontrar Pessoas
                    </button>
                </div>
            ) : filteredFriends.length === 0 ? (
                <p className="text-slate-400 italic text-center py-8">Nenhum amigo corresponde à tua pesquisa.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl">
                    {filteredFriends.map((friend) => (
                        <div key={friend.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-400 transition-all">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(friend.nome)}&background=f8fafc&color=64748b&size=128&bold=true`} 
                                alt={friend.nome} 
                                className="w-14 h-14 rounded-full border-2 border-slate-100 shrink-0"
                            />
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-base font-bold text-slate-800 truncate leading-tight">{friend.nome}</h3>
                                <p className="text-xs text-slate-400 truncate mb-2">{friend.email}</p>
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[9px] font-black uppercase tracking-wider">
                                    Conexão Ativa
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Encontrar Pessoas</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-3xl leading-none">&times;</button>
                        </div>

                        <div className="mb-6 relative">
                            <input 
                                type="text" 
                                placeholder="Pesquisar por nome ou email..." 
                                value={searchGlobal}
                                onChange={e => setSearchGlobal(e.target.value)}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors font-medium pl-12"
                            />
                            <span className="absolute left-4 top-4 text-slate-400 text-lg">🔍</span>
                        </div>

                        <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar">
                            {isLoadingGlobal ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : filteredGlobalUsers.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-sm font-bold text-slate-400">Nenhum utilizador novo encontrado.</p>
                                    <p className="text-xs text-slate-400 mt-1">Experimenta outro termo de pesquisa.</p>
                                </div>
                            ) : (
                                filteredGlobalUsers.map((user) => (
                                    <div key={user.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:bg-slate-50 transition-all group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=f8fafc&color=64748b&size=128&bold=true`} 
                                                alt={user.nome} 
                                                className="w-12 h-12 rounded-full border border-slate-200 shrink-0 shadow-sm"
                                            />
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-slate-800 truncate">{user.nome}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAddFriend(user.id)}
                                            className="ml-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            + Adicionar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowAddModal(false)} className="w-full py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                Fechar Pesquisa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};