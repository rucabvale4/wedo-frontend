import { useState, useEffect } from 'react';

interface UserActionsProps {
    token: string;
    userData?: any;
}

const EvidenceUploadActions = ({ evidenceFile, setEvidenceFile, onSubmit }: { evidenceFile: File | null; setEvidenceFile: (f: File | null) => void; onSubmit: () => void }) => (
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

export const UserActions = ({ token, userData }: UserActionsProps) => {
    const [mySquads, setMySquads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedAction, setSelectedAction] = useState<any>(null);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

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

    const handleParticipate = async (actionId: number) => {
        const isParticipating = userData && selectedAction?.participations?.some((p: any) => p.userId === userData.id);
        const method = isParticipating ? 'DELETE' : 'POST';
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionId}/participate`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                triggerToast(isParticipating ? "Participação cancelada." : "✋ Action aceite! Vemo-nos lá!");
                fetchMyActions();
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
                fetchMyActions();
            } else {
                triggerToast("Erro ao submeter prova.");
            }
        } catch (err) { triggerToast("Erro de ligação."); }
    };

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
                    Actions
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
                                        <p className="text-slate-500">Este Squad ainda não tem actions agendadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                            
                            {(() => {
                                const estado = determineEstado(selectedAction);
                                const isParticipating = userData && selectedAction?.participations?.some((p: any) => p.userId === userData.id);

                                return (
                                    <div className="p-5 border-2 border-slate-100 rounded-2xl bg-white shadow-sm space-y-4">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">🎯 Estado da Action
                                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                estado === 'Planeamento' ? 'bg-blue-100 text-blue-700' :
                                                estado === 'Em curso' ? 'bg-amber-100 text-amber-700' :
                                                estado === 'Concluída' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>{estado}</span>
                                        </h4>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                                <span>Confirmações</span>
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
                                            <p className="text-center py-3 text-sm font-bold text-red-500 bg-red-50 rounded-xl border border-red-100">Esta action foi cancelada.</p>
                                        )}

                                        {estado === 'Planeamento' && (
                                            <>
                                                <button onClick={() => handleParticipate(selectedAction.id)} className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isParticipating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                                    {isParticipating ? '❌ Cancelar Participação' : '✋ Aceitar Action'}
                                                </button>
                                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Provas disponíveis quando a action começar</p>
                                            </>
                                        )}

                                        {estado === 'Em curso' && (
                                            <>
                                                <button onClick={() => handleParticipate(selectedAction.id)} className={`w-full py-3 rounded-xl text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isParticipating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                                    {isParticipating ? '❌ Cancelar Participação' : '✋ Aceitar Action'}
                                                </button>
                                                <EvidenceUploadActions evidenceFile={evidenceFile} setEvidenceFile={setEvidenceFile} onSubmit={() => handleSubmitEvidence(selectedAction.id)} />
                                            </>
                                        )}

                                        {estado === 'Concluída' && (
                                            <EvidenceUploadActions evidenceFile={evidenceFile} setEvidenceFile={setEvidenceFile} onSubmit={() => handleSubmitEvidence(selectedAction.id)} />
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

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2">Descrição da Action</h4>
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