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
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-transparent text-[10px] text-white/50 transition hover:border-[#E5D3B3]/80 hover:text-[#E5D3B3]"
      >
        ?
      </button>

      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-8 z-30 hidden w-64 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-4 text-xs font-light leading-relaxed text-white/90 shadow-2xl group-hover:block backdrop-blur-xl">
        {text}
      </div>
    </div>
  );
}

function getRangeStart(range: string) {
  const now = new Date();
  const start = new Date(now);

  if (range === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    start.setDate(start.getDate() - 7);
  } else if (range === "month") {
    start.setDate(start.getDate() - 30);
  } else if (range === "year") {
    start.setDate(start.getDate() - 365);
  } else {
    start.setDate(start.getDate() - 7);
  }

  return start.toISOString();
}

function buildRangeHref(slug: string, range: string) {
  return `/dashboard/${slug}?range=${range}`;
}

export default async function DashboardPage({
  params,
  searchParams,
}: PageProps) {
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

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (restaurantError || !restaurant) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-6 text-white flex items-center justify-center relative overflow-hidden text-center font-sans">
         <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <h1 className="text-4xl font-light tracking-wide relative z-10">Location Not Found</h1>
      </main>
    );
  }

  const { count: appViewsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("type", "app_view") // Mudança para 'type' como no seu banco
    .gte("created_at", rangeStart);

  const { count: reviewClicksCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("type", "review_click") // Mudança para 'type'
    .gte("created_at", rangeStart);

  const totalViews = appViewsCount ?? 0;
  const totalReviews = reviewClicksCount ?? 0;

  const overallConversionRate =
    totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0.0";

  const { data: appViewEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("type", "app_view")
    .gte("created_at", rangeStart)
    .not("server_id", "is", null);

  const { data: reviewClickEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("type", "review_click")
    .gte("created_at", rangeStart)
    .not("server_id", "is", null);

  const { data: servers } = await supabase
    .from("servers")
    .select("id, name")
    .eq("restaurant_id", restaurant.id);

  const serverRows = (servers ?? []) as { id: string; name: string }[];

  const appViewCountByServer: Record<string, number> = {};
  appViewEvents?.forEach((event) => {
    if (!event.server_id) return;
    appViewCountByServer[event.server_id] = (appViewCountByServer[event.server_id] || 0) + 1;
  });

  const reviewCountByServer: Record<string, number> = {};
  reviewClickEvents?.forEach((event) => {
    if (!event.server_id) return;
    reviewCountByServer[event.server_id] = (reviewCountByServer[event.server_id] || 0) + 1;
  });

  const appRanking = [...serverRows]
    .map((server) => ({ id: server.id, name: server.name, appViews: appViewCountByServer[server.id] || 0 }))
    .sort((a, b) => b.appViews - a.appViews);

  const reviewRanking = [...serverRows]
    .map((server) => ({ id: server.id, name: server.name, reviewClicks: reviewCountByServer[server.id] || 0 }))
    .sort((a, b) => b.reviewClicks - a.reviewClicks);

  const topPerformerName = reviewRanking[0]?.reviewClicks > 0 || appRanking[0]?.appViews > 0
      ? reviewRanking[0]?.reviewClicks >= appRanking[0]?.appViews ? reviewRanking[0].name : appRanking[0].name
      : "No data";

  const activeAppServers = appRanking.filter((server) => server.appViews > 0).length;
  const activeReviewServers = reviewRanking.filter((server) => server.reviewClicks > 0).length;

  const maxAppViews = Math.max(...appRanking.map(s => s.appViews), 1);
  const maxReviewClicks = Math.max(...reviewRanking.map(s => s.reviewClicks), 1);

  const getStyle = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num > 0 ? "text-white/95" : "text-white/20";
  };

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 md:py-16 text-[#f8f9fa] font-sans selection:bg-[#E5D3B3] selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <div className="mx-auto max-w-[1500px] space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-12 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#E5D3B3]/80 font-light uppercase mb-3">Chef Experience Dashboard</p>
            <h1 className="text-5xl md:text-6xl font-light tracking-wide text-white uppercase">{restaurant.name}</h1>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1.5 backdrop-blur-sm">
            {["day", "week", "month", "year"].map((item) => (
              <Link key={item} href={buildRangeHref(slug, item)} className={`rounded-full px-8 py-2.5 text-xs uppercase tracking-widest font-medium transition-all ${item === range ? "bg-[#E5D3B3] text-black shadow-[0_0_20px_rgba(229,211,179,0.2)]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>{item}</Link>
            ))}
          </div>
        </div>

        {/* Master Card Hero */}
        <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-8">
            <div>
              <span className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#E5D3B3] shadow-[0_0_10px_rgba(229,211,179,0.6)]"></span>
                Top Performer
              </span>
              <h2 className={`mt-5 text-5xl md:text-6xl font-light tracking-wide ${topPerformerName === "No data" ? "text-white/30" : "text-white uppercase"}`}>{topPerformerName}</h2>
              <p className="mt-4 max-w-lg text-white/50 text-base font-light leading-relaxed">Best overall performance combining app engagement and review generation.</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Total Score</p>
              <p className={`text-7xl md:text-8xl font-extralight tracking-tighter leading-none ${totalViews + totalReviews > 0 ? "text-[#E5D3B3]" : "text-white/20"}`}>{totalViews + totalReviews}</p>
            </div>
          </div>

          <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="border-t border-white/10 pt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-white/50 uppercase tracking-[0.2em]">App Views</p>
                <HelpTooltip text="Total app views generated." />
              </div>
              <p className={`mt-4 text-4xl md:text-5xl font-light ${getStyle(totalViews)}`}>{totalViews}</p>
            </div>
            <div className="border-t border-white/10 pt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-white/50 uppercase tracking-[0.2em]">Review Clicks</p>
                <HelpTooltip text="Total review clicks generated." />
              </div>
              <p className={`mt-4 text-4xl md:text-5xl font-light ${getStyle(totalReviews)}`}>{totalReviews}</p>
            </div>
            <div className="border-t border-white/10 pt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-white/50 uppercase tracking-[0.2em]">Conversion Rate</p>
                <HelpTooltip text="Efficiency between views and reviews." />
              </div>
              <p className={`mt-4 text-4xl md:text-5xl font-light ${getStyle(overallConversionRate)}`}>{overallConversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Linha de Métricas Secundárias */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] py-10 px-6 shadow-xl text-center">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/5 px-6 py-4 md:py-0">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-3">Active App Servers</p>
            <p className={`text-3xl font-light ${getStyle(activeAppServers)}`}>{activeAppServers}</p>
          </div>
          <div className="flex-1 px-6 py-4 md:py-0">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-3">Active Review Servers</p>
            <p className={`text-3xl font-light ${getStyle(activeReviewServers)}`}>{activeReviewServers}</p>
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
          {/* App Ranking */}
          <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] p-10 shadow-xl">
            <h3 className="text-sm text-white/70 font-medium uppercase tracking-[0.2em] mb-10 border-b border-white/5 pb-6">App Ranking</h3>
            <div className="space-y-8">
              {appRanking.slice(0, 5).map((server, index) => (
                <div key={server.id}>
                  <div className="flex items-center justify-between mb-3 font-light">
                    <span className="text-white/30 text-xs">0{index + 1} — {server.name}</span>
                    <span className={getStyle(server.appViews)}>{server.appViews}</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/[0.03] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E5D3B3]/20 to-[#E5D3B3] transition-all duration-1000" style={{ width: `${(server.appViews / maxAppViews) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Ranking */}
          <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] p-10 shadow-xl">
            <h3 className="text-sm text-white/70 font-medium uppercase tracking-[0.2em] mb-10 border-b border-white/5 pb-6">Review Ranking</h3>
            <div className="space-y-8">
              {reviewRanking.slice(0, 5).map((server, index) => (
                <div key={server.id}>
                  <div className="flex items-center justify-between mb-3 font-light">
                    <span className="text-white/30 text-xs">0{index + 1} — {server.name}</span>
                    <span className={getStyle(server.reviewClicks)}>{server.reviewClicks}</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/[0.03] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E5D3B3]/20 to-[#E5D3B3] transition-all duration-1000" style={{ width: `${(server.reviewClicks / maxReviewClicks) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}