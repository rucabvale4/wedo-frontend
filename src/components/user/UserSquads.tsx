import { useState, useEffect } from 'react';

interface UserSquadsProps {
    token: string;
    userData?: any;
}

const EvidenceUpload = ({ evidenceFile, setEvidenceFile, onSubmit }: { evidenceFile: File | null; setEvidenceFile: (f: File | null) => void; onSubmit: () => void }) => (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        {evidenceFile ? (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2">
                <img src={URL.createObjectURL(evidenceFile)} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{evidenceFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(evidenceFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setEvidenceFile(null)} className="text-slate-400 hover:text-red-500 font-bold text-lg leading-none shrink-0">✕</button>
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer py-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 transition-colors">
                <span className="text-2xl mb-1">📸</span>
                <span className="text-xs font-bold text-slate-500">Clica para adicionar uma foto</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, GIF, WEBP — máx. 5 MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} />
            </label>
        )}
        {evidenceFile && (
            <button onClick={onSubmit} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm">
                Enviar Prova
            </button>
        )}
    </div>
);

export const UserSquads = ({ token, userData }: UserSquadsProps) => {
    const [mySquads, setMySquads] = useState<any[]>([]);
    const [globalSquads, setGlobalSquads] = useState<any[]>([]);
    
    const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
    const [selectedSquad, setSelectedSquad] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    
    const [showCreateActionModal, setShowCreateActionModal] = useState(false);
    const [actionForm, setActionForm] = useState({ 
        titulo: '', categoria: '', descricao: '', dataHora: '', 
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    });

    const [showEditActionModal, setShowEditActionModal] = useState(false);
    const [actionToEdit, setActionToEdit] = useState<number | null>(null);
    const [editActionForm, setEditActionForm] = useState({ 
        titulo: '', categoria: '', descricao: '', dataHora: '', 
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    });
    
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [actionToCancel, setActionToCancel] = useState<number | null>(null);
    
    const [selectedAction, setSelectedAction] = useState<any>(null);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const [isAiLoading, setIsAiLoading] = useState(false);

    const [createForm, setCreateForm] = useState({ nomeSquad: '', descricao: '' });
    const [editForm, setEditForm] = useState({ nomeSquad: '', descricao: '' });
    const [isEditing, setIsEditing] = useState(false);
    
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchMySquads();
    }, []);

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
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

                setSelectedAction((currentAction: any) => {
                    if (!currentAction) return null;
                    for (const squad of data) {
                        const updated = squad.actions?.find((a: any) => a.id === currentAction.id);
                        if (updated) return updated;
                    }
                    return currentAction;
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

    const handleParticipate = async (actionId: number) => {
        const isParticipating = userData && selectedAction?.participations?.some((p: any) => p.userId === userData.id);
        const method = isParticipating ? 'DELETE' : 'POST';
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionId}/participate`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                triggerToast(isParticipating ? "Participação cancelada." : "✋ Missão aceite! Vemo-nos no terreno!");
                fetchMySquads();
            } else {
                triggerToast("Erro ao atualizar participação.");
            }
        } catch (err) { triggerToast("Erro de ligação."); }
    };

    const handleSubmitEvidence = async (actionId: number) => {
        if (!evidenceFile) return triggerToast("Seleciona uma imagem primeiro.");
        const formData = new FormData();
        formData.append('imagem', evidenceFile);
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionId}/evidence`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                triggerToast(`📸 Prova submetida! +${data.xpGanho} XP`);
                setEvidenceFile(null);
                fetchMySquads();
            } else {
                triggerToast("Erro ao submeter prova.");
            }
        } catch (err) { triggerToast("Erro de ligação."); }
    };

    const handleSuggestMission = async () => {
        if (!actionForm.titulo || actionForm.titulo.trim().length < 2) {
            return triggerToast("Escreve um título antes de pedir à IA.");
        }
        if (!actionForm.categoria || actionForm.categoria.trim().length < 2) {
            return triggerToast("Escreve uma categoria antes de pedir à IA.");
        }
        setIsAiLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/actions/suggest-mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ titulo: actionForm.titulo, categoria: actionForm.categoria })
            });
            if (res.ok) {
                const data = await res.json();
                const lines = (data.suggestion as string).split('\n').map((l: string) => l.trim()).filter(Boolean);
                const tituloLine = lines.find((l: string) => l.toLowerCase().startsWith('título:'));
                const descLine = lines.find((l: string) => l.toLowerCase().startsWith('descrição:'));
                const titulo = tituloLine ? tituloLine.replace(/^título:\s*/i, '') : '';
                const descricao = descLine ? descLine.replace(/^descrição:\s*/i, '') : data.suggestion;
                setActionForm(f => ({
                    ...f,
                    titulo: titulo || f.titulo,
                    descricao
                }));
                triggerToast("✨ Sugestão gerada! Edita à vontade.");
            } else {
                triggerToast("Erro ao comunicar com a IA.");
            }
        } catch {
            triggerToast("Erro de ligação.");
        } finally {
            setIsAiLoading(false);
        }
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
            morada: '', 
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
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[800] animate-in fade-in slide-in-from-top-4 duration-300">
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
                            {mySquads.length > 0 ? "Squads" : "Squads"}
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
                                <div key={squad.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-blue-400 transition-all group cursor-pointer" onClick={() => openSquadDetails(squad)}>
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
                                    <h3 className="text-xl font-bold mb-1 text-slate-800">{squad.nomeSquad}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{squad.descricao || "Sem descrição."}</p>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <span className="text-xs font-bold text-blue-600 group-hover:underline">Ver Squad ↗</span>
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
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative">
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 text-slate-300 hover:text-blue-500 p-2 transition-all" title="Editar Squad">
                                <span className="text-2xl">✏️</span>
                            </button>
                        )}

                        <div className="flex flex-col md:flex-row gap-10 mb-10 border-b border-slate-100 pb-10">
                            <div className="w-32 h-32 bg-slate-100 rounded-3xl flex items-center justify-center text-5xl shrink-0">🛡️</div>
                            
                            <div className="flex-1 space-y-4">
                                {!isEditing ? (
                                    <>
                                        <h1 className="text-4xl font-bold text-slate-800 pr-12">{selectedSquad.nomeSquad}</h1>
                                        <p className="text-slate-500 text-lg">{selectedSquad.descricao || "Este squad ainda não tem uma descrição oficial."}</p>
                                        
                                        <div className="pt-8 border-t border-slate-100 mt-4">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Membros ({selectedSquad.users?.length || 0})</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedSquad.users && selectedSquad.users.map((user: any) => (
                                                    <div key={user.id} className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=f8fafc&color=64748b&size=64&bold=true`} alt={user.nome} className="w-8 h-8 rounded-full border border-slate-200"/>
                                                        <p className="text-sm font-bold text-slate-700 leading-none">{user.nome}</p>
                                                    </div>
                                                ))}
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

                        <div className="animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-800">Actions Agendadas</h3>
                                    <button onClick={() => setShowCreateActionModal(true)} className="px-6 py-2 bg-amber-500 text-white rounded-full text-sm font-bold hover:bg-amber-600 transition-all shadow-md">
                                        + Criar Action
                                    </button>
                                </div>
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
                                                        <span className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">📅 {action.data_hora ? new Date(action.data_hora).toLocaleString('pt-PT').slice(0, 16) : 'Sem Data'}</span>
                                                        <span className="bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">🏷️ {action.categoria}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0 mt-4 md:mt-0">
                                                    {estadoDinamico === 'Planeamento' && (
                                                        <>
                                                            <button onClick={() => openEditActionModal(action)} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all">✏️ Editar</button>
                                                            <button onClick={() => confirmCancelAction(action.id)} className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">❌ Cancelar</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => setSelectedAction(action)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm">Ver Detalhes ↗</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!selectedSquad.actions || selectedSquad.actions.length === 0) && (
                                        <p className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhuma action agendada.</p>
                                    )}
                                </div>
                            </div>
                    </div>
                </div>
            )}

            {selectedAction && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{selectedAction.titulo}</h3>
                                <p className="text-sm font-bold text-amber-500 mt-1">{selectedAction.categoria}</p>
                            </div>
                            <button onClick={() => setSelectedAction(null)} className="text-slate-400 hover:text-slate-700 text-3xl">&times;</button>
                        </div>

                        <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm mb-4">{selectedAction.descricao || "Sem briefing."}</p>

                        {selectedAction.latitude && selectedAction.longitude && (
                            <div className="mb-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">📍 Localização</p>
                                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md h-40">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedAction.longitude - 0.005},${selectedAction.latitude - 0.005},${selectedAction.longitude + 0.005},${selectedAction.latitude + 0.005}&layer=mapnik&marker=${selectedAction.latitude},${selectedAction.longitude}`}
                                    ></iframe>
                                </div>
                            </div>
                        )}

                        {(() => {
                            const estado = determineEstado(selectedAction);
                            const isParticipating = userData && selectedAction?.participations?.some((p: any) => p.userId === userData.id);

                            return (
                                <div className="p-5 border-2 border-slate-100 rounded-2xl space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">🎯 Estado da Missão
                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            estado === 'Planeamento' ? 'bg-blue-100 text-blue-700' :
                                            estado === 'Em curso' ? 'bg-amber-100 text-amber-700' :
                                            estado === 'Concluída' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{estado}</span>
                                    </h4>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                            <span>Mobilização</span>
                                            <span>{selectedAction.participations?.length || 0} confirmados</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(((selectedAction.participations?.length || 0) / 10) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    {selectedAction.participations?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quem vai</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAction.participations.map((p: any) => (
                                                    <div key={p.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.nome || '?')}&background=d1fae5&color=065f46&size=64&bold=true`} alt={p.user?.nome} className="w-5 h-5 rounded-full" />
                                                        <span className="text-xs font-bold text-emerald-800">{p.user?.nome || 'Utilizador'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {estado === 'Cancelado' && (
                                        <p className="text-center py-3 text-sm font-bold text-red-500 bg-red-50 rounded-xl border border-red-100">Esta missão foi cancelada.</p>
                                    )}

                                    {estado === 'Planeamento' && (
                                        <>
                                            <button onClick={() => handleParticipate(selectedAction.id)} className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isParticipating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                                {isParticipating ? '❌ Cancelar Participação' : '✋ Aceitar Missão'}
                                            </button>
                                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Provas disponíveis quando a missão começar</p>
                                        </>
                                    )}

                                    {estado === 'Em curso' && (
                                        <>
                                            <button onClick={() => handleParticipate(selectedAction.id)} className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isParticipating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                                {isParticipating ? '❌ Cancelar Participação' : '✋ Aceitar Missão'}
                                            </button>
                                            <EvidenceUpload evidenceFile={evidenceFile} setEvidenceFile={setEvidenceFile} onSubmit={() => handleSubmitEvidence(selectedAction.id)} />
                                        </>
                                    )}

                                    {estado === 'Concluída' && (
                                        <EvidenceUpload evidenceFile={evidenceFile} setEvidenceFile={setEvidenceFile} onSubmit={() => handleSubmitEvidence(selectedAction.id)} />
                                    )}

                                    {selectedAction.evidences?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Provas Submetidas ({selectedAction.evidences.length})</p>
                                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                                                {selectedAction.evidences.map((ev: any) => (
                                                    <a key={ev.id} href={ev.imagem_url} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors">
                                                        <img src={ev.imagem_url} alt="Prova" className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity" />
                                                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white">
                                                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ev.user?.nome || '?')}&background=f1f5f9&color=475569&size=32&bold=true`} className="w-4 h-4 rounded-full shrink-0" alt={ev.user?.nome} />
                                                            <span className="text-[10px] font-bold text-slate-600 truncate">{ev.user?.nome || 'Utilizador'}</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

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

            {showCreateActionModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">⚙️ Nova Action</h3>
                        <form onSubmit={handleCreateAction} className="space-y-4">
                            <input type="text" placeholder="Título da Action" value={actionForm.titulo} onChange={e => setActionForm({...actionForm, titulo: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" required />
                            <div className="flex gap-2">
                                <input type="text" placeholder="Categoria (ex: Desporto, Social, etc...)" value={actionForm.categoria} onChange={e => setActionForm({...actionForm, categoria: e.target.value})} className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500" required />
                                <button
                                    type="button"
                                    onClick={handleSuggestMission}
                                    disabled={isAiLoading || actionForm.titulo.trim().length < 2 || actionForm.categoria.trim().length < 2}
                                    className="px-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shrink-0 flex items-center gap-1.5"
                                    title="Pedir à IA para sugerir uma descrição de missão"
                                >
                                    {isAiLoading
                                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : '✨'
                                    }
                                    {isAiLoading ? 'A gerar...' : 'Sugerir'}
                                </button>
                            </div>

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