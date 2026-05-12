import { useState, useEffect } from 'react';

interface SquadManagementProps {
    token: string;
}

export const SquadManagement = ({ token }: SquadManagementProps) => {
    const [squads, setSquads] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSquad, setSelectedSquad] = useState<any>(null);
    const [formData, setFormData] = useState({ nomeSquad: '', descricao: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [squadToDelete, setSquadToDelete] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/squads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSquads(await res.json());
        } catch (err) { console.error("Erro ao carregar:", err); }
    };

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 1500);
    };

    // --- FUNÇÃO DE EDITAR / CRIAR (FUNCIONAL) ---
    const handleSaveSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("A enviar dados:", formData); // Ver no F12 se os dados estão corretos

    const url = selectedSquad 
        ? `http://localhost:3000/api/squads/${selectedSquad.id}` 
        : 'http://localhost:3000/api/squads';
    
    const method = selectedSquad ? 'PATCH' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setShowModal(false);
            fetchData();
            triggerToast(selectedSquad ? 'Squad atualizado!' : 'Squad criado!');
            setSelectedSquad(null);
        } else {
            // ISTO VAI MOSTRAR PORQUE É QUE NÃO FUNCIONA
            const errorData = await res.json();
            console.error("Erro do servidor:", errorData);
            alert(`Erro: ${errorData.error || 'Falha na validação'}`);
        }
    } catch (err) {
        alert("Erro de ligação ao servidor.");
    }
};
    // --- FUNÇÃO DE APAGAR (FUNCIONAL) ---
    const executeDelete = async () => {
    if (!squadToDelete) return;
    console.log("A apagar squad ID:", squadToDelete);
    
    try {
        const res = await fetch(`http://localhost:3000/api/squads/${squadToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setShowDeleteModal(false);
            fetchData();
            triggerToast('Squad removido!');
            setSquadToDelete(null);
        } else {
            alert("O servidor recusou apagar o squad.");
        }
    } catch (err) {
        alert("Erro de rede ao apagar.");
    }
};

    return (
        <section className="bg-white rounded-[2.5rem] shadow-sm border p-10 animate-in fade-in duration-500 relative">
            
            {/* TOAST DISCRETO */}
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-emerald-400/50">
                        <span className="text-sm">✅</span>
                        <span className="text-xs font-bold">{successMessage}</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 italic">Gestão de Squads</h2>
                <button 
                    onClick={() => { setSelectedSquad(null); setFormData({ nomeSquad: '', descricao: '' }); setShowModal(true); }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    + Novo Squad
                </button>
            </div>

            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b">
                        <th className="pb-4">Nome do Grupo</th>
                        <th className="pb-4">Descrição</th>
                        <th className="pb-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {squads.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-5 font-bold text-slate-700">🛡️ {s.nomeSquad}</td>
                            <td className="py-5 text-slate-500 text-sm italic">{s.descricao || "Sem briefing"}</td>
                            <td className="py-5 text-right space-x-4">
                                <button 
                                    onClick={() => { 
                                        setSelectedSquad(s); 
                                        setFormData({ nomeSquad: s.nomeSquad, descricao: s.descricao || '' }); 
                                        setShowModal(true); 
                                    }} 
                                    className="text-blue-500 font-bold hover:underline"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => { setSquadToDelete(s.id); setShowDeleteModal(true); }} 
                                    className="text-red-400 font-bold hover:underline"
                                >
                                    Apagar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL EDITAR/CRIAR */}
            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">{selectedSquad ? '📝 Editar' : '🛡️ Novo'} Squad</h3>
                        <form onSubmit={handleSaveSquad} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Nome do Squad" 
                                value={formData.nomeSquad} 
                                onChange={e => setFormData({...formData, nomeSquad: e.target.value})} 
                                className="w-full p-4 bg-slate-50 rounded-2xl border outline-none" 
                                required 
                            />
                            <textarea 
                                placeholder="Descrição" 
                                value={formData.descricao} 
                                onChange={e => setFormData({...formData, descricao: e.target.value})} 
                                className="w-full p-4 bg-slate-50 rounded-2xl border outline-none h-32 resize-none" 
                            />
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full">Sair</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL APAGAR */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">⚠️</div>
                        <h3 className="text-2xl font-bold mb-2">Eliminar Squad?</h3>
                        <p className="text-slate-500 mb-8 text-sm text-balance">Esta ação é definitiva e removerá todos os acessos deste grupo.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={executeDelete} className="w-full py-4 bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-100">Sim, eliminar</button>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-slate-500 font-bold bg-slate-100 rounded-full">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};