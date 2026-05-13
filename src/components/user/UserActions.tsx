import { useState, useEffect } from 'react';

interface UserActionsProps {
    token: string;
}

export const UserActions = ({ token }: UserActionsProps) => {
    const [mySquads, setMySquads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMyActions();
    }, []);

    const fetchMyActions = async () => {
        try {
            // Vamos buscar os mesmos dados dos grupos, que já trazem as actions incluídas
            const res = await fetch('http://localhost:3000/api/squads/my-squads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMySquads(data);
            }
        } catch (err) {
            console.error("Erro ao carregar as actions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Mesma função de estado de tempo real
    const determineEstado = (action: any) => {
        if (action.estado === 'Cancelado') return 'Cancelado'; 
        if (!action.data_hora) return action.estado; 

        const now = new Date();
        const actionDate = new Date(action.data_hora);
        const actionEnd = new Date(actionDate.getTime() + 2 * 60 * 60 * 1000); // Duração de 2 horas

        if (now < actionDate) return 'Planeamento';
        if (now >= actionDate && now <= actionEnd) return 'Em curso';
        return 'Concluída';
    };

    return (
        <section className="animate-in fade-in duration-500">
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
                        Ainda não fazes parte de nenhum grupo. <br />
                        Junta-te a um grupo para começares a ver as vossas Actions aqui.
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
                                                    <p className="text-sm text-slate-500 mb-4 max-w-2xl">{action.descricao || "Sem descrição disponível."}</p>
                                                    <div className="flex gap-3 text-xs font-medium text-slate-600">
                                                        <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                            📅 {action.data_hora ? new Date(action.data_hora).toLocaleString('pt-PT').slice(0, 16) : 'Sem data'}
                                                        </span>
                                                        <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                                                            🏷️ {action.categoria}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="shrink-0">
                                                    <button className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm">
                                                        Ver Detalhes
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500">Este grupo ainda não tem missões agendadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};