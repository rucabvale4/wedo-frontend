import { useState, useEffect } from 'react';
import { UserSquads } from './user/UserSquads';
import { UserProfile } from './user/UserProfile';
import { UserFeed } from './user/UserFeed';
import { UserActions } from './user/UserActions';
import { UserFriends } from './user/UserFriends';

interface UserPortalProps {
    token?: string; 
    onLogout: () => void;
}

export const UserPortal = ({ token, onLogout }: UserPortalProps) => {
    const [currentView, setCurrentView] = useState('feed');
    const [userData, setUserData] = useState<any>(null);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    
    const [perfilColor, setPerfilColor] = useState(() => {
        return localStorage.getItem('wedo_profile_color') || '2563eb';
    });

    const authToken = token || localStorage.getItem('wedo_token'); 

    useEffect(() => {
        const fetchMyProfile = async () => {
            if (!authToken) return;
            try {
                const res = await fetch('http://localhost:3000/api/users/me', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) {
                    setUserData(await res.json());
                }
            } catch (err) {
                console.error("Erro de radar:", err);
            }
        };
        fetchMyProfile();
    }, [authToken]);

    const menuItems = [
        { id: 'feed', label: 'Feed Principal', icon: '🏠' },
        { id: 'squads', label: 'Squads', icon: '🛡️' },
        { id: 'actions', label: 'Actions', icon: '⚙️' },
        { id: 'friends', label: 'Amigos', icon: '👥' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden text-slate-800 relative">
            
            <aside 
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
                className={`${isSidebarHovered ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-slate-900 text-white flex flex-col justify-between shadow-2xl shrink-0 z-20 relative`}
            >
                <div>
                    {userData ? (
                        <div className={`flex flex-col items-center justify-center pt-8 border-b border-slate-800 mb-6 transition-all duration-300 ${isSidebarHovered ? 'pb-4 mx-4' : 'pb-6 mx-2'}`}>
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome)}&background=${perfilColor}&color=fff&size=128&bold=true`} 
                                alt="Avatar" 
                                className={`${isSidebarHovered ? 'w-16 h-16 mb-3' : 'w-10 h-10'} rounded-full border-2 border-slate-800 shadow-lg shrink-0 transition-all`}
                            />
                            <div className={`flex flex-col items-center overflow-hidden transition-all duration-300 ${isSidebarHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <p className="text-base font-bold text-slate-200 truncate w-full text-center px-2">{userData.nome}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate text-center w-full px-2">{userData.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-8 flex justify-center"><div className="w-10 h-10 bg-slate-800 animate-pulse rounded-full"></div></div>
                    )}

                    <nav className={`space-y-2 transition-all duration-300 ${isSidebarHovered ? 'px-4' : 'px-2'}`}>
                        {menuItems.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => setCurrentView(item.id)} 
                                className={`w-full flex items-center py-3 rounded-xl transition-all ${isSidebarHovered ? 'px-4 gap-4' : 'justify-center'} ${currentView === item.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                <span className="text-xl shrink-0">{item.icon}</span>
                                <span className={`font-medium text-sm overflow-hidden transition-all duration-300 whitespace-nowrap flex-1 text-left ${isSidebarHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className={`border-t border-slate-800 space-y-1 transition-all duration-300 ${isSidebarHovered ? 'p-4' : 'p-2'}`}>
                    <button 
                        onClick={() => setCurrentView('profile')} 
                        className={`w-full flex items-center py-3 rounded-xl transition-all ${isSidebarHovered ? 'px-4 gap-4' : 'justify-center'} ${currentView === 'profile' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <span className="text-xl shrink-0">👤</span> 
                        <span className={`font-medium overflow-hidden transition-all duration-300 whitespace-nowrap flex-1 text-left ${isSidebarHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
                            Meu Perfil
                        </span>
                    </button>
                    
                    <button 
                        onClick={onLogout} 
                        className={`w-full flex items-center py-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all mt-4 ${isSidebarHovered ? 'px-4 gap-4' : 'justify-center'}`}
                    >
                        <span className="text-xl shrink-0">⏻</span> 
                        <span className={`font-bold overflow-hidden transition-all duration-300 whitespace-nowrap flex-1 text-left ${isSidebarHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
                            Sair
                        </span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-12 z-0 relative">
                
                {currentView === 'feed' && authToken && (
                    <UserFeed token={authToken} userData={userData} />
                )}
                
                {currentView === 'squads' && authToken && (
                    <UserSquads token={authToken} userData={userData} />
                )}
                
                {currentView === 'actions' && authToken && (
                    <UserActions token={authToken} />
                )}
                
                {/* FIX #7: userData passado para UserFriends para filtrar o próprio utilizador */}
                {currentView === 'friends' && authToken && (
                    <UserFriends token={authToken} userData={userData} />
                )}
                
                {currentView === 'profile' && userData && authToken && (
                    <UserProfile 
                        userData={userData} 
                        token={authToken}
                        perfilColor={perfilColor}
                        setPerfilColor={setPerfilColor}
                        onUpdateSuccess={(newData) => setUserData({ ...userData, ...newData })}
                    />
                )}
            </main>
        </div>
    );
};