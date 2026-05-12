import { useState, useEffect } from 'react';

interface UserPortalProps {
    token?: string; // Aceita o token como prop para fazer os pedidos
    onLogout: () => void;
}

export const UserPortal = ({ token, onLogout }: UserPortalProps) => {
    // Estado para controlar que página estamos a ver
    const [currentView, setCurrentView] = useState('feed');
    const [userData, setUserData] = useState<any>(null);

    // Se o token não vier por prop, tenta ir buscar ao localStorage
    const authToken = token || localStorage.getItem('token'); 

    // CARREGAR DADOS DO UTILIZADOR LOGADO
    useEffect(() => {
       const fetchMyProfile = async () => {
        try {
            console.log("Token a ser utilizado:", authToken); // Verifica se o token não está vazio
            
            const res = await fetch('http://localhost:3000/api/users/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (res.ok) {
                setUserData(await res.json());
            } else {
                // DAR VOZ AO ERRO
                const errorData = await res.json();
                console.error("O Servidor rejeitou o pedido /me:", errorData);
                alert(`Erro no Perfil: ${errorData.error}`);
                
                // Pára o loading infinito para não ficarmos encravados
                setUserData({ nome: "Erro ao Carregar", email: "Verifica a consola (F12)", role: "ERRO" });
            }
        } catch (err) {
            console.error("Erro de rede ao carregar perfil:", err);
            alert("Erro de rede: O backend está a correr?");
        }
    };

        if (authToken) fetchMyProfile();
    }, [authToken]);

    const menuItems = [
        { id: 'feed', label: 'Feed Principal', icon: '🏠' },
        { id: 'squads', label: 'Os Meus Squads', icon: '🛡️' },
        { id: 'actions', label: 'Minhas Actions', icon: '⚙️' },
        { id: 'friends', label: 'Amigos', icon: '👥' },
    ];

    // Dados fictícios para teste (Mock Data)
    const feedData = [
        { id: 1, user: 'João Silva', action: 'Completou a Action: Limpeza de Base', time: 'Há 2h', img: '📋' },
        { id: 2, user: 'Equipa Alfa', action: 'Novo Squad criado: Operação Interna', time: 'Há 5h', img: '🛡️' },
    ];

    const mySquads = [
        { id: 1, name: 'Equipa Alfa', members: 5, role: 'Líder' },
        { id: 2, name: 'Delta Force', members: 12, role: 'Membro' },
    ];

    const myActions = [
        { id: 1, title: 'Revisão de Código', status: 'Pendente', deadline: 'Amanhã' },
        { id: 2, title: 'Relatório Mensal', status: 'Concluído', deadline: 'Ontem' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden text-slate-800">
            
            {/* BARRA LATERAL (SIDEBAR) */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-2xl shrink-0">
                <div>
                    <div className="p-8">
                        <h1 className="text-2xl font-light italic tracking-widest text-slate-300">WeDo</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 italic">User Portal</p>
                    </div>

                    {/* MINI PERFIL NO TOPO DA SIDEBAR */}
                    {userData && (
                        <div className="px-6 mb-6 flex items-center gap-3">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome)}&background=2563eb&color=fff&bold=true`} 
                                alt="Avatar" 
                                className="w-10 h-10 rounded-full border border-slate-700"
                            />
                            <div>
                                <p className="text-sm font-bold text-slate-200 truncate">{userData.nome.split(' ')[0]}</p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{userData.role}</p>
                            </div>
                        </div>
                    )}

                    <nav className="px-4 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                                    currentView === item.id 
                                    ? 'bg-slate-700 text-white shadow-lg' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-800 space-y-1">
                    <button 
                        onClick={() => setCurrentView('profile')}
                        className={`w-full flex items-center gap-4 px-4 py-3 transition-colors text-sm rounded-xl ${currentView === 'profile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <span>👤</span> Meu Perfil
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-sm">
                        <span>⚙️</span> Definições
                    </button>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all text-sm font-bold mt-4"
                    >
                        <span>⏻</span> Sair
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL DINÂMICO */}
            <main className="flex-1 overflow-y-auto p-12">
                
                {/* 1. VIEW: FEED PRINCIPAL */}
                {currentView === 'feed' && (
                    <section className="animate-in fade-in duration-500">
                        <header className="mb-12">
                            <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Feed de atividades</h2>
                            {userData && <p className="text-slate-500 mt-4 font-bold">Bem-vindo de volta, {userData.nome.split(' ')[0]}!</p>}
                        </header>
                        <div className="max-w-2xl space-y-6">
                            {feedData.map((post) => (
                                <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex gap-6 hover:shadow-md transition-shadow">
                                    <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shrink-0">{post.img}</div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{post.user}</span>
                                            <span className="text-[10px] text-slate-400">• {post.time}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm">{post.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. VIEW: OS MEUS SQUADS */}
                {currentView === 'squads' && (
                    <section className="animate-in fade-in duration-500">
                        <header className="mb-12">
                            <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Os Meus Squads</h2>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                            {mySquads.map((squad) => (
                                <div key={squad.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-slate-400 transition-all">
                                    <div className="text-3xl mb-4">🛡️</div>
                                    <h3 className="text-xl font-bold mb-1">{squad.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{squad.members} Membros ativos</p>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">Cargo: {squad.role}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. VIEW: MINHAS ACTIONS */}
                {currentView === 'actions' && (
                    <section className="animate-in fade-in duration-500">
                        <header className="mb-12">
                            <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Minhas Actions</h2>
                        </header>
                        <div className="max-w-3xl space-y-4">
                            {myActions.map((action) => (
                                <div key={action.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">⚙️</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{action.title}</h4>
                                            <p className="text-xs text-slate-500">Prazo: {action.deadline}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-4 py-1 rounded-full ${action.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {action.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. VIEW: AMIGOS */}
                {currentView === 'friends' && (
                    <section className="animate-in fade-in duration-500">
                        <header className="mb-12">
                            <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Amigos</h2>
                        </header>
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-md">
                            <div className="text-5xl mb-6 text-slate-300">👥</div>
                            <p className="text-slate-500 leading-relaxed">Ainda não tens amigos adicionados.<br />Começa a explorar os Squads para encontrar a tua equipa!</p>
                            <button className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-900 transition-all shadow-lg">Procurar Pessoas</button>
                        </div>
                    </section>
                )}

                {/* 5. VIEW: MEU PERFIL (A NOVA VISTA!) */}
                {currentView === 'profile' && (
                    <section className="animate-in fade-in duration-500 max-w-4xl">
                        <header className="mb-12">
                            <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Meu Perfil</h2>
                        </header>

                        {!userData ? (
                            <div className="flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* CARD PRINCIPAL DE IDENTIFICAÇÃO */}
                                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-10">
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome)}&background=1e293b&color=fff&size=256&bold=true`} 
                                        alt="Avatar Grande" 
                                        className="w-40 h-40 rounded-full shadow-lg border-4 border-slate-50"
                                    />
                                    
                                    <div className="text-center md:text-left flex-1">
                                        <h1 className="text-4xl font-bold text-slate-800 mb-2">{userData.nome}</h1>
                                        <p className="text-slate-500 font-medium mb-6">✉️ {userData.email}</p>
                                        
                                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                            <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">
                                                Patente: {userData.role}
                                            </span>
                                            <span className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100">
                                                Membro desde {new Date(userData.createdAt).getFullYear()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ESTATÍSTICAS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group">
                                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:scale-110 transition-transform duration-500">⭐</div>
                                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Pontos de Experiência</h4>
                                        <div className="flex items-baseline gap-2 text-slate-800">
                                            <span className="text-6xl font-black">{userData.pontos_experiencia}</span>
                                            <span className="text-xl font-bold text-slate-400">XP</span>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group">
                                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">🔥</div>
                                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Ofensiva Atual</h4>
                                        <div className="flex items-baseline gap-2 text-slate-800">
                                            <span className="text-6xl font-black">{userData.streak}</span>
                                            <span className="text-xl font-bold text-slate-400">Dias</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

            </main>
        </div>
    );
};