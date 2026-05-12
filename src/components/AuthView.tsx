import { useState } from 'react';
import logoImg from '../logo.png'; 

interface AuthViewProps {
    onLoginSuccess: (token: string, role: string) => void;
}

export const AuthView = ({ onLoginSuccess }: AuthViewProps) => {
    // Gestão de estados do formulário e interface
    const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Função de Autenticação (Login)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                // Passa o Token e a Role para o App.tsx
                onLoginSuccess(data.token, data.role); 
            } else {
                setError(data.error || 'Credenciais inválidas');
            }
        } catch (err) {
            setError('Servidor offline. Verifique a porta 3000.');
        }
    };

    // Função de Registo (Sign in)
    const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nome: name, 
                email: email, 
                password: password,
                role: 'USER' // ← ADICIONA ESTA LINHA
            }),
        });

        const data = await response.json();

        if (response.ok) {
            setSuccess('Conta criada com sucesso!');
            setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
        } else {
            // Se falhar, vamos ver o que está dentro do Array de detalhes
            console.error("Detalhes do erro de validação:", data.detalhes);
            setError(data.error || 'Dados inválidos. Verifique a password (min. 6/8 chars).');
        }
    } catch (err) {
        setError('Erro ao ligar ao servidor');
    }
};

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center">
                
                {/* Header com Logo */}
                <div className="flex flex-col items-center mb-10">
                    <img src={logoImg} alt="WeDo Logo" className="w-20 h-20 mb-3 object-contain" />
                    <h1 className="text-5xl font-light tracking-widest text-slate-700 italic">WeDo</h1>
                </div>

                {/* Ecrã de Boas-vindas (Welcome) */}
                {mode === 'welcome' && (
                    <div className="flex flex-col gap-5 w-full">
                        <button 
                            onClick={() => setMode('login')}
                            className="w-full py-4 border-2 border-slate-300 rounded-full text-slate-600 font-medium text-lg hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => setMode('register')}
                            className="w-full py-4 border-2 border-slate-300 rounded-full text-slate-600 font-medium text-lg hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Sign in
                        </button>
                    </div>
                )}

                {/* Formulário de Login */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 text-left">
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border-b-2 border-slate-200 focus:border-green-500 outline-none transition-colors" required />
                        <input type="password" placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border-b-2 border-slate-200 focus:border-green-500 outline-none transition-colors" required />
                        {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                        <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-full font-bold text-lg hover:bg-slate-900 transition-colors shadow-lg mt-4">ENTRAR</button>
                        <button type="button" onClick={() => setMode('welcome')} className="text-slate-400 text-sm hover:text-slate-600 transition-colors mt-2 text-center w-full">Voltar</button>
                    </form>
                )}

                {/* Formulário de Registo (Sign in) */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="w-full flex flex-col gap-4 text-left">
                        <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border-b-2 border-slate-200 focus:border-green-500 outline-none transition-colors" required />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border-b-2 border-slate-200 focus:border-green-500 outline-none transition-colors" required />
                        <input type="password" placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border-b-2 border-slate-200 focus:border-green-500 outline-none transition-colors" required />
                        {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                        {success && <p className="text-green-600 text-xs text-center font-medium">{success}</p>}
                        <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-full font-bold text-lg hover:bg-slate-900 transition-colors shadow-lg mt-4">CRIAR CONTA</button>
                        <button type="button" onClick={() => setMode('welcome')} className="text-slate-400 text-sm hover:text-slate-600 transition-colors mt-2 text-center w-full">Voltar</button>
                    </form>
                )}

                {/* Secção de Contas de Teste (Mock Accounts) */}
                <div className="mt-10 pt-6 border-t border-slate-100 w-full text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Contas de Teste</p>
                    <div className="flex flex-col gap-3">
                        {/* Admin Account */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Admin</p>
                            <p className="text-xs text-slate-600 font-mono">user: <span className="text-slate-900 font-bold">admin1@wedo.pt</span></p>
                            <p className="text-xs text-slate-600 font-mono">pass: <span className="text-slate-900 font-bold">admin123</span></p>
                        </div>
                        {/* User Account */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">User</p>
                            <p className="text-xs text-slate-600 font-mono">user: <span className="text-slate-900 font-bold">user1@wedo.pt</span></p>
                            <p className="text-xs text-slate-600 font-mono">pass: <span className="text-slate-900 font-bold">user123</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};