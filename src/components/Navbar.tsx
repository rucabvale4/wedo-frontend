interface NavbarProps {
    setView: (view: string) => void;
    currentView: string;
    onLogout: () => void; // Nova prop para o Logout
}

export const Navbar = ({ setView, currentView, onLogout }: NavbarProps) => {
    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'users', label: 'Users' }, // Adicionado Users
        { id: 'squads', label: 'Squads' },
        { id: 'actions', label: 'Actions' },
    ];

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <h1 className="text-xl font-bold tracking-tight text-green-400">WeDo Command Center</h1>
            
            <div className="flex items-center gap-6">
                {/* Menu de Navegação Central */}
                <div className="flex gap-2">
                    {navItems.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setView(id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                currentView === id
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Símbolo de Logout à direita */}
                <button
                    onClick={onLogout}
                    title="Terminar Sessão"
                    className="ml-4 p-2 text-slate-400 hover:text-red-500 transition-colors border-l border-slate-700 pl-6"
                >
                    <span className="text-xl font-bold">⏻</span>
                </button>
            </div>
        </nav>
    );
};