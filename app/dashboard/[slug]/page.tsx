import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Zap, LayoutGrid, MousePointer2, BarChart3, ChevronRight } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

// Tooltip refinada com o estilo da marca
function HelpTooltip({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div className="relative group shrink-0 ml-1">
      <button
        type="button"
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-medium transition-all ${
          light
            ? "border-black/20 text-black/40 hover:border-black/60"
            : "border-white/10 text-white/30 hover:border-white/50 hover:text-white"
        }`}
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 hidden w-48 rounded-2xl border border-white/10 bg-[#111] p-4 text-[10px] tracking-widest leading-relaxed text-white/70 shadow-2xl group-hover:block backdrop-blur-xl">
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
    return <main className="min-h-screen bg-black text-white flex items-center justify-center font-sans tracking-widest uppercase text-xs">Location Not Found</main>;
  }

  const { count: appViewsCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: reviewClicksCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  const { data: servers } = await supabase.from("servers").select("id, name, code").eq("restaurant_id", restaurant.id);
  const { data: appEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart).not("server_id", "is", null);
  const { data: reviewEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart).not("server_id", "is", null);

  const teamPerformance = (servers ?? []).map(server => {
    const views = appEvents?.filter(e => e.server_id === server.id).length || 0;
    const reviews = reviewEvents?.filter(e => e.server_id === server.id).length || 0;
    return { ...server, views, reviews };
  }).sort((a, b) => (b.views + b.reviews) - (a.views + a.reviews));

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 md:p-20 font-sans selection:bg-white selection:text-black">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER - Inspirado no alinhamento da Login Page */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 border-b border-white/5 pb-12">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase font-light mb-2">Chef Experience</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white uppercase">{restaurant.name}</h1>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} 
                className={`px-6 py-2 text-[9px] uppercase tracking-[0.2em] font-medium rounded-full transition-all duration-300 ${range === r ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}>
                {r}
              </Link>
            ))}
          </nav>
        </header>

        {/* CARDS DE MÉTRICAS - Aplicando o estilo pílula e bordas sutis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          
          <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="flex justify-between items-start mb-12">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <LayoutGrid className="w-5 h-5 text-white/40" />
              </div>
              <span className="text-[8px] uppercase tracking-[0.3em] text-emerald-500/80 font-bold bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">Live</span>
            </div>
            <div className="flex items-center mb-1">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-light">Experience Views</p>
              <HelpTooltip text="Total number of visits to the restaurant app experience." />
            </div>
            <p className="text-6xl font-semibold tracking-tighter">{totalViews}</p>
          </div>

          <div className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-10 group hover:border-white/10 transition-all duration-500">
            <div className="flex justify-between items-start mb-12">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <MousePointer2 className="w-5 h-5 text-white/40" />
              </div>
            </div>
            <div className="flex items-center mb-1">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-light">Google Review Clicks</p>
              <HelpTooltip text="Direct interaction with the Google Review conversion flow." />
            </div>
            <p className="text-6xl font-semibold tracking-tighter">{totalReviews}</p>
          </div>

          {/* CARD DE CONVERSÃO - Estilo Silver (DNA do botão de login) */}
          <div className="bg-gradient-to-br from-zinc-100 via-white to-zinc-200 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(255,255,255,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <BarChart3 className="w-20 h-20 text-black" />
            </div>
            <div className="flex justify-between items-start mb-12">
              <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                <BarChart3 className="w-5 h-5 text-black/60" />
              </div>
            </div>
            <div className="flex items-center mb-1">
              <p className="text-[10px] text-black/40 uppercase tracking-[0.3em] font-semibold">Conversion Rate</p>
              <HelpTooltip text="Efficiency of turning views into actual Google reviews." light />
            </div>
            <p className="text-6xl font-bold tracking-tighter text-zinc-950">{ctr}%</p>
          </div>

        </div>

        {/* TEAM PERFORMANCE - Lista estilo "High-End" */}
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-10">
            <h2 className="text-xs uppercase tracking-[0.5em] text-white/40 font-light">Team Performance</h2>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>
          
          <div className="space-y-3">
            {teamPerformance.length === 0 ? (
              <p className="text-[10px] uppercase tracking-widest text-white/20 py-8 italic">No data recorded for this period.</p>
            ) : (
              teamPerformance.map((server) => (
                <div key={server.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300 hover:bg-white/[0.04] hover:translate-x-1 group">
                  
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/80 font-light text-sm border border-white/10 group-hover:border-white/30 transition-colors">
                      {server.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-medium text-white tracking-tight">{server.name}</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] mt-1">Access Code: {server.code || "---"}</p>
                    </div>
                  </div>

                  <div className="flex gap-16 w-full md:w-auto justify-between md:justify-end pr-4">
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] mb-2 font-medium">Views</p>
                      <p className="text-2xl font-semibold tracking-tighter">{server.views}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] mb-2 font-medium">Reviews</p>
                      <p className="text-2xl font-semibold tracking-tighter">{server.reviews}</p>
                    </div>
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}