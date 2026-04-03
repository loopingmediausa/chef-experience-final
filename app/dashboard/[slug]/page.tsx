import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { 
  Users, 
  MousePointer2, 
  BarChart3, 
  Zap,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
}

function getRangeStart(range: string) {
  const start = new Date();
  if (range === "day") start.setHours(0, 0, 0, 0);
  else if (range === "week") start.setDate(start.getDate() - 7);
  else if (range === "month") start.setDate(start.getDate() - 30);
  else if (range === "year") start.setDate(start.getDate() - 365);
  else start.setDate(start.getDate() - 7);
  return start.toISOString();
}

export default async function DashboardPage({
  params,
  searchParams,
}: PageProps) {
  
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const range = resolvedSearchParams.range || "week";
  const rangeStart = getRangeStart(range);

  // Busca os dados do restaurante
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

  // Busca os garçons
  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .eq("restaurant_id", restaurant.id);

  // Busca os eventos (métricas)
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", rangeStart);

  const totalViews = events?.filter((e) => e.type === "app_view").length || 0;
  const totalReviews = events?.filter((e) => e.type === "review_click").length || 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-[#050505] text-[#f8f9fa] p-6 md:p-10 font-sans selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* Textura de fundo sutil (Identica ao Admin) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header - Estilo Looping Media */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-white/10 pb-8 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-light mb-2">
              Chef Experience / Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white uppercase">
              {restaurant.name}
            </h1>
          </div>
          
          <nav className="flex items-center gap-2 bg-white/[0.03] border border-white/10 p-1.5 rounded-full backdrop-blur-md">
            {["day", "week", "month", "year"].map((r) => (
              <a
                key={r}
                href={`/dashboard/${slug}?range=${r}`}
                className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all ${
                  range === r ? "bg-[#E5D3B3] text-black font-bold shadow-lg shadow-[#E5D3B3]/20" : "text-white/40 hover:text-white"
                }`}
              >
                {r}
              </a>
            ))}
          </nav>
        </div>

        {/* Grid de Métricas - Estilo Black Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          <div className="rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 shadow-2xl group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-[#E5D3B3]/10 transition-colors">
                <Zap className="w-5 h-5 text-[#E5D3B3]" />
              </div>
              <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-[#E5D3B3] font-medium bg-[#E5D3B3]/5 px-3 py-1 rounded-full border border-[#E5D3B3]/20">
                LIVE <span className="w-1 h-1 bg-[#E5D3B3] rounded-full animate-pulse"></span>
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-2">App Experience Views</p>
            <h3 className="text-6xl font-bold tracking-tighter text-white">{totalViews}</h3>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 shadow-2xl group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                <MousePointer2 className="w-5 h-5 text-white/60" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-2">Google Review Clicks</p>
            <h3 className="text-6xl font-bold tracking-tighter text-white">{totalReviews}</h3>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white p-10 shadow-2xl group transition-all">
            <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center border border-black/5">
                <BarChart3 className="w-5 h-5 text-black/60" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-black/20" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-2">Conversion Rate</p>
            <h3 className="text-6xl font-bold tracking-tighter text-black">{ctr}%</h3>
          </div>
        </div>

        {/* Team Performance - Lista Estilo Admin */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-xs font-light tracking-[0.5em] uppercase text-white/40 italic">Elite Performance</h2>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {servers?.map((server) => {
              const serverViews = events?.filter(e => e.server_id === server.id && e.type === 'app_view').length || 0;
              const serverReviews = events?.filter(e => e.server_id === server.id && e.type === 'review_click').length || 0;
              
              return (
                <div 
                  key={server.id} 
                  className="group bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between hover:border-white/20 transition-all bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#141414] to-[#0a0a0a]"
                >
                  <div className="flex items-center gap-8 mb-6 md:mb-0 w-full md:w-auto">
                    <div className="w-14 h-14 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center text-xl font-light text-white/20 group-hover:border-[#E5D3B3]/40 group-hover:text-[#E5D3B3] transition-all">
                      {server.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xl font-light tracking-wide text-white/90 uppercase">{server.name}</h4>
                      <p className="text-[10px] opacity-30 uppercase tracking-[0.3em] mt-1">Operator ID: {server.id_code}</p>
                    </div>
                  </div>

                  <div className="flex gap-16 w-full md:w-auto justify-between md:justify-end border-t border-white/5 pt-6 md:border-0 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] opacity-20 uppercase tracking-[0.3em] mb-1 font-medium">Experience Views</p>
                      <p className="text-3xl font-light text-white group-hover:text-[#E5D3B3] transition-colors">{serverViews}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] opacity-20 uppercase tracking-[0.3em] mb-1 font-medium">Review Clicks</p>
                      <p className="text-3xl font-light text-white group-hover:text-[#E5D3B3] transition-colors">{serverReviews}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30">
          <p className="text-[9px] tracking-[0.4em] uppercase font-light">Looping Media Intelligence © 2026</p>
          <div className="flex gap-8">
            <span className="text-[9px] tracking-[0.4em] uppercase font-light underline decoration-white/20 underline-offset-4">Privacy Platform</span>
            <span className="text-[9px] tracking-[0.4em] uppercase font-light">Chef Experience Tech</span>
          </div>
        </footer>
      </div>
    </main>
  );
}