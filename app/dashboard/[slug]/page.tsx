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
        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-transparent text-[12px] text-white/50 transition hover:border-[#E5D3B3] hover:text-[#E5D3B3]"
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-10 z-30 hidden w-72 rounded-2xl border border-white/20 bg-black/95 p-5 text-sm font-light leading-relaxed text-white shadow-2xl group-hover:block backdrop-blur-3xl">
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
    return <main className="min-h-screen bg-black text-white flex items-center justify-center uppercase tracking-[0.5em] font-light">Location Not Found</main>;
  }

  // MÉTRICAS GERAIS (COLUNA CORRETA: event_type)
  const { count: appViewsCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: reviewClicksCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0.0";

  // RANKINGS E SERVIDORES ATIVOS
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
    : "No Data";

  const activeApp = appRanking.filter(s => s.count > 0).length;
  const activeReview = reviewRanking.filter(s => s.count > 0).length;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 md:p-16 font-sans relative overflow-hidden">
      {/* TEXTURA FUNDO */}
      <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <div className="max-w-[1500px] mx-auto space-y-12 relative z-10">
        
        {/* HEADER IMPACTANTE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10 gap-6">
          <div>
            <p className="text-[#E5D3B3] text-sm tracking-[0.4em] uppercase font-light mb-3">Chef Experience Intelligence</p>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none">{restaurant.name}</h1>
          </div>
          <nav className="flex gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-xl">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} className={`px-8 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${range === r ? "bg-[#E5D3B3] text-black" : "text-white/40 hover:text-white"}`}>{r}</Link>
            ))}
          </nav>
        </div>

        {/* HERO CARD: O DESTAQUE */}
        <div className="rounded-[2.5rem] border border-white/10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-black to-black p-12 md:p-20 shadow-2xl group">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-6 flex-1">
              <span className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[#E5D3B3] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5D3B3] shadow-[0_0_12px_rgba(229,211,179,0.8)] animate-pulse"></span> Top Performer
              </span>
              <h2 className="text-7xl md:text-9xl font-bold tracking-tighter uppercase leading-[0.8]">{topPerformer}</h2>
              <p className="text-white/40 text-lg font-light italic">Líder absoluto de performance nesta unidade.</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/30 text-xs uppercase tracking-[0.4em] mb-4 font-bold">Unit Score</p>
              <p className="text-[10rem] md:text-[13rem] font-bold leading-none tracking-tighter text-[#E5D3B3]">{totalViews + totalReviews}</p>
            </div>
          </div>
        </div>

        {/* GLOBAL STATS: CONTRASTE MÁXIMO */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden divide-x divide-white/5 divide-y md:divide-y-0">
          {[
            { label: "App Views", val: totalViews, tt: "Visitas totais ao menu digital." },
            { label: "Review Clicks", val: totalReviews, tt: "Cliques no fluxo de avaliação." },
            { label: "Conversion", val: `${ctr}%`, tt: "Eficiência total da casa." },
            { label: "Active App", val: activeApp, tt: "Garçons que geraram visualizações." },
            { label: "Active Review", val: activeReview, tt: "Garçons que geraram avaliações." }
          ].map((m, i) => (
            <div key={i} className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">{m.label}</span>
                <HelpTooltip text={m.tt} />
              </div>
              <p className={`text-5xl md:text-6xl font-bold tracking-tighter ${m.val === 0 || m.val === "0.0%" ? "text-white/10" : "text-white"}`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[
            { title: "App Engagement", data: appRanking },
            { title: "Review Performance", data: reviewRanking }
          ].map((rank, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[2.5rem] shadow-xl">
              <h3 className="text-white/40 text-xs uppercase tracking-[0.4em] font-bold mb-12 border-b border-white/5 pb-6 italic">{rank.title}</h3>
              <div className="space-y-10">
                {rank.data.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-4 font-bold uppercase tracking-tight">
                      <span className="text-xl text-white/80 group-hover:text-white transition-colors">0{idx + 1} — {s.name}</span>
                      <span className={`text-2xl ${s.count > 0 ? "text-[#E5D3B3]" : "text-white/10"}`}>{s.count}</span>
                    </div>
                    <div className="w-full h-[1.5px] bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E5D3B3] transition-all duration-1000" style={{ width: `${(s.count / (Math.max(...rank.data.map(d => d.count)) || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}