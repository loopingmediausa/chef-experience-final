import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { 
  Users, 
  MousePointer2, 
  BarChart3, 
  Zap,
  ArrowUpRight,
  UserCircle2
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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .eq("restaurant_id", restaurant.id);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", rangeStart);

  const totalViews = events?.filter((e) => e.type === "app_view").length || 0;
  const totalReviews = events?.filter((e) => e.type === "review_click").length || 0;
  const ctr = totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      
      {/* HEADER MINIMALISTA */}
      <header className="border-b border-white/[0.03] bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-[10px] font-light tracking-[0.4em] uppercase opacity-40 mb-1">Exclusive Intelligence</h1>
              <p className="text-xl font-light tracking-tight uppercase">{restaurant.name}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 border border-white/5 px-6 py-2 rounded-full bg-white/[0.02]">
            {["day", "week", "month", "year"].map((r) => (
              <a
                key={r}
                href={`/dashboard/${slug}?range=${r}`}
                className={`text-[10px] uppercase tracking-[0.2em] transition-all ${
                  range === r ? "text-white font-bold" : "text-white/30 hover:text-white"
                }`}
              >
                {r}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 space-y-20">
        
        {/* METRICS - ESTILO BLACK CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#050505] border border-white/[0.05] p-10 rounded-[2rem] group transition-all hover:border-white/20">
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                <MousePointer2 className="w-5 h-5 text-white/80" />
              </div>
              <div className="flex items-center gap-1 text-[10px] tracking-widest text-emerald-400 font-medium bg-emerald-400/5 px-3 py-1 rounded-full border border-emerald-400/10">
                LIVE <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-sm font-light text-white/30 uppercase tracking-[0.3em] mb-2">Total App Views</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tighter">{totalViews}</span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#0A0A0A] border border-white/[0.05] p-10 rounded-[2rem] group transition-all hover:border-white/20">
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-white/80" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-sm font-light text-white/30 uppercase tracking-[0.3em] mb-2">Review Clicks</h3>
            <span className="text-6xl font-bold tracking-tighter">{totalReviews}</span>
          </div>

          <div className="relative overflow-hidden bg-white p-10 rounded-[2rem] group transition-all shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-black/5 rounded-2xl border border-black/5 group-hover:rotate-12 transition-transform">
                <BarChart3 className="w-5 h-5 text-black/80" />
              </div>
            </div>
            <h3 className="text-sm font-light text-black/40 uppercase tracking-[0.3em] mb-2">Efficiency Rate</h3>
            <span className="text-6xl font-bold tracking-tighter text-black">{ctr}%</span>
          </div>
        </div>

        {/* TEAM PERFORMANCE - LISTA VIP */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-white/10"></div>
            <h2 className="text-sm font-light tracking-[0.5em] uppercase opacity-40 text-white">Elite Performance</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {servers?.map((server) => {
              const serverViews = events?.filter(e => e.server_id === server.id && e.type === 'app_view').length || 0;
              const serverReviews = events?.filter(e => e.server_id === server.id && e.type === 'review_click').length || 0;
              
              return (
                <div key={server.id} className="group bg-[#0A0A0A] border border-white/[0.03] p-8 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between hover:bg-[#0F0F0F] hover:border-white/10 transition-all cursor-default">
                  <div className="flex items-center gap-8 mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-colors">
                      <UserCircle2 className="w-8 h-8 opacity-20 group-hover:opacity-60 transition-opacity" />
                    </div>
                    <div>
                      <h4 className="text-xl font-light tracking-tight">{server.name}</h4>
                      <p className="text-[10px] opacity-20 uppercase tracking-[0.3em] mt-1">Operator {server.id_code}</p>
                    </div>
                  </div>

                  <div className="flex gap-16">
                    <div className="text-center md:text-right">
                      <p className="text-[9px] opacity-30 uppercase tracking-[0.3em] mb-2 font-medium">Views</p>
                      <p className="text-3xl font-bold tracking-tighter">{serverViews}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-[9px] opacity-30 uppercase tracking-[0.3em] mb-2 font-medium">Reviews</p>
                      <p className="text-3xl font-bold tracking-tighter">{serverReviews}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/[0.03] flex justify-between items-center opacity-20 hover:opacity-50 transition-opacity">
        <p className="text-[10px] tracking-[0.4em] uppercase">Chef Experience Technology</p>
        <p className="text-[10px] tracking-[0.4em] uppercase">Looping Media Group</p>
      </footer>
    </div>
  );
}