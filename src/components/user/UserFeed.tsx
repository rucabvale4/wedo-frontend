export const UserFeed = () => {
    return (
        <section className="animate-in fade-in duration-500">
            <header className="mb-12">
                <h2 className="text-4xl font-light italic text-slate-700 border-b-2 border-slate-300 inline-block pb-2">Feed de atividades</h2>
            </header>
            
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-200 text-center max-w-2xl">
                <div className="text-6xl mb-6">🚧</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Feed Principal em construção...</h3>
                <div className="mt-8 flex justify-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
            </div>
        </section>
    );
};