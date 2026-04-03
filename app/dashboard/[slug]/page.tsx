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
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-transparent text-[9px] text-white/40 transition hover:border-white hover:text-white"
      >
        ?
      </button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-8 z-50 hidden w-64 rounded-lg border border-white/10 bg-[#0A0A0A] p-4 text-[11px] font-light leading-relaxed text-white/70 shadow-2xl group-hover:block backdrop-blur-xl">
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

  const { count: totalViews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "app_view").gte("created_at", rangeStart);
  const { count: totalReviews } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).eq("event_type", "review_click").gte("created_at", rangeStart);

  const views = totalViews ?? 0;
  const reviews = totalReviews ?? 0;
  const ctr = views > 0 ? ((reviews / views) * 100).toFixed(1) : "0.0";

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
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <div className="max-w-[1400px] mx-auto px-8 py-16 space-y-24">
        
        {/* HEADER: ESTILO LOGIN (CLEAN) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-4">
            <p className="text-[10px] tracking-[0.5em] text-white/30 uppercase font-light">Chef Experience Intelligence</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase leading-none">{restaurant.name}</h1>
          </div>
          
          <nav className="flex items-center gap-1 border-b border-white/10 pb-2">
            {["day", "week", "month", "year"].map(r => (
              <Link key={r} href={`/dashboard/${slug}?range=${r}`} 
                className={`px-4 py-1 text-[10px] uppercase tracking-[0.3em] transition-all ${range === r ? "text-white font-bold border-b border-white" : "text-white/20 hover:text-white"}`}>
                {r}
              </Link>
            ))}
          </nav>
        </header>

        {/* HERO: SILVER GRADIENT CARD */}
        <section className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-12 md:p-20 overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-medium">Top Performer</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.8]">{topPerformer}</h2>
              <p className="text-white/30 text-sm tracking-widest font-light">LÍDER DE PERFORMANCE NESTA UNIDADE</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/20 text-[10px] uppercase tracking-[0.5em] mb-4">Unit Score</p>
              <p className="text-9xl md:text-[12rem] font-bold leading-none tracking-tighter text-white">{views + reviews}</p>
            </div>
          </div>
        </section>

        {/* STATS: GRID MINIMALISTA */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-white/10">
          {[
            { label: "App Views", val: views },
            { label: "Review Clicks", val: reviews },
            { label: "Conversion", val: `${ctr}%` },
            { label: "Active App", val: appRanking.filter(s => s.count > 0).length },
            { label: "Active Review", val: reviewRanking.filter(s => s.count > 0).length }
          ].map((m, i) => (
            <div key={i} className="py-12 px-4 border-r border-white/5 last:border-0 text-center space-y-6">
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">{m.label}</p>
              <p className="text-4xl md:text-5xl font-bold tracking-tighter">{m.val}</p>
            </div>
          ))}
        </div>

        {/* RANKINGS: ESTILO EDITORIAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          {[
            { title: "App Engagement", data: appRanking },
            { title: "Review Performance", data: reviewRanking }
          ].map((rank, i) => (
            <div key={i} className="space-y-12">
              <h3 className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-bold border-b border-white/10 pb-6 italic">{rank.title}</h3>
              <div className="space-y-8">
                {rank.data.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-end border-b border-white/5 pb-4 group">
                    <span className="text-lg font-light tracking-tight text-white/60 group-hover:text-white transition-colors uppercase">
                      <span className="text-white/20 mr-4 font-mono">0{idx + 1}</span>{s.name}
                    </span>
                    <span className="text-2xl font-bold text-white tracking-tighter">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="pt-20 opacity-20">
          <p className="text-[9px] tracking-[0.5em] uppercase text-center font-light">© 2026 LOOPING MEDIA INTELLIGENCE</p>
        </footer>
      </div>
    </main>
  );
}