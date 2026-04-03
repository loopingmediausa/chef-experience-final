import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Zap, LayoutGrid, MousePointer2, BarChart3 } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

// Componente de Tooltip inteligente (se adapta ao fundo claro ou escuro)
function HelpTooltip({ text, theme = "dark" }: { text: string; theme?: "dark" | "light" }) {
  const isLight = theme === "light";
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-medium transition-colors ${
          isLight
            ? "border-black/20 text-black/40 hover:border-black/50 hover:text-black"
            : "border-white/20 text-white/40 hover:border-white/50 hover:text-white"
        }`}
      >
        ?
      </button>

      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden w-48 rounded-xl border border-white/10 bg-[#1a1a1a] p-3 text-[10px] tracking-wide font-normal leading-relaxed text-white/90 shadow-2xl group-hover:block">
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
    return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans">Location Not Found</main>;
  }

  // Busca de Dados
  const { count: appViewsCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: reviewClicksCount } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  // Busca da Equipe
  const { data: servers } = await supabase.from("servers").select("id, name, code").eq("restaurant_id", restaurant.id);
  const { data: appEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart).not("server_id", "is", null);
  const { data: reviewEvents } = await supabase.from("events").select("server_id").eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart).not("server_id", "is", null);

  // Montando a lista de Performance da Equipe
  const teamPerformance = (servers ?? []).map(server => {
    const views = appEvents?.filter(e => e.server_id === server.id).length || 0;
    const reviews = reviewEvents?.filter(e => e.server_id === server.id).length || 0;
    return { ...server, views, reviews };
  }).sort((a, b) => (b.views + b.reviews) - (a.views + a.reviews));

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-white selection:text-black">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-medium mb-1">Chef Experience</p>
              <h1 className="text-2xl font-medium text-white">{restaurant.name}</h1>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-[#0A0A0A] border border-white/10 rounded-full p-1">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} 
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.1em] font-medium rounded-full transition-colors ${range === r ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
                {r}
              </Link>
            ))}
          </nav>
        </header>

        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Card 1: App Views */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-white/5 p-3 rounded-2xl">
                <LayoutGrid className="w-5 h-5 text-white/70" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Live Data</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">App Experience Views</p>
              <HelpTooltip text="Total number of visits to the restaurant app." />
            </div>
            <p className="text-5xl font-bold tracking-tight">{totalViews}</p>
          </div>

          {/* Card 2: Review Clicks */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-white/5 p-3 rounded-2xl">
                <MousePointer2 className="w-5 h-5 text-white/70" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Google Review Clicks</p>
              <HelpTooltip text="Total number of clicks on the review flow." />
            </div>
            <p className="text-5xl font-bold tracking-tight">{totalReviews}</p>
          </div>

          {/* Card 3: Conversion Rate (Branco) */}
          <div className="bg-white rounded-[2rem] p-8 shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-black/5 p-3 rounded-2xl">
                <BarChart3 className="w-5 h-5 text-black/70" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] font-medium">Conversion Rate</p>
              <HelpTooltip text="Percentage of app visits that turned into review clicks." theme="light" />
            </div>
            <p className="text-5xl font-bold tracking-tight text-black">{ctr}%</p>
          </div>

        </div>

        {/* TEAM PERFORMANCE */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-normal text-white">Team Performance</h2>
            <HelpTooltip text="Performance ranking for all active servers." />
          </div>
          
          <div className="space-y-4">
            {teamPerformance.length === 0 ? (
              <p className="text-sm text-white/40 py-4">Nenhum dado registrado neste período.</p>
            ) : (
              teamPerformance.map((server) => (
                <div key={server.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors hover:bg-[#111]">
                  
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-lg border border-white/5 shrink-0">
                      {server.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">{server.name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">ID: {server.code || server.id.slice(0,4)}</p>
                    </div>
                  </div>

                  <div className="flex gap-12 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1 font-medium">Views</p>
                      <p className="text-2xl font-bold">{server.views}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-1 font-medium">Reviews</p>
                      <p className="text-2xl font-bold">{server.reviews}</p>
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