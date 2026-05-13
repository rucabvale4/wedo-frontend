interface NavbarProps {
    setView: (view: string) => void;
    currentView: string;
    onLogout: () => void; 
}

export const Navbar = ({ setView, currentView, onLogout }: NavbarProps) => {
    const navItems = [
        { id: 'users', label: 'Users' }, 
        { id: 'squads', label: 'Squads' },
        { id: 'actions', label: 'Actions' },
    ];

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <h1 
                onClick={() => setView('home')}
                className="text-xl font-bold tracking-tight text-green-400 cursor-pointer hover:text-green-300 transition-colors"
            >
                WeDo Command Center
            </h1>
            
            <div className="flex items-center gap-6">
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

                <button
                    onClick={onLogout}
                    className="ml-4 p-2 text-slate-400 hover:text-red-500 transition-colors border-l border-slate-700 pl-6"
                >
                    <span className="text-xl font-bold">⏻</span>
                </button>
            </div>
        </nav>
    );
};