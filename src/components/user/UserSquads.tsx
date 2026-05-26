import { useState, useEffect } from 'react';

interface UserSquadsProps {
    token: string;
}

export const UserSquads = ({ token }: UserSquadsProps) => {
    const [mySquads, setMySquads] = useState<any[]>([]);
    const [globalSquads, setGlobalSquads] = useState<any[]>([]);
    
    const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
    const [selectedSquad, setSelectedSquad] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    
    // Nova Action
    const [showCreateActionModal, setShowCreateActionModal] = useState(false);
    const [actionForm, setActionForm] = useState({ 
        titulo: '', categoria: '', descricao: '', dataHora: '', 
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    });

    // Editar Action (NOVO)
    const [showEditActionModal, setShowEditActionModal] = useState(false);
    const [actionToEdit, setActionToEdit] = useState<number | null>(null);
    const [editActionForm, setEditActionForm] = useState({ 
        titulo: '', categoria: '', descricao: '', dataHora: '', 
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    });
    
    // Cancelar Action
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [actionToCancel, setActionToCancel] = useState<number | null>(null);
    
    // Squads
    const [createForm, setCreateForm] = useState({ nomeSquad: '', descricao: '' });
    const [editForm, setEditForm] = useState({ nomeSquad: '', descricao: '' });
    const [isEditing, setIsEditing] = useState(false);
    
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchMySquads();
    }, []);

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 2000);
    };

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const formatDateTimeForInput = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const determineEstado = (action: any) => {
        if (action.estado === 'Cancelado') return 'Cancelado'; 
        if (!action.data_hora) return action.estado; 

        const now = new Date();
        const actionDate = new Date(action.data_hora);
        const actionEnd = new Date(actionDate.getTime() + 2 * 60 * 60 * 1000);

        if (now < actionDate) return 'Planeamento';
        if (now >= actionDate && now <= actionEnd) return 'Em curso';
        return 'Concluída';
    };

    const fetchMySquads = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/squads/my-squads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMySquads(data);
                
                setSelectedSquad((current: any) => {
                    if (current) return data.find((s: any) => s.id === current.id) || current;
                    return null;
                });
            }
        } catch (err) { console.error("Erro ao carregar os squads:", err); }
    };

    const fetchGlobalSquads = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/squads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const availableSquads = data.filter((squad: any) => !mySquads.some(my => my.id === squad.id));
                setGlobalSquads(availableSquads);
            }
        } catch (err) { console.error("Erro ao carregar todos os squads:", err); }
    };

    const openSearchModal = () => {
        fetchGlobalSquads();
        setShowSearchModal(true);
    };

    const handleCreateSquad = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/squads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(createForm)
            });
            if (res.ok) {
                setShowCreateModal(false);
                fetchMySquads();
                triggerToast("Squad criado com sucesso!");
                setCreateForm({ nomeSquad: '', descricao: '' });
            } else {
                const errData = await res.json();
                alert("Erro ao criar: " + errData.error);
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const handleJoinSquad = async (squadId: number) => {
        try {
            const res = await fetch(`http://localhost:3000/api/squads/${squadId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setShowSearchModal(false);
                fetchMySquads();
                triggerToast("Entraste no squad com sucesso!");
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const handleEditSquad = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/squads/${selectedSquad.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setIsEditing(false);
                fetchMySquads(); 
                triggerToast("Squad atualizado!");
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const handleGetCoordinates = async (isEdit: boolean = false) => {
        const morada = isEdit ? editActionForm.morada : actionForm.morada;
        if (!morada) return alert("Escreve uma morada primeiro.");
        
        try {
            const res = await fetch(`http://localhost:3000/api/actions/coordinates?address=${encodeURIComponent(morada)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (isEdit) {
                    setEditActionForm({ ...editActionForm, latitude: data.latitude, longitude: data.longitude });
                } else {
                    setActionForm({ ...actionForm, latitude: data.latitude, longitude: data.longitude });
                }
                triggerToast("📍 Localização encontrada!");
            } else {
                alert("Não foi possível encontrar essa localização.");
            }
        } catch (err) { alert("Erro ao comunicar com o servidor."); }
    };

    const handleCreateAction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    titulo: actionForm.titulo,
                    categoria: actionForm.categoria,
                    descricao: actionForm.descricao,
                    data_hora: new Date(actionForm.dataHora).toISOString(),
                    squadId: selectedSquad.id,
                    latitude: actionForm.latitude,
                    longitude: actionForm.longitude
                })
            });
            if (res.ok) {
                setShowCreateActionModal(false);
                triggerToast("Action criada com sucesso!");
                setActionForm({ titulo: '', categoria: '', descricao: '', dataHora: '', morada: '', latitude: undefined, longitude: undefined });
                fetchMySquads();
            } else {
                const errData = await res.json();
                alert("Erro ao criar Action: " + (errData.error || "Tenta novamente."));
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const openEditActionModal = (action: any) => {
        setActionToEdit(action.id);
        setEditActionForm({
            titulo: action.titulo,
            categoria: action.categoria,
            descricao: action.descricao || '',
            dataHora: formatDateTimeForInput(action.data_hora),
            morada: '', // A morada original não está na BD, apenas as coordenadas. O utilizador pode escrever uma nova se quiser atualizar.
            latitude: action.latitude,
            longitude: action.longitude
        });
        setShowEditActionModal(true);
    };

    const handleEditActionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionToEdit}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    titulo: editActionForm.titulo,
                    categoria: editActionForm.categoria,
                    descricao: editActionForm.descricao,
                    data_hora: new Date(editActionForm.dataHora).toISOString(),
                    latitude: editActionForm.latitude,
                    longitude: editActionForm.longitude
                })
            });
            if (res.ok) {
                setShowEditActionModal(false);
                triggerToast("Action atualizada com sucesso!");
                fetchMySquads();
            } else {
                alert("Erro ao atualizar Action.");
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const confirmCancelAction = (actionId: number) => {
        setActionToCancel(actionId);
        setShowCancelModal(true);
    };

    const executeCancelAction = async () => {
        if (!actionToCancel) return;
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionToCancel}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ estado: 'Cancelado' })
            });

            if (res.ok) {
                triggerToast("Action cancelada com sucesso.");
                setShowCancelModal(false);
                setActionToCancel(null);
                fetchMySquads();
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
    };

    const openSquadDetails = (squad: any) => {
        setSelectedSquad(squad);
        setEditForm({ nomeSquad: squad.nomeSquad, descricao: squad.descricao || '' });
        setActiveView('detail');
    };

    return (
        <section className="animate-in fade-in duration-500">
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[700] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg border border-emerald-400/50 flex items-center gap-2">
                        <span>✅</span>
                        <span className="text-xs font-bold tracking-tight">{successMessage}</span>
                    </div>
                </div>
            )}

            {activeView === 'list' && (
                <>
                    <header className="mb-12 flex justify-between items-end">
                        <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">
                            {mySquads.length > 0 ? "Os Meus Squads" : "Squads"}
                        </h2>
                        {mySquads.length > 0 && (
                            <div className="flex gap-3">
                                <button onClick={openSearchModal} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-300 transition-all shadow-sm">🔍 Procurar</button>
                                <button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-all shadow-md">+ Criar</button>
                            </div>
                        )}
                    </header>

                    {mySquads.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-16 shadow-sm border border-slate-200 text-center max-w-3xl mx-auto">
                            <div className="text-7xl mb-8">👥</div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-4">Ainda não fazes parte de um Squad</h3>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                                <button onClick={openSearchModal} className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all">🔍 Procurar Squads</button>
                                <button onClick={() => setShowCreateModal(true)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">+ Criar o meu Squad</button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                            {mySquads.map((squad) => (
                                <div key={squad.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-blue-400 transition-all group">
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
                                    <h3 className="text-xl font-bold mb-1 text-slate-800">{squad.nomeSquad}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{squad.descricao || "Sem descrição."}</p>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <button className="text-xs font-bold text-slate-400 hover:text-blue-600">+ Convidar</button>
                                        <button onClick={() => openSquadDetails(squad)} className="text-xs font-bold text-blue-600 hover:underline">Ver Squad</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeView === 'detail' && selectedSquad && (
                <div className="animate-in slide-in-from-right-8 duration-500 max-w-5xl">
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => { setActiveView('list'); setIsEditing(false); }} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 transition-colors">
                            <span className="text-xl">←</span> Voltar aos Squads
                        </button>
                        <button onClick={() => setShowCreateActionModal(true)} className="px-6 py-3 bg-amber-500 text-white rounded-full text-sm font-bold hover:bg-amber-600 transition-all shadow-md flex items-center gap-2">
                            <span className="text-lg">⚙️</span> Criar Action
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative">
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 text-slate-300 hover:text-blue-500 p-2 transition-all" title="Editar Squad">
                                <span className="text-2xl">✏️</span>
                            </button>
                        )}

                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="w-32 h-32 bg-slate-100 rounded-3xl flex items-center justify-center text-5xl shrink-0">🛡️</div>
                            
                            <div className="flex-1 space-y-4">
                                {!isEditing ? (
                                    <>
                                        <h1 className="text-4xl font-bold text-slate-800 pr-12">{selectedSquad.nomeSquad}</h1>
                                        <p className="text-slate-500 text-lg">{selectedSquad.descricao || "Este squad ainda não tem uma descrição oficial."}</p>
                                        
                                        <div className="pt-8 border-t border-slate-100 mt-8">
                                            <h3 className="text-xl font-bold text-slate-800 mb-4">Membros ({selectedSquad.users?.length || 0})</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedSquad.users && selectedSquad.users.map((user: any) => (
                                                    <div key={user.id} className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=f8fafc&color=64748b&size=64&bold=true`} alt={user.nome} className="w-8 h-8 rounded-full border border-slate-200"/>
                                                        <p className="text-sm font-bold text-slate-700 leading-none">{user.nome}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 mt-8">
                                            <h3 className="text-xl font-bold text-slate-800 mb-4">Actions Agendadas ({selectedSquad.actions?.length || 0})</h3>
                                            <div className="space-y-4">
                                                {selectedSquad.actions && selectedSquad.actions.map((action: any) => {
                                                    const estadoDinamico = determineEstado(action);
                                                    let corEstado = "bg-slate-100 text-slate-600";
                                                    if (estadoDinamico === 'Planeamento') corEstado = "bg-blue-100 text-blue-700";
                                                    if (estadoDinamico === 'Em curso') corEstado = "bg-amber-100 text-amber-700";
                                                    if (estadoDinamico === 'Concluída') corEstado = "bg-emerald-100 text-emerald-700";
                                                    if (estadoDinamico === 'Cancelado') corEstado = "bg-red-100 text-red-700";

                                                    return (
                                                        <div key={action.id} className="p-5 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50 hover:border-blue-200 transition-colors">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h4 className="font-bold text-slate-800">{action.titulo}</h4>
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${corEstado}`}>{estadoDinamico}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-500 mb-3 line-clamp-1">{action.descricao}</p>
                                                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                                                    <span className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                                                                        📅 {new Date(action.data_hora).toLocaleString('pt-PT').slice(0, 16)}
                                                                    </span>
                                                                    <span className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                                                                        🏷️ {action.categoria}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0 mt-4 md:mt-0">
                                                                {estadoDinamico === 'Planeamento' && (
                                                                    <>
                                                                        {/* BOTÃO EDITAR */}
                                                                        <button onClick={() => openEditActionModal(action)} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all">
                                                                            ✏️ Editar
                                                                        </button>
                                                                        <button onClick={() => confirmCancelAction(action.id)} className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                                                                            ❌ Cancelar
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 max-w-lg">
                                        <input type="text" value={editForm.nomeSquad} onChange={(e) => setEditForm({...editForm, nomeSquad: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-2xl"/>
                                        <textarea value={editForm.descricao} onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-32 resize-none"/>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => { setIsEditing(false); setEditForm({ nomeSquad: selectedSquad.nomeSquad, descricao: selectedSquad.descricao || '' }); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                                            <button onClick={handleEditSquad} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md">Guardar Alterações</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CRIAR SQUAD */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">Novo Squad</h3>
                        <form onSubmit={handleCreateSquad} className="space-y-4">
                            <input type="text" placeholder="Nome do Squad" value={createForm.nomeSquad} onChange={e => setCreateForm({...createForm, nomeSquad: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                            <textarea placeholder="Descrição do Squad..." value={createForm.descricao} onChange={e => setCreateForm({...createForm, descricao: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none h-32 resize-none focus:border-blue-500" />
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg"> Criar Squad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CRIAR ACTION */}
            {showCreateActionModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">⚙️ Nova Action</h3>
                        <form onSubmit={handleCreateAction} className="space-y-4">
                            <input type="text" placeholder="Título da Action" value={actionForm.titulo} onChange={e => setActionForm({...actionForm, titulo: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" required />
                            <input type="text" placeholder="Categoria (ex: Desporto, Reunião)" value={actionForm.categoria} onChange={e => setActionForm({...actionForm, categoria: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" required />
                            
                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-2">Data e Hora</label>
                                <input type="datetime-local" min={getMinDateTime()} value={actionForm.dataHora} onChange={e => setActionForm({...actionForm, dataHora: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" required />
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Morada (ex: Torre de Belém, Lisboa)" value={actionForm.morada} onChange={e => setActionForm({...actionForm, morada: e.target.value, latitude: undefined, longitude: undefined})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" />
                                    <button type="button" onClick={() => handleGetCoordinates(false)} className="px-5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all text-sm shrink-0">📍 Procurar</button>
                                </div>
                                {actionForm.latitude && actionForm.longitude && (
                                    <div className="text-xs text-emerald-600 font-bold px-2 flex items-center gap-1">
                                        <span>✓</span> Localização guardada (Lat: {actionForm.latitude}, Lng: {actionForm.longitude})
                                    </div>
                                )}
                            </div>

                            <textarea placeholder="Descrição detalhada..." value={actionForm.descricao} onChange={e => setActionForm({...actionForm, descricao: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none h-24 resize-none focus:border-amber-500" />
                            
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateActionModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-amber-500 rounded-full shadow-lg hover:bg-amber-600 transition-all">Criar Action</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDITAR ACTION (NOVO) */}
            {showEditActionModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">✏️ Editar Action</h3>
                        <form onSubmit={handleEditActionSubmit} className="space-y-4">
                            <input type="text" placeholder="Título da Action" value={editActionForm.titulo} onChange={e => setEditActionForm({...editActionForm, titulo: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                            <input type="text" placeholder="Categoria (ex: Desporto, Reunião)" value={editActionForm.categoria} onChange={e => setEditActionForm({...editActionForm, categoria: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                            
                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-2">Data e Hora</label>
                                <input type="datetime-local" value={editActionForm.dataHora} onChange={e => setEditActionForm({...editActionForm, dataHora: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Pesquisar nova morada..." value={editActionForm.morada} onChange={e => setEditActionForm({...editActionForm, morada: e.target.value, latitude: undefined, longitude: undefined})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" />
                                    <button type="button" onClick={() => handleGetCoordinates(true)} className="px-5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all text-sm shrink-0">📍 Procurar</button>
                                </div>
                                {editActionForm.latitude && editActionForm.longitude && (
                                    <div className="text-xs text-emerald-600 font-bold px-2 flex items-center gap-1">
                                        <span>✓</span> Localização atualizada (Lat: {editActionForm.latitude}, Lng: {editActionForm.longitude})
                                    </div>
                                )}
                            </div>

                            <textarea placeholder="Descrição detalhada..." value={editActionForm.descricao} onChange={e => setEditActionForm({...editActionForm, descricao: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none h-24 resize-none focus:border-blue-500" />
                            
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditActionModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-all">Guardar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CANCELAR ACTION */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="text-5xl mb-6">⚠️</div>
                        <h3 className="text-2xl font-bold mb-2 text-slate-800">Cancelar Action?</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">Tens a certeza que pretendes cancelar esta Action? Esta operação não pode ser desfeita.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowCancelModal(false); setActionToCancel(null); }} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">Voltar</button>
                            <button onClick={executeCancelAction} className="flex-1 py-4 font-bold text-white bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-all">Sim, Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PROCURAR SQUADS */}
            {showSearchModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Procurar Squad</h3>
                            <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl">&times;</button>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-4 flex-1">
                            {globalSquads.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">Não há squads novos disponíveis para entrar no momento.</p>
                            ) : (
                                globalSquads.map((squad) => (
                                    <div key={squad.id} className="p-5 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-blue-300 bg-slate-50">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{squad.nomeSquad}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-1">{squad.descricao || "Sem descrição"}</p>
                                        </div>
                                        <button onClick={() => handleJoinSquad(squad.id)} className="ml-4 px-5 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shrink-0">Entrar</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};