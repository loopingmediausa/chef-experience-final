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
        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-white/5 text-[12px] text-white/70 transition hover:border-[#E5D3B3] hover:text-[#E5D3B3]"
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-10 z-30 hidden w-72 rounded-2xl border border-white/20 bg-black p-5 text-sm font-light leading-relaxed text-white shadow-[0_0_30px_rgba(0,0,0,1)] group-hover:block backdrop-blur-3xl">
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

  // Queries robustas para garantir que os dados venham
  const { count: totalViews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("type", "app_view").gte("created_at", rangeStart);
  const { count: totalReviews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("type", "review_click").gte("created_at", rangeStart);

  const views = totalViews ?? 0;
  const reviews = totalReviews ?? 0;
  const ctr = views > 0 ? ((reviews / views) * 100).toFixed(1) : "0.0";

  const { data: servers } = await supabase.from("servers").select("id, name").eq("restaurant_id", restaurant.id);
  const { data: allEvents } = await supabase.from("events").select("server_id, type").eq("restaurant_id", restaurant.id).gte("created_at", rangeStart);

  const appRanking = (servers ?? []).map(s => ({
    name: s.name,
    count: allEvents?.filter(e => e.server_id === s.id && e.type === "app_view").length || 0
  })).sort((a, b) => b.count - a.count);

  const reviewRanking = (servers ?? []).map(s => ({
    name: s.name,
    count: allEvents?.filter(e => e.server_id === s.id && e.type === "review_click").length || 0
  })).sort((a, b) => b.count - a.count);

  const topPerformer = reviewRanking[0]?.count > 0 || appRanking[0]?.count > 0 ? (reviewRanking[0].count >= appRanking[0].count ? reviewRanking[0].name : appRanking[0].name) : "No Data";

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 md:p-16 font-sans selection:bg-[#E5D3B3] selection:text-black">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* HEADER: MAIS IMPACTO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-12 gap-8">
          <div>
            <p className="text-[#E5D3B3] text-sm tracking-[0.4em] uppercase font-medium mb-4">Chef Experience Intelligence</p>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none">{restaurant.name}</h1>
          </div>
          <nav className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
            {["day", "week", "month", "year"].map(r => (
              <a key={r} href={`/dashboard/${slug}?range=${r}`} className={`px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${range === r ? "bg-[#E5D3B3] text-black shadow-lg shadow-[#E5D3B3]/20" : "text-white/40 hover:text-white"}`}>{r}</a>
            ))}
          </nav>
        </div>

        {/* HERO SECTION: O CARTÃO BLACK */}
        <div className="relative rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-black p-12 md:p-20 shadow-3xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5D3B3]/5 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-[#E5D3B3]/10 transition-colors"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#E5D3B3]/10 border border-[#E5D3B3]/20 text-[#E5D3B3] text-xs font-bold uppercase tracking-[0.2em]">
                <span className="w-2 h-2 rounded-full bg-[#E5D3B3] animate-pulse"></span> Top Performer
              </span>
              <h2 className="text-7xl md:text-9xl font-bold tracking-tighter uppercase leading-[0.8]">{topPerformer}</h2>
              <p className="text-white/60 text-xl font-light max-w-xl">Líder em conversão e engajamento nesta unidade.</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-sm uppercase tracking-[0.4em] mb-4">Total Score</p>
              <p className="text-[10rem] md:text-[14rem] font-bold leading-none tracking-tighter text-[#E5D3B3]">{views + reviews}</p>
            </div>
          </div>
        </div>

        {/* METRICS GRID: NÚMEROS GIGANTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "App Views", value: views, tooltip: "Total de visualizações do menu digital." },
            { label: "Review Clicks", value: reviews, tooltip: "Total de clientes que clicaram para avaliar." },
            { label: "Conversion rate", value: `${ctr}%`, tooltip: "Eficiência: quantos visualizam vs quantos avaliam." }
          ].map((m, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[2.5rem] hover:border-[#E5D3B3]/30 transition-all shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <span className="text-white/50 text-xs uppercase tracking-[0.4em] font-bold">{m.label}</span>
                <HelpTooltip text={m.tooltip} />
              </div>
              <p className="text-7xl md:text-8xl font-bold tracking-tighter">{m.value}</p>
            </div>
          ))}
        </div>

        {/* RANKINGS: LIMPOS E LEGÍVEIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[{ title: "App Engagement", data: appRanking }, { title: "Review Performance", data: reviewRanking }].map((rank, i) => (
            <div key={i} className="bg-black/40 border border-white/5 p-12 rounded-[2.5rem] shadow-inner">
              <h3 className="text-white/40 text-sm uppercase tracking-[0.4em] font-bold mb-12 flex items-center gap-4 italic">
                {rank.title} <div className="h-[1px] flex-1 bg-white/10"></div>
              </h3>
              <div className="space-y-10">
                {rank.data.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-2xl font-light tracking-tight text-white/80 group-hover:text-white transition-colors">{idx + 1}. {s.name}</span>
                      <span className="text-3xl font-bold text-[#E5D3B3]">{s.count}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
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