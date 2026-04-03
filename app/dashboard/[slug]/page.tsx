import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

function HelpTooltip({ text }: { text: string }) {
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-transparent text-[10px] text-white/50 transition hover:border-white hover:text-white"
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-10 z-50 hidden w-72 rounded-lg border border-white/10 bg-[#000000] p-5 text-sm font-light leading-relaxed text-white/90 shadow-3xl group-hover:block backdrop-blur-3xl">
        {text}
      </div>
    </div>
  );
}

function getRangeStart(range: string) {
  const now = new Date();
  const start = new Date(now);
  if (range === "day") start.setHours(0, 0, 0, 0);
  else if (range === "week") start.setDate(start.getDate() - 7);
  else if (range === "month") start.setDate(start.getDate() - 30);
  else if (range === "year") start.setDate(start.getDate() - 365);
  else start.setDate(start.getDate() - 7);
  return start.toISOString();
}

export default async function DashboardPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resParams = await searchParams;
  const range = resParams.range || "week";
  const rangeStart = getRangeStart(range);

  const { data: restaurant } = await supabase.from("restaurants").select("id, name").eq("slug", slug).single();

  if (!restaurant) {
    return <main className="min-h-screen bg-black text-white flex items-center justify-center uppercase tracking-[0.5em] font-light font-sans">Location Not Found</main>;
  }

  const { count: appViewsCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: reviewClicksCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0.0";

  const { data: servers } = await supabase.from("servers").select("id, name").eq("restaurant_id", restaurant.id);
  const { data: appEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart).not("server_id", "is", null);
  const { data: reviewEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart).not("server_id", "is", null);

  const appRanking = (servers ?? []).map(s => ({
    name: s.name,
    count: appEvents?.filter(e => e.server_id === s.id).length || 0
  })).sort((a, b) => b.count - a.count);

  const reviewRanking = (servers ?? []).map(s => ({
    name: s.name,
    count: reviewEvents?.filter(e => e.server_id === s.id).length || 0
  })).sort((a, b) => b.count - a.count);

  const topPerformer = reviewRanking[0]?.count > 0 || appRanking[0]?.count > 0 
    ? (reviewRanking[0].count >= appRanking[0].count ? reviewRanking[0].name : appRanking[0].name) 
    : "NO DATA";

  return (
    <main className="min-h-screen bg-black text-white p-8 md:p-16 font-sans selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* TEXTURA FUNDO: MESMA DO LOGIN */}
      <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <div className="max-w-[1400px] mx-auto space-y-24 relative z-10">
        
        {/* HEADER: ESTILO EDITORIAL BALENCIAGA (GIGANTE, BLACK, TIGHT) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/10 pb-12">
          <div>
            <p className="text-[10px] tracking-[0.5em] text-white/30 uppercase font-light mb-4">Chef Experience Intelligence</p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight uppercase leading-[0.85]">{restaurant.name}</h1>
          </div>
          
          <nav className="flex items-center gap-1 border-b border-white/10 pb-3">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} 
                className={`px-5 py-1.5 text-[10px] uppercase tracking-[0.3em] font-medium transition-all ${range === r ? "text-white font-bold border-b border-white" : "text-white/20 hover:text-white"}`}>
                {r}
              </Link>
            ))}
          </nav>
        </header>

        {/* HERO SECTION: DE-BOXED, BRUTALISTA (SEM CAIXA, SÓ TIPOGRAFIA) */}
        <section className="relative p-12 md:p-20 overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-white/10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-medium">Top Performer</span>
              </div>
              <h2 className="text-8xl md:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] text-white">{topPerformer}</h2>
              <p className="text-white/30 text-base font-light tracking-wide max-w-xl italic">LÍDER ABSOLUTO DE PERFORMANCE E ENGAJAMENTO DIGITAL NESTA UNIDADE</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-white/20 text-[10px] uppercase tracking-[0.5em] mb-4">Total Score</p>
              <p className="text-9xl md:text-[13rem] font-bold leading-none tracking-tighter text-white">{totalViews + totalReviews}</p>
            </div>
          </div>
        </section>

        {/* STATS: GRID MINIMALISTA SEM CAIXAS (SÓ LINHAS FINAS) */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-b border-white/10 divide-x divide-white/5">
          {[
            { label: "App Views", val: totalViews, tt: "Visitas totais ao menu digital." },
            { label: "Review Clicks", val: totalReviews, tt: "Cliques no fluxo de avaliação." },
            { label: "Conversion", val: `${ctr}%`, tt: "Eficiência total da casa." },
            { label: "Active App", val: appRanking.filter(s => s.count > 0).length, tt: "Servers ativos no menu." },
            { label: "Active Review", val: reviewRanking.filter(s => s.count > 0).length, tt: "Servers ativos em reviews." }
          ].map((m, i) => (
            <div key={i} className="py-16 px-6 flex flex-col items-center justify-center space-y-6 text-center hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">{m.label}</span>
                <HelpTooltip text={m.tt} />
              </div>
              <p className={`text-6xl md:text-7xl font-bold tracking-tighter ${m.val === 0 || m.val === "0.0%" ? "text-white/10" : "text-white"}`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* RANKINGS: ESTILO EDITORIAL (LIMPO, SEM BARRAS GORDAS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          {[
            { title: "App Engagement Ranking", data: appRanking },
            { title: "Review Generation Ranking", data: reviewRanking }
          ].map((rank, i) => (
            <div key={i} className="space-y-12">
              <h3 className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-bold border-b border-white/10 pb-6 italic">{rank.title}</h3>
              <div className="space-y-8">
                {rank.data.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-end border-b border-white/5 pb-4 group">
                    <span className="text-xl font-light tracking-tight text-white/60 group-hover:text-white transition-colors uppercase">
                      <span className="text-white/20 mr-4 font-mono text-xs">0{idx + 1}</span>{s.name}
                    </span>
                    <span className="text-3xl font-bold text-white tracking-tighter">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="pt-20 opacity-10 flex justify-between items-center text-[8px] uppercase tracking-[0.5em] font-light text-center border-t border-white/5">
          <p>© 2026 LOOPING MEDIA INTELLIGENCE</p>
          <p>CHEF EXPERIENCE PLATFORM</p>
        </footer>
      </div>
    </main>
  );
}