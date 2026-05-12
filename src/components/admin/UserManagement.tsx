import { useState, useEffect } from 'react';

interface UserManagementProps {
    token: string;
}

export const UserManagement = ({ token }: UserManagementProps) => {
    // ESTADOS
    const [users, setUsers] = useState<any[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formData, setFormData] = useState({ nome: '', email: '', password: '', role: 'USER' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // CARREGAR DADOS
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) {
            console.error("Erro ao carregar utilizadores:", err);
        }
    };

    // FUNÇÕES DE AÇÃO
    const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedUser ? `http://localhost:3000/api/users/${selectedUser.id}` : 'http://localhost:3000/api/users';
    const method = selectedUser ? 'PATCH' : 'POST';

    const bodyData: any = { ...formData };
    if (selectedUser && !bodyData.password) delete bodyData.password;

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
            setShowUserModal(false);
            fetchData();
            setSuccessMessage(selectedUser ? 'Utilizador atualizado!' : 'Utilizador registado!');
            setTimeout(() => setSuccessMessage(''), 1500);
        } else {
            // DAR VOZ AO ERRO
            const errorData = await res.json();
            alert(`Falha: ${errorData.error || 'Verifique os dados'}`);
        }
    } catch (err) {
        alert("Erro ao guardar utilizador.");
    }
};

    const executeDelete = async () => {
    if (!userToDelete) return;
    try {
        const res = await fetch(`http://localhost:3000/api/users/${userToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            fetchData();
            setShowDeleteModal(false);

            // --- NOTIFICAÇÃO DISCRETA ---
            setSuccessMessage('Utilizador removido!');
            
            // O mesmo tempo curto (1.5s) que definimos para os outros
            setTimeout(() => setSuccessMessage(''), 1500);
        }
    } catch (err) {
        alert("Erro ao apagar.");
    }
};

    return (
        <section className="bg-white rounded-[2.5rem] shadow-sm border p-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 italic">Gestão de Utilizadores</h2>
                <button 
                    onClick={() => { 
                        setSelectedUser(null); 
                        setFormData({nome:'', email:'', password:'', role:'USER'}); 
                        setShowUserModal(true); 
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >
                    + Novo Registo
                </button>
            </div>

            <table className="w-full text-left">
                <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="pb-4">Nome</th>
                        <th className="pb-4">Email</th>
                        <th className="pb-4">Cargo</th>
                        <th className="pb-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-5 font-bold text-slate-700">{u.nome}</td>
                            <td className="py-5 text-slate-500 text-sm">{u.email}</td>
                            <td className="py-5">
                                <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-md uppercase text-slate-500">
                                    {u.role}
                                </span>
                            </td>
                            <td className="py-5 text-right space-x-4">
                                <button 
                                    onClick={() => { 
                                        setSelectedUser(u); 
                                        setFormData({nome:u.nome, email:u.email, password:'', role:u.role}); 
                                        setShowUserModal(true); 
                                    }} 
                                    className="text-blue-500 font-bold hover:underline"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => { setUserToDelete(u.id); setShowDeleteModal(true); }} 
                                    className="text-red-400 font-bold hover:underline"
                                >
                                    Apagar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL EDITAR / CRIAR */}
            {showUserModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">{selectedUser ? '📝 Editar' : '👤 Novo'} Utilizador</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <input type="text" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none" required />
                            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none" required />
                            <input type="password" placeholder={selectedUser ? "Vazio p/ manter" : "Password (min. 6)"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none" required={!selectedUser} minLength={6} />
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold">
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-full">Sair</button>
                                <button type="submit" className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">⚠️</div>
                        <h3 className="text-2xl font-bold mb-2 text-slate-800">Eliminar?</h3>
                        <p className="text-slate-500 mb-8 text-sm">Esta ação não pode ser revertida.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={executeDelete} className="w-full py-4 bg-red-500 text-white rounded-full font-bold shadow-lg">Sim, eliminar</button>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-slate-500 font-bold bg-slate-100 rounded-full">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST MAIS DISCRETO */}
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/80 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-emerald-400/30">
                        <span className="text-sm">✅</span>
                        <span className="text-s font-bold tracking-tight">{successMessage}</span>
                    </div>
                </div>
            )}
        </section>
    );
};