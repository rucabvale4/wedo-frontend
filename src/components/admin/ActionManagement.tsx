import { useState, useEffect } from 'react';

interface ActionManagementProps {
    token: string;
}

export const ActionManagement = ({ token }: ActionManagementProps) => {
    const [actions, setActions] = useState<any[]>([]);
    const [squads, setSquads] = useState<any[]>([]);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState<any>(null);
    
    const [formData, setFormData] = useState({ 
        titulo: '', categoria: '', descricao: '', squadId: '', estado: 'Planeamento', data_hora: '',
        morada: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined 
    }); 
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionToDelete, setActionToDelete] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resActions, resSquads] = await Promise.all([
                fetch('http://localhost:3000/api/actions', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/squads', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (resActions.ok) setActions(await resActions.json());
            if (resSquads.ok) setSquads(await resSquads.json());
            
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    };

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 1500);
    };

    const handleGetCoordinates = async () => {
        if (!formData.morada) return alert("Escreve uma morada primeiro.");
        try {
            const res = await fetch(`http://localhost:3000/api/actions/coordinates?address=${encodeURIComponent(formData.morada)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, latitude: data.latitude, longitude: data.longitude });
                triggerToast("📍 Localização encontrada!");
            } else {
                alert("Não foi possível encontrar essa localização.");
            }
        } catch (err) {
            alert("Erro ao comunicar com o servidor.");
        }
    };

    const handleSaveAction = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = selectedAction 
            ? `http://localhost:3000/api/actions/${selectedAction.id}` 
            : 'http://localhost:3000/api/actions';
        const method = selectedAction ? 'PATCH' : 'POST';

        const bodyData: any = { 
            ...formData,
            squadId: Number(formData.squadId),
            latitude: formData.latitude,
            longitude: formData.longitude
        };
        
        if (bodyData.data_hora) {
            bodyData.data_hora = new Date(bodyData.data_hora).toISOString();
        } else {
            delete bodyData.data_hora;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
                triggerToast(selectedAction ? 'Action atualizada!' : 'Action criada com sucesso!');
            } else {
                const errorData = await res.json();
                console.error(errorData);
                alert(`Falha: Verifique se os dados estão corretos.`);
            }
        } catch (err) {
            alert("Erro na comunicação com o servidor.");
        }
    };

    const executeDelete = async () => {
        if (!actionToDelete) return;
        try {
            const res = await fetch(`http://localhost:3000/api/actions/${actionToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                setShowDeleteModal(false);
                triggerToast('Action removida!');
            } else {
                alert("Não foi possível eliminar a action.");
            }
        } catch (err) {
            alert("Erro de rede.");
        }
    };

    const getSquadName = (squadId: number) => {
        const squad = squads.find(s => s.id === squadId);
        return squad ? squad.nomeSquad : 'Desconhecido';
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'Data não definida';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('pt-PT')} às ${d.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}`;
    };

    const formatForInput = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    return (
        <section className="bg-white rounded-[2.5rem] shadow-sm border p-10 animate-in fade-in duration-500">
            
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-emerald-400/50">
                        <span className="text-sm">✅</span>
                        <span className="text-xs font-bold tracking-tight">{successMessage}</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 italic">Gestão de Actions</h2>
                <button 
                    onClick={() => { 
                        setSelectedAction(null); 
                        setFormData({ titulo: '', categoria: '', descricao: '', squadId: '', estado: 'Planeamento', data_hora: '', morada: '', latitude: undefined, longitude: undefined }); 
                        setShowModal(true); 
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >
                    + Nova Action
                </button>
            </div>

            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="pb-4">Action</th>
                        <th className="pb-4">Squad Atribuído</th>
                        <th className="pb-4">Data/Hora</th>
                        <th className="pb-4">Estado</th>
                        <th className="pb-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {actions.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-5 font-bold text-slate-700">
                                🎯 {a.titulo}
                                <span className="block text-xs font-normal text-slate-400 mt-1">{a.categoria}</span>
                                {a.latitude && a.longitude && (
                                    <span className="block text-[10px] font-bold text-emerald-600 mt-1">📍 Localização definida</span>
                                )}
                            </td>
                            <td className="py-5 text-slate-600 font-bold text-sm">
                                🛡️ {getSquadName(a.squadId)}
                            </td>
                            <td className="py-5 text-slate-500 text-sm">
                                {formatDateTime(a.data_hora)}
                            </td>
                            <td className="py-5">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${
                                    a.estado === 'Planeamento' ? 'bg-amber-100 text-amber-700' :
                                    a.estado === 'Em Curso' ? 'bg-blue-100 text-blue-700' :
                                    a.estado === 'Concluída' ? 'bg-emerald-100 text-emerald-700' :
                                    a.estado === 'Cancelada' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {a.estado}
                                </span>
                            </td>
                            <td className="py-5 text-right space-x-4">
                                <button 
                                    onClick={() => { 
                                        setSelectedAction(a); 
                                        setFormData({ 
                                            titulo: a.titulo, 
                                            categoria: a.categoria, 
                                            descricao: a.descricao || '', 
                                            squadId: a.squadId.toString(), 
                                            estado: a.estado || 'Planeamento',
                                            data_hora: formatForInput(a.data_hora),
                                            morada: '',
                                            latitude: a.latitude,
                                            longitude: a.longitude
                                        }); 
                                        setShowModal(true); 
                                    }} 
                                    className="text-blue-500 font-bold hover:underline"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => { setActionToDelete(a.id); setShowDeleteModal(true); }} 
                                    className="text-red-400 font-bold hover:underline"
                                >
                                    Apagar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {actions.length === 0 && (
                        <tr><td colSpan={5} className="py-10 text-center text-slate-300 italic">Nenhuma action em sistema.</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">
                            {selectedAction ? '📝 Editar Action' : '🎯 Nova Action'}
                        </h3>
                        <form onSubmit={handleSaveAction} className="space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Título</label>
                                    <input type="text" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Categoria</label>
                                    <input type="text" placeholder="Ex: Desporto, Social..." value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Atribuir ao Squad</label>
                                    <select value={formData.squadId} onChange={e => setFormData({ ...formData, squadId: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-slate-700" required>
                                        <option value="" disabled>Selecione um Squad...</option>
                                        {squads.map(s => <option key={s.id} value={s.id}>{s.nomeSquad}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Estado</label>
                                    <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-slate-700" required>
                                        <option value="Planeamento">Planeamento</option>
                                        <option value="Em Curso">Em Curso</option>
                                        <option value="Concluída">Concluída</option>
                                        <option value="Cancelada">Cancelada</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Data e Hora (Opcional)</label>
                                <input type="datetime-local" value={formData.data_hora} onChange={e => setFormData({ ...formData, data_hora: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500" />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 block">Localização (Opcional)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Morada (ex: Padrão dos Descobrimentos)" 
                                        value={formData.morada} 
                                        onChange={e => setFormData({ ...formData, morada: e.target.value, latitude: undefined, longitude: undefined })} 
                                        className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleGetCoordinates} 
                                        className="px-5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all text-sm shrink-0"
                                    >
                                        📍 Procurar
                                    </button>
                                </div>
                                {formData.latitude && formData.longitude && (
                                    <div className="text-xs text-emerald-600 font-bold px-2 flex items-center gap-1">
                                        <span>✓</span> Localização atualizada (Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)})
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Descrição / Notas</label>
                                <textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 h-24 resize-none" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg shadow-blue-200">Confirmar Action</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto font-bold">🗑️</div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Abortar Action?</h3>
                        <p className="text-slate-500 mb-8 text-sm">Esta ação removerá a action do planeamento definitivamente.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={executeDelete} className="w-full py-4 bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-100">Sim, eliminar</button>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-slate-500 font-bold bg-slate-100 rounded-full hover:bg-slate-200">Manter Action</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};