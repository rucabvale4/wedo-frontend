import { useState, useEffect } from 'react';

interface UserFeedProps {
    token: string;
    userData?: any; // Recebe os dados do utilizador atual para não aparecer a si mesmo
}

export const UserFeed = ({ token, userData }: UserFeedProps) => {
    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [globalUsers, setGlobalUsers] = useState<any[]>([]);
    const [myFriendsIds, setMyFriendsIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Novo estado para a pesquisa
    const [searchPeople, setSearchPeople] = useState('');

    useEffect(() => {
        fetchData();
        
        const radarInterval = setInterval(() => {
            fetchData(true);
        }, 10000);

        return () => clearInterval(radarInterval);
    }, []);

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);

        try {
            const cachedFeed = sessionStorage.getItem('wedo_feed_cache');
            if (cachedFeed && !isSilent) setFeedItems(JSON.parse(cachedFeed));

            const [squadsRes, usersRes, friendsRes] = await Promise.all([
                fetch('http://localhost:3000/api/squads/my-squads', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/users/friends', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (squadsRes.ok) {
                const squads = await squadsRes.json();
                let allActions: any[] = [];
                
                squads.forEach((squad: any) => {
                    if (squad.actions) {
                        const actionsWithSquad = squad.actions.map((a: any) => ({ ...a, squadName: squad.nomeSquad }));
                        allActions = [...allActions, ...actionsWithSquad];
                    }
                });
                
                allActions.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
                setFeedItems(allActions);
                sessionStorage.setItem('wedo_feed_cache', JSON.stringify(allActions));
            }

            if (friendsRes.ok) {
                const myFriends = await friendsRes.json();
                setMyFriendsIds(myFriends.map((f: any) => f.id));
            }

            if (usersRes.ok) {
                const users = await usersRes.json();
                setGlobalUsers(users);
            }
        } catch (error) {
            console.error("Erro ao carregar o feed:", error);
        } finally {
            if (!isSilent) setIsLoading(false);
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
                triggerToast("Amigo adicionado com sucesso! ✨");
                fetchData(true);
            } else {
                // Aviso mais amigável a explicar o que falta ao backend
                alert("Atenção Backend: A rota para adicionar amigos (POST /api/users/friends) ainda não está pronta na API!");
            }
        } catch (err) {
            alert("Erro na ligação com o servidor. Backend desligado?");
        }
    };

    const determineEstado = (action: any) => {
        if (action.estado === 'Cancelado') return 'Cancelado'; 
        if (!action.data_hora) return action.estado || 'Planeamento'; 
        const now = new Date();
        const actionDate = new Date(action.data_hora);
        const actionEnd = new Date(actionDate.getTime() + 2 * 60 * 60 * 1000);
        if (now < actionDate) return 'Agendado';
        if (now >= actionDate && now <= actionEnd) return 'A Decorrer';
        return 'Concluída';
    };

    // Aplicação dos Filtros: Não mostra a própria conta, não mostra Admins, e filtra pela pesquisa
    const filteredUsers = globalUsers.filter(user => {
        const isNotMe = userData ? user.id !== userData.id : true;
        const isNotAdmin = user.role !== 'ADMIN';
        const matchesSearch = user.nome.toLowerCase().includes(searchPeople.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchPeople.toLowerCase());
        
        return isNotMe && isNotAdmin && matchesSearch;
    });

    return (
        <section className="animate-in fade-in duration-500 max-w-7xl mx-auto relative">
            
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[700] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg border border-emerald-400/50 flex items-center gap-2">
                        <span>✅</span>
                        <span className="text-xs font-bold tracking-tight">{successMessage}</span>
                    </div>
                </div>
            )}

            <header className="mb-10">
                <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">
                    O Teu Feed
                </h2>
            </header>

            <div className="flex flex-col lg:flex-row gap-10">
                
                {/* LINHA CRONOLÓGICA DAS ACTIONS */}
                <div className="flex-1 space-y-6">
                    {isLoading && feedItems.length === 0 ? (
                        <div className="flex justify-center p-12">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : feedItems.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-200 text-center">
                            <div className="text-6xl mb-6">📭</div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Feed Vazio</h3>
                            <p className="text-slate-500">Os teus Squads ainda não têm missões públicas. Cria uma para mobilizar o grupo!</p>
                        </div>
                    ) : (
                        feedItems.map((action) => {
                            const estado = determineEstado(action);
                            let corEstado = "bg-slate-100 text-slate-600";
                            if (estado === 'Agendado') corEstado = "bg-blue-100 text-blue-700";
                            if (estado === 'A Decorrer') corEstado = "bg-amber-100 text-amber-700";
                            if (estado === 'Concluída') corEstado = "bg-emerald-100 text-emerald-700";
                            if (estado === 'Cancelado') corEstado = "bg-red-100 text-red-700";

                            return (
                                <div key={action.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl shrink-0">🛡️</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 leading-none">{action.squadName}</h4>
                                            <span className="text-xs text-slate-400">Publicou uma nova Action</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-800">{action.titulo}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${corEstado}`}>
                                                    {estado}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">{action.descricao || "Sem briefing detalhado."}</p>
                                            <div className="flex gap-3 text-xs font-medium text-slate-600">
                                                <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">📅 {action.data_hora ? new Date(action.data_hora).toLocaleDateString('pt-PT') : 'Sem Data'}</span>
                                                <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">⏰ {action.data_hora ? new Date(action.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">🏷️ {action.categoria}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* COLUNA DIREITA: DESCOBRIR PESSOAS */}
                <div className="lg:w-80 shrink-0">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Descobrir Pessoas</h3>
                        
                        {/* BARRA DE PESQUISA */}
                        <div className="mb-4">
                            <input 
                                type="text" 
                                placeholder="🔍 Procurar utilizador..." 
                                value={searchPeople}
                                onChange={e => setSearchPeople(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {filteredUsers.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">Nenhum resultado encontrado.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=f8fafc&color=64748b&size=128&bold=true`} 
                                                alt={user.nome} 
                                                className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                                            />
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user.nome}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        {myFriendsIds.includes(user.id) ? (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full shrink-0">Amigo ✓</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddFriend(user.id)}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-bold hover:bg-blue-700 transition-all shrink-0"
                                            >
                                                + Adicionar
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};