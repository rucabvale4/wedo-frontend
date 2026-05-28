import { useState } from 'react';

interface UserProfileProps {
    userData: any;
    token: string;
    perfilColor: string;
    setPerfilColor: (color: string) => void;
    onUpdateSuccess: (newData: any) => void;
}

const CORES_DISPONIVEIS = [
    { nome: 'Azul WeDo', hex: '2563eb' },
    { nome: 'Esmeralda', hex: '10b981' },
    { nome: 'Violeta', hex: '8b5cf6' },
    { nome: 'Carmesim', hex: 'ef4444' },
    { nome: 'Âmbar', hex: 'f59e0b' },
    { nome: 'Ardósia', hex: '475569' },
];

export const UserProfile = ({ userData, token, perfilColor, setPerfilColor, onUpdateSuccess }: UserProfileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ nome: userData.nome, email: userData.email });
    const [tempColor, setTempColor] = useState(perfilColor);
    const [showColorModal, setShowColorModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const triggerToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 2000);
    };

    const handleSaveChanges = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userData.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                onUpdateSuccess(editForm);
                setIsEditing(false);
                triggerToast("Perfil atualizado com sucesso!");
            }
        } catch (err) {
            triggerToast("Erro de ligação.");
        }
    };

    const confirmColorChange = () => {
        setPerfilColor(tempColor);
        localStorage.setItem('wedo_profile_color', tempColor);
        setShowColorModal(false);
    };

    return (
        <section className="animate-in fade-in duration-500 max-w-4xl">
            {successMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-5 py-2 rounded-xl shadow-lg border border-emerald-400/50">
                        <span className="text-sm">✅</span>
                        <span className="text-xs font-bold tracking-tight">{successMessage}</span>
                    </div>
                </div>
            )}

            <header className="mb-12">
                <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Meu Perfil</h2>
            </header>

            <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-10 relative">
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 text-slate-300 hover:text-blue-500 p-2 transition-all">
                            <span className="text-2xl">✏️</span>
                        </button>
                    )}
                    
                    <div className={`relative w-40 h-40 shrink-0 ${isEditing ? 'group cursor-pointer' : ''}`} onClick={() => isEditing && setShowColorModal(true)}>
                        <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(isEditing ? editForm.nome : userData.nome)}&background=${perfilColor}&color=fff&size=256&bold=true`} 
                            alt="Avatar" 
                            className={`w-full h-full rounded-full shadow-lg border-4 border-slate-50 transition-all ${isEditing ? 'group-hover:scale-105' : ''}`}
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-2xl">🎨</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1">Mudar Cor</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center md:text-left flex-1 space-y-4">
                        {!isEditing ? (
                            <>
                                <h1 className="text-4xl font-bold text-slate-800 pr-12">{userData.nome}</h1>
                                <p className="text-slate-500 font-medium">✉️ {userData.email}</p>
                            </>
                        ) : (
                            <div className="space-y-3 max-w-sm mx-auto md:mx-0">
                                <input type="text" value={editForm.nome} onChange={(e) => setEditForm({...editForm, nome: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-blue-500 font-bold text-xl" />
                                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-blue-500 text-slate-600" />
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => {setIsEditing(false); setEditForm({nome: userData.nome, email: userData.email});}} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">Cancelar</button>
                                    <button onClick={handleSaveChanges} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">Guardar</button>
                                </div>
                            </div>
                        )}
                        <span className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold border inline-block">
                            Membro desde {new Date(userData.createdAt).getFullYear()}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:scale-110 transition-transform">⭐</div>
                        <h4 className="text-slate-400 font-bold uppercase text-[10px] mb-2">Pontos de Experiência</h4>
                        <div className="flex items-baseline gap-2 text-slate-800">
                            <span className="text-6xl font-black">{userData.pontos_experiencia || 0}</span>
                            <span className="text-xl font-bold text-slate-400">XP</span>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 group-hover:scale-110 transition-transform">🔥</div>
                        <h4 className="text-slate-400 font-bold uppercase text-[10px] mb-2">Streak Atual</h4>
                        <div className="flex items-baseline gap-2 text-slate-800">
                            <span className="text-6xl font-black">{userData.streak || 0}</span>
                            <span className="text-xl font-bold text-slate-400">Dias</span>
                        </div>
                    </div>
                </div>
            </div>

            {showColorModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full relative">
                        <button onClick={() => setShowColorModal(false)} className="absolute top-6 right-8 text-slate-300 hover:text-slate-600 text-3xl">&times;</button>
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Cores de Combate</h3>
                            <div className="flex justify-center mb-6">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.nome)}&background=${tempColor}&color=fff&size=128&bold=true`} alt="Preview" className="w-24 h-24 rounded-full shadow-lg border-4 border-slate-50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            {CORES_DISPONIVEIS.map(cor => (
                                <button key={cor.hex} onClick={() => setTempColor(cor.hex)} className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${tempColor === cor.hex ? 'ring-4 ring-slate-200 scale-105' : 'border border-slate-100 hover:scale-110'}`} style={{ backgroundColor: `#${cor.hex}` }}>
                                    {tempColor === cor.hex && <span className="text-xl">🎯</span>}
                                </button>
                            ))}
                        </div>
                        <button onClick={confirmColorChange} className="w-full py-4 font-bold text-white bg-blue-600 rounded-full shadow-lg">Confirmar Cor</button>
                    </div>
                </div>
            )}
        </section>
    );
};