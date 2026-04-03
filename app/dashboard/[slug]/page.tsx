"use client";

import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { Zap, LayoutGrid, MousePointer2, BarChart3 } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-sans tracking-widest uppercase font-light">
        Location Not Found
      </main>
    );
  }

  // Busca de Dados
  const { count: appViewsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "app_view")
    .gte("created_at", rangeStart);
    
  const { count: reviewClicksCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "review_click")
    .gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  // Busca da Equipe
  const { data: servers } = await supabase
    .from("servers")
    .select("id, name, code")
    .eq("restaurant_id", restaurant.id);
    
  const { data: appEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "app_view")
    .gte("created_at", rangeStart)
    .not("server_id", "is", null);
    
  const { data: reviewEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "review_click")
    .gte("created_at", rangeStart)
    .not("server_id", "is", null);

  // Montando a lista de Performance da Equipe
  const teamPerformance = (servers ?? []).map(server => {
    const views = appEvents?.filter(e => e.server_id === server.id).length || 0;
    const reviews = reviewEvents?.filter(e => e.server_id === server.id).length || 0;
    return { ...server, views, reviews };
  }).sort((a, b) => (b.views + b.reviews) - (a.views + a.reviews));

  return (
    <main className="min-h-screen bg-black text-white flex font-sans selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* TEXTURA DE FUNDO (Mais sutil para o dashboard) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] grayscale scale-110 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'subtleMove 40s ease-in-out infinite alternate'
        }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/90 to-[#050505] z-10 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-[1200px] mx-auto p-6 md:p-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-zinc-200 to-white rounded-full flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase font-light mb-1">
                Chef Experience
              </p>
              <h1 className="text-2xl font-light tracking-wide text-white/90">
                {restaurant.name}
              </h1>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-3xl p-1.5 backdrop-blur-md shadow-lg">
            {["day", "week", "month", "year"].map(r => (
              <Link 
                key={r} 
                href={`/dashboard/${slug}?range=${r}`} 
                className={`px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium rounded-3xl transition-all duration-300 ${
                  range === r 
                    ? "bg-white text-black shadow-md scale-100" 
                    : "text-white/40 hover:text-white/90 hover:bg-white/5 scale-95 hover:scale-100"
                }`}
              >
                {r}
              </Link>
            ))}
          </nav>
        </header>

        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          
          {/* Card 1: App Views */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden group transition-colors hover:border-white/20 hover:bg-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start mb-10">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5">
                <LayoutGrid className="w-5 h-5 text-white/80" />
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-medium px-3 py-1 rounded-full border border-white/10 bg-white/5">Live</span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 font-light">App Experience Views</p>
            <p className="text-5xl font-semibold tracking-tight text-white/90">{totalViews}</p>
          </div>

          {/* Card 2: Review Clicks */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden group transition-colors hover:border-white/20 hover:bg-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-start mb-10">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5">
                <MousePointer2 className="w-5 h-5 text-white/80" />
              </div>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 font-light">Google Review Clicks</p>
            <p className="text-5xl font-semibold tracking-tight text-white/90">{totalReviews}</p>
          </div>

          {/* Card 3: Conversion Rate (Efeito Prateado/Metálico) */}
          <div className="bg-gradient-to-br from-zinc-200 via-white to-zinc-100 rounded-3xl p-8 shadow-[0_0_40px_rgba(255,255,255,0.05)] relative overflow-hidden group transition-transform hover:-translate-y-1 duration-500">
            <div className="flex justify-between items-start mb-10">
              <div className="bg-black/5 p-3.5 rounded-2xl border border-black/5">
                <BarChart3 className="w-5 h-5 text-zinc-900" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 font-medium">Conversion Rate</p>
            <p className="text-5xl font-semibold tracking-tight text-zinc-950">{ctr}%</p>
          </div>

        </div>

        {/* TEAM PERFORMANCE */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl font-light tracking-wide text-white/90">Team Performance</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          
          <div className="space-y-4">
            {teamPerformance.length === 0 ? (
              <p className="text-sm text-white/30 font-light tracking-wide py-8 text-center border border-white/5 rounded-3xl border-dashed">
                Nenhum dado registrado neste período.
              </p>
            ) : (
              teamPerformance.map((server) => (
                <div 
                  key={server.id} 
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/80 font-light text-lg border border-white/10 shrink-0 group-hover:bg-white/10 transition-colors">
                      {server.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-light tracking-wide text-white/90">{server.name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1 font-light">
                        ID: {server.code || server.id.slice(0,4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-16 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-1 font-light">Views</p>
                      <p className="text-2xl font-semibold text-white/90">{server.views}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-1 font-light">Reviews</p>
                      <p className="text-2xl font-semibold text-white/90">{server.reviews}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes subtleMove {
          0% { transform: scale(1.1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-1%, -1%); }
        }
      `}</style>
    </main>
  );
}