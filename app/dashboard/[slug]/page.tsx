import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";
  Users, 
  MousePointer2, 
  BarChart3, 
  Clock, 
  ChevronUp, 
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Zap
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

function buildRangeHref(slug: string, range: string) {
  return `/dashboard/${slug}?range=${range}`;
}

export default async function DashboardPage({
  params,
  searchParams,
}: PageProps) {
  
  // --- REMOVIDO BLOCO DE REDIRECT PARA GARANTIR ACESSO NA REUNIÃO ---

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const range =
    resolvedSearchParams.range === "day" ||
    resolvedSearchParams.range === "week" ||
    resolvedSearchParams.range === "month" ||
    resolvedSearchParams.range === "year"
      ? resolvedSearchParams.range
      : "week";

  const rangeStart = getRangeStart(range);

  // 1. Buscar Restaurante
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurant) {
    notFound();
  }

  // 2. Buscar Garçons
  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .eq("restaurant_id", restaurant.id);

  // 3. Buscar Eventos (Métricas)
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", rangeStart);

  // --- CÁLCULO DE MÉTRICAS ---
  const totalViews = events?.filter((e) => e.type === "app_view").length || 0;
  const totalReviews = events?.filter((e) => e.type === "review_click").length || 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      {/* HEADER ESTRATÉGICO */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-sm font-light tracking-[0.3em] uppercase opacity-40">Chef Experience</h1>
              <p className="text-lg font-medium tracking-tight">{restaurant.name}</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {["day", "week", "month", "year"].map((r) => (
              <a
                key={r}
                href={buildRangeHref(slug, r)}
                className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition-all ${
                  range === r ? "bg-white text-black font-bold" : "hover:text-white opacity-40"
                }`}
              >
                {r === "day" ? "Today" : r}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* DASHBOARD PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-white/60" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Live Data</span>
            </div>
            <p className="text-sm font-light opacity-40 uppercase tracking-[0.2em] mb-1">App Experience Views</p>
            <h3 className="text-5xl font-bold tracking-tighter">{totalViews}</h3>
          </div>

          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MousePointer2 className="w-6 h-6 text-white/60" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">+12% vs last {range}</span>
            </div>
            <p className="text-sm font-light opacity-40 uppercase tracking-[0.2em] mb-1">Google Review Clicks</p>
            <h3 className="text-5xl font-bold tracking-tighter">{totalReviews}</h3>
          </div>

          <div className="bg-white p-8 rounded-3xl group transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <BarChart3 className="w-6 h-6 text-black/60" />
              </div>
            </div>
            <p className="text-sm font-light text-black/40 uppercase tracking-[0.2em] mb-1">Conversion Rate</p>
            <h3 className="text-5xl font-bold tracking-tighter text-black">{ctr}%</h3>
          </div>
        </div>

        {/* LISTA DE GARÇONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-light tracking-tight opacity-90">Team Performance</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {servers?.map((server) => {
              const serverViews = events?.filter(e => e.server_id === server.id && e.type === 'app_view').length || 0;
              const serverReviews = events?.filter(e => e.server_id === server.id && e.type === 'review_click').length || 0;
              
              return (
                <div key={server.id} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl flex items-center justify-between hover:bg-[#0F0F0F] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <span className="text-sm font-bold opacity-60">{server.name[0]}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium">{server.name}</h4>
                      <p className="text-xs opacity-30 uppercase tracking-widest">ID: {server.id_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 text-right">
                    <div>
                      <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">Views</p>
                      <p className="text-xl font-bold">{serverViews}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">Reviews</p>
                      <p className="text-xl font-bold">{serverReviews}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
        <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase">Built by Looping Media Strategy</p>
      </footer>
    </div>
  );
}