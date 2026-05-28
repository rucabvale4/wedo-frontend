import { useState, useEffect } from 'react';

interface UserActionsProps {
    token: string;
}

export const UserActions = ({ token }: UserActionsProps) => {
    const [mySquads, setMySquads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Action Selecionada para os Detalhes (Mapa e Participação)
    const [selectedAction, setSelectedAction] = useState<any>(null);
    const [evidenceUrl, setEvidenceUrl] = useState(''); // NOVO: Estado para a Prova

    // Funcionalidade: Editar Action
    const [showEditActionModal, setShowEditActionModal] = useState(false);
    const [actionToEdit, setActionToEdit] = useState<number | null>(null);
    const [editActionForm, setEditActionForm] = useState({ 
        titulo: '', categoria: '', descricao: '', dataHora: '', 
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    });

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchMyActions();
    }, []);

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 2000);
    };

    const fetchMyActions = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/squads/my-squads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMySquads(data);
                
                // Se um modal de detalhes estiver aberto, atualiza a informação lá dentro também
                setSelectedAction((current: any) => {
                    if (!current) return null;
                    for (const squad of data) {
                        const updatedAction = squad.actions?.find((a: any) => a.id === current.id);
                        if (updatedAction) return { ...updatedAction, squadName: squad.nomeSquad };
                    }
                    return current;
                });
            }
        } catch (err) {
            console.error("Erro ao carregar as actions:", err);
        } finally {
            setIsLoading(false);
        }
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

    // --- NOVO: FUNÇÕES DA FRENTE 1 (ACEITAR E PROVAR) ---
    const handleParticipate = async (actionId: number) => {
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionId}/participate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                triggerToast("✋ Missão aceite! Vemo-nos no terreno!");
                fetchMyActions(); 
            } else {
                alert("Atenção Backend: Rota POST /api/actions/:id/participate em falta!");
            }
        } catch (err) { alert("Erro de ligação."); }
    };

    const handleSubmitEvidence = async (actionId: number) => {
        if (!evidenceUrl) return alert("Cola o link da imagem da prova primeiro!");
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionId}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ imagem_url: evidenceUrl })
            });
            if (res.ok) {
                triggerToast("📸 Prova submetida e a aguardar validação!");
                setEvidenceUrl('');
                fetchMyActions();
            } else {
                alert("Atenção Backend: Rota POST /api/actions/:id/evidence em falta!");
            }
        } catch (err) { alert("Erro de ligação."); }
    };

    // --- FIM FRENTE 1 ---

    const handleEditActionGetCoordinates = async () => {
        if (!editActionForm.morada) return alert("Escreve uma morada primeiro.");
        try {
            const res = await fetch(`http://localhost:3000/api/actions/coordinates?address=${encodeURIComponent(editActionForm.morada)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEditActionForm({ ...editActionForm, latitude: data.latitude, longitude: data.longitude });
                triggerToast("📍 Localização atualizada!");
            } else {
                alert("Não foi possível encontrar essa localização.");
            }
        } catch (err) { alert("Erro ao comunicar com o servidor."); }
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
                fetchMyActions();
            } else {
                alert("Erro ao atualizar Action.");
            }
        } catch (err) { alert("Erro de ligação ao servidor."); }
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

            <header className="mb-12">
                <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">
                    Minhas Actions
                </h2>
            </header>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : mySquads.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-200 text-center max-w-2xl">
                    <div className="text-6xl mb-6">⚙️</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Sem Actions Visíveis</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Ainda não fazes parte de nenhum Squad. <br />
                        Junta-te a um Squad para começares a ver as vossas Actions aqui.
                    </p>
                </div>
            ) : (
                <div className="space-y-10 max-w-5xl">
                    {mySquads.map((squad) => (
                        <div key={squad.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <span className="text-3xl bg-slate-50 p-2 rounded-xl">🛡️</span> 
                                {squad.nomeSquad}
                                <span className="text-sm font-normal text-slate-400 ml-auto bg-slate-50 px-3 py-1 rounded-full">
                                    {squad.actions?.length || 0} Actions
                                </span>
                            </h3>

                            <div className="space-y-4">
                                {squad.actions && squad.actions.length > 0 ? (
                                    squad.actions.map((action: any) => {
                                        const estadoDinamico = determineEstado(action);
                                        
                                        let corEstado = "bg-slate-100 text-slate-600";
                                        if (estadoDinamico === 'Planeamento') corEstado = "bg-blue-100 text-blue-700";
                                        if (estadoDinamico === 'Em curso') corEstado = "bg-amber-100 text-amber-700";
                                        if (estadoDinamico === 'Concluída') corEstado = "bg-emerald-100 text-emerald-700";
                                        if (estadoDinamico === 'Cancelado') corEstado = "bg-red-100 text-red-700";

                                        return (
                                            <div key={action.id} className="p-6 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-amber-300 transition-colors bg-slate-50/50">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-lg font-bold text-slate-800">{action.titulo}</h4>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${corEstado}`}>
                                                            {estadoDinamico}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mb-4 max-w-2xl line-clamp-1">{action.descricao || "Sem descrição disponível."}</p>
                                                    <div className="flex gap-3 text-xs font-medium text-slate-600 flex-wrap">
                                                        <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1 font-bold text-slate-700">
                                                            🛡️ {squad.nomeSquad}
                                                        </span>
                                                        {action.data_hora ? (
                                                            <>
                                                                <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                                    📅 {new Date(action.data_hora).toLocaleDateString('pt-PT')}
                                                                </span>
                                                                <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                                    ⏰ {new Date(action.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                                📅 Sem data
                                                            </span>
                                                        )}
                                                        <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                            🏷️ {action.categoria}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="shrink-0 flex gap-2 mt-4 md:mt-0">
                                                    {estadoDinamico === 'Planeamento' && (
                                                        <button 
                                                            onClick={() => openEditActionModal(action)}
                                                            className="px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm"
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => setSelectedAction({...action, squadName: squad.nomeSquad})}
                                                        className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
                                                    >
                                                        🔍 Detalhes
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500">Este Squad ainda não tem missões agendadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: VER DETALHES DA ACTION & MAPA */}
            {selectedAction && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{selectedAction.titulo}</h3>
                                <div className="flex gap-2 items-center mt-1">
                                    <span className="text-sm font-bold text-amber-500">{selectedAction.categoria}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-sm font-bold text-slate-500">🛡️ {selectedAction.squadName}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAction(null)} className="text-slate-400 hover:text-slate-700 text-3xl leading-none">&times;</button>
                        </div>

                        <div className="space-y-6">
                            
                            {/* --- NOVO: BLOCO DE ACEITAÇÃO DA FRENTE 1 --- */}
                            <div className="p-5 border-2 border-slate-100 rounded-2xl bg-white shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">🎯 Estado da Missão</h4>
                                
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>Progresso de Mobilização</span>
                                        <span>{selectedAction.participations?.length || 0} Aceitaram</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        {/* A percentagem assume um target de 10 apenas para a demo visual, podes mudar a lógica */}
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(((selectedAction.participations?.length || 0) / 10) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button onClick={() => handleParticipate(selectedAction.id)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                                        ✋ Aceitar Missão
                                    </button>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="url" 
                                            placeholder="Cola aqui o link da prova fotográfica..." 
                                            value={evidenceUrl}
                                            onChange={(e) => setEvidenceUrl(e.target.value)}
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                                        />
                                        <button onClick={() => handleSubmitEvidence(selectedAction.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm shrink-0">
                                            📸 Enviar Prova
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* --- FIM BLOCO FRENTE 1 --- */}

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2">Descrição da Missão</h4>
                                <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedAction.descricao || "Nenhuma descrição fornecida."}</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data</h4>
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        📅 {selectedAction.data_hora ? new Date(selectedAction.data_hora).toLocaleDateString('pt-PT') : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hora</h4>
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        ⏰ {selectedAction.data_hora ? new Date(selectedAction.data_hora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* MAPA OPENSTREETMAP */}
                            {selectedAction.latitude && selectedAction.longitude ? (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2 flex items-center gap-2">
                                        📍 Localização no Mapa
                                    </h4>
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 relative h-48">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedAction.longitude - 0.005},${selectedAction.latitude - 0.005},${selectedAction.longitude + 0.005},${selectedAction.latitude + 0.005}&layer=mapnik&marker=${selectedAction.latitude},${selectedAction.longitude}`}
                                        ></iframe>
                                    </div>
                                    <p className="text-xs text-center mt-2">
                                        <a 
                                            href={`https://www.openstreetmap.org/?mlat=${selectedAction.latitude}&mlon=${selectedAction.longitude}#map=18/${selectedAction.latitude}/${selectedAction.longitude}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-blue-500 hover:text-blue-700 hover:underline font-bold"
                                        >
                                            Abrir num separador maior ↗
                                        </a>
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-dashed border-slate-200">
                                    <p className="text-sm font-bold text-slate-400">📍 Sem localização definida.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedAction(null)} className="px-8 py-3 font-bold text-white bg-slate-800 rounded-full hover:bg-slate-900 transition-all shadow-md">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDITAR ACTION */}
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
                                    <button type="button" onClick={handleEditActionGetCoordinates} className="px-5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all text-sm shrink-0">📍 Procurar</button>
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
        </section>
    );
};