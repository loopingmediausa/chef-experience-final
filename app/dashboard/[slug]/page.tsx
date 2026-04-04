import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Zap, LayoutGrid, MousePointer2, BarChart3, Trophy, Activity, BellRing } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

// Tooltip inteligente
function HelpTooltip({ text }: { text: string }) {
  return (
    <div className="relative group shrink-0 ml-1">
      <button type="button" className="flex h-4 w-4 items-center justify-center rounded-full border border-white/10 text-[9px] text-white/30 hover:border-white/50 hover:text-white transition-all">?</button>
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
  if (!restaurant) return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans tracking-widest uppercase text-xs">Location Not Found</main>;

  // Busca de Dados Base
  const { count: totalViews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: totalReviews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  // Busca da Equipe e Eventos
  const { data: servers } = await supabase.from("servers").select("id, name, code").eq("restaurant_id", restaurant.id);
  const { data: appEvents } = await supabase.from("events").select("server_id, created_at").eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart).not("server_id", "is", null);
  const { data: reviewEvents } = await supabase.from("events").select("server_id, created_at").eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart).not("server_id", "is", null);

  // Feed de Notificações em Tempo Real (Últimos 4 eventos globais do restaurante)
  const { data: liveEvents } = await supabase
    .from("events")
    .select("id, event_type, created_at, server_id")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const recentAlerts = (liveEvents ?? []).map(ev => {
    const serverName = servers?.find(s => s.id === ev.server_id)?.name || "Unknown Server";
    const time = new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { ...ev, serverName, time };
  });

  // Cálculo de Performance da Equipe
  const teamPerformance = (servers ?? []).map(server => {
    const v = appEvents?.filter(e => e.server_id === server.id).length || 0;
    const r = reviewEvents?.filter(e => e.server_id === server.id).length || 0;
    return { ...server, views: v, reviews: r, score: v + r };
  }).sort((a, b) => b.score - a.score);

  const topServer = teamPerformance.length > 0 && teamPerformance[0].score > 0 ? teamPerformance[0] : { name: "Awaiting Data", score: 0 };
  const ctr = (totalViews || 0) > 0 ? (((totalReviews || 0) / (totalViews || 1)) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-white selection:text-black">
      <div className="max-w-[1400px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 border-b border-white/5 pb-8">
          <div>
            <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase font-light mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" /> Chef Experience Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white uppercase">{restaurant.name}</h1>
          </div>
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} className={`px-6 py-2 text-[9px] uppercase tracking-[0.2em] font-medium rounded-full transition-all ${range === r ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}>{r}</Link>
            ))}
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* TOP PERFORMER SECTION (Ocupa 2 colunas) */}
          <div className="lg:col-span-2 bg-[#080808] border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-light mb-4">Top Performer</p>
                <h2 className="text-5xl font-semibold tracking-tight mb-4">{topServer.name}</h2>
                <p className="text-white/40 text-sm font-light max-w-sm">Best overall performance combining app engagement and review generation.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-light mb-2">Score</p>
                <p className="text-7xl font-bold tracking-tighter text-white/90">{topServer.score}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Trophy className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* NOVO: BLOCO DE NOTIFICAÇÕES (LIVE ALERTS) */}
          <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-light">Live Activity</p>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="flex-1 space-y-4">
              {recentAlerts.length === 0 ? (
                <p className="text-[10px] text-white/20 uppercase tracking-widest italic mt-4">No recent activity.</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="mt-1">
                      {alert.event_type === "review_click" ? (
                        <MousePointer2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <LayoutGrid className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/90">
                        {alert.serverName} <span className="text-white/40 font-light">generated a</span> {alert.event_type === "review_click" ? "Review Click" : "App View"}
                      </p>
                      <p className="text-[9px] text-white/30 tracking-widest mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 5 CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
          {[
            { label: "App Views", value: totalViews || 0, tip: "Total app views generated in the selected period." },
            { label: "Review Clicks", value: totalReviews || 0, tip: "Total review clicks generated in the selected period." },
            { label: "Conversion", value: `${ctr}%`, tip: "Percentage of app views that turned into review clicks." },
            { label: "Active App", value: teamPerformance.filter(s => s.views > 0).length, tip: "Servers who successfully generated app views." },
            { label: "Active Review", value: teamPerformance.filter(s => s.reviews > 0).length, tip: "Servers who successfully generated Google reviews." }
          ].map((stat, i) => (
            <div key={i} className={`bg-[#080808] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all ${i === 2 ? "bg-gradient-to-br from-zinc-200 via-white to-zinc-100 text-black shadow-lg" : ""}`}>
              <div className="flex items-center mb-6">
                <p className={`text-[9px] uppercase tracking-[0.2em] font-medium ${i === 2 ? "text-black/50" : "text-white/30"}`}>{stat.label}</p>
                {i !== 2 && <HelpTooltip text={stat.tip} />}
              </div>
              <p className={`text-3xl font-bold tracking-tighter ${i === 2 ? "text-black" : "text-white"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* RANKING COMPLETO (Detailed Team Performance) */}
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-light">Detailed Team Performance</h2>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>
          
          <div className="space-y-3">
            {teamPerformance.map((server) => (
              <div key={server.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center transition-all hover:bg-white/[0.04]">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 font-light text-xs border border-white/10">
                    {server.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-tight text-white/90">{server.name}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1">Score: {server.score}</p>
                  </div>
                </div>

                <div className="flex gap-12 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] mb-1 font-medium">Views</p>
                    <p className="text-lg font-semibold tracking-tighter">{server.views}</p>
                  </div>
                  <div className="text-right pr-4">
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] mb-1 font-medium">Reviews</p>
                    <p className="text-lg font-semibold tracking-tighter">{server.reviews}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}