import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

// Tooltip refinado com a mesma lógica do Admin
function HelpTooltip({ text }: { text: string }) {
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-transparent text-[9px] text-white/30 transition hover:border-[#E5D3B3]/50 hover:text-[#E5D3B3]"
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-8 z-50 hidden w-64 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-4 text-[11px] font-light leading-relaxed text-white/70 shadow-2xl group-hover:block backdrop-blur-xl">
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
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light font-sans">Location Not Found</p>
      </main>
    );
  }

  // BUSCA DE DADOS (COLUNA event_type - PADRÃO SANTO GRAAL)
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
    <main className="min-h-screen bg-[#050505] text-[#f8f9fa] p-8 md:p-16 font-sans selection:bg-[#E5D3B3] selection:text-black relative overflow-hidden">
      {/* TEXTURA IGUAL AO ADMIN */}
      <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <div className="max-w-[1500px] mx-auto space-y-16 relative z-10">
        
        {/* HEADER: MESMA ESTRUTURA DO ADMIN */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-10 border-b border-white/10 pb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-light mb-3 italic">Chef Experience Intelligence</p>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white uppercase">{restaurant.name}</h1>
          </div>
          
          <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1 shadow-inner backdrop-blur-sm">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} className={`rounded-full px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-medium transition-all ${range === r ? "bg-[#E5D3B3] text-black shadow-[0_0_15px_rgba(229,211,179,0.2)]" : "text-white/40 hover:text-white"}`}>
                {r}
              </Link>
            ))}
          </nav>
        </div>

        {/* TOP PERFORMER: ESTILO BLACK CARD (FINO E ELEGANTE) */}
        <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-12 md:p-16 shadow-2xl group transition-all hover:border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6">
              <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#E5D3B3] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5D3B3] shadow-[0_0_8px_rgba(229,211,179,0.6)]"></span>
                Top Performer
              </span>
              <h2 className="text-6xl md:text-8xl font-light tracking-tighter uppercase leading-none text-white">{topPerformer}</h2>
              <p className="text-white/30 text-base font-light tracking-wide max-w-md italic">Líder absoluto de performance e engajamento digital nesta unidade.</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] mb-4">Total Unit Score</p>
              <p className="text-8xl md:text-[10rem] font-light leading-none tracking-tighter text-white">{totalViews + totalReviews}</p>
            </div>
          </div>
        </div>

        {/* METRICS ROW: LIMPO E LEGÍVEL */}
        <div className="grid grid-cols-2 md:grid-cols-5 border border-white/5 rounded-3xl bg-white/[0.01] divide-x divide-white/5 overflow-hidden">
          {[
            { label: "App Views", val: totalViews, tt: "Visitas totais ao menu digital." },
            { label: "Review Clicks", val: totalReviews, tt: "Cliques no fluxo de avaliação." },
            { label: "Conversion", val: `${ctr}%`, tt: "Eficiência total da casa." },
            { label: "Active App", val: appRanking.filter(s => s.count > 0).length, tt: "Servers ativos no menu." },
            { label: "Active Review", val: reviewRanking.filter(s => s.count > 0).length, tt: "Servers ativos em reviews." }
          ].map((m, i) => (
            <div key={i} className="py-12 px-6 flex flex-col items-center justify-center space-y-6 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">{m.label}</span>
                <HelpTooltip text={m.tt} />
              </div>
              <p className={`text-4xl md:text-5xl font-light tracking-tighter ${m.val === 0 || m.val === "0.0%" ? "text-white/10" : "text-white"}`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* RANKINGS: ESTILO EDITORIAL (LIMPO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {[
            { title: "App Engagement Ranking", data: appRanking },
            { title: "Review Generation Ranking", data: reviewRanking }
          ].map((rank, i) => (
            <div key={i} className="space-y-10">
              <h3 className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-bold border-b border-white/10 pb-6 italic">{rank.title}</h3>
              <div className="space-y-8">
                {rank.data.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-4 font-light uppercase">
                      <span className="text-lg tracking-tight text-white/60 group-hover:text-white transition-colors">
                        <span className="text-white/20 mr-4 font-mono text-xs">0{idx + 1}</span>{s.name}
                      </span>
                      <span className={`text-2xl font-light tracking-tighter ${s.count > 0 ? "text-[#E5D3B3]" : "text-white/10"}`}>{s.count}</span>
                    </div>
                    <div className="w-full h-[1px] bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E5D3B3]/40 transition-all duration-1000 ease-out" style={{ width: `${(s.count / (Math.max(...rank.data.map(d => d.count)) || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="pt-20 border-t border-white/5 opacity-20 flex justify-between items-center">
          <p className="text-[9px] tracking-[0.5em] uppercase font-light">Looping Media Intelligence — 2026</p>
          <p className="text-[9px] tracking-[0.5em] uppercase font-light italic">Refining Restaurant Operations</p>
        </footer>
      </div>
    </main>
  );
}