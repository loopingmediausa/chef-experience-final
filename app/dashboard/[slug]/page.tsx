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
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-transparent text-[10px] text-white/70 transition hover:border-[#E5D3B3] hover:text-[#E5D3B3]"
      >
        ?
      </button>

      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 top-8 z-30 hidden w-64 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-4 text-sm font-normal leading-relaxed text-white/90 shadow-2xl group-hover:block backdrop-blur-xl">
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
      <main className="min-h-screen bg-[#050505] px-6 py-6 text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-normal tracking-wide">Location Not Found</h1>
          <p className="mt-4 text-white/70 text-lg font-normal">
            Please verify the unique link for this dashboard.
          </p>
        </div>
      </main>
    );
  }

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

  const overallConversionRate =
    totalViews > 0 ? ((totalReviews / totalViews) * 100).toFixed(1) : "0.0";

  const { data: appViewEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "app_view")
    .gte("created_at", rangeStart)
    .not("server_id", "is", null);

  const { data: reviewClickEvents } = await supabase
    .from("events")
    .select("server_id")
    .eq("restaurant_id", restaurant.id)
    .eq("event_type", "review_click")
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
    .map((server) => ({
      id: server.id,
      name: server.name,
      appViews: appViewCountByServer[server.id] || 0,
    }))
    .sort((a, b) => b.appViews - a.appViews);

  const reviewRanking = [...serverRows]
    .map((server) => ({
      id: server.id,
      name: server.name,
      reviewClicks: reviewCountByServer[server.id] || 0,
    }))
    .sort((a, b) => b.reviewClicks - a.reviewClicks);

  const topPerformerName =
    (reviewRanking[0]?.reviewClicks || 0) > 0 || (appRanking[0]?.appViews || 0) > 0
      ? (reviewRanking[0]?.reviewClicks || 0) >= (appRanking[0]?.appViews || 0) ? reviewRanking[0]?.name : appRanking[0]?.name
      : "No data";

  const activeAppServers = appRanking.filter((server) => server.appViews > 0).length;
  const activeReviewServers = reviewRanking.filter(
    (server) => server.reviewClicks > 0
  ).length;

  const maxAppViews = appRanking.length > 0 ? Math.max(...appRanking.map(s => s.appViews), 1) : 1;
  const maxReviewClicks = reviewRanking.length > 0 ? Math.max(...reviewRanking.map(s => s.reviewClicks), 1) : 1;

  const getStyle = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num > 0 ? "text-white" : "text-white/30";
  };

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 md:py-16 text-[#f8f9fa] font-sans selection:bg-[#E5D3B3] selection:text-black relative overflow-hidden">
      
      {/* Fundo sutil para textura idêntico ao Admin */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      <div className="mx-auto max-w-[1500px] space-y-10 relative z-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-12 border-b border-white/10 pb-8">
          <div>
            <p className="text-sm tracking-[0.3em] text-[#E5D3B3] font-medium uppercase mb-3">
              Chef Experience Dashboard
            </p>
            <h1 className="text-5xl md:text-6xl font-medium tracking-wide text-white uppercase">
              {restaurant.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1.5 backdrop-blur-sm shadow-inner">
            {["day", "week", "month", "year"].map((item) => (
              <Link
                key={item}
                href={buildRangeHref(slug, item)}
                className={`rounded-full px-8 py-2.5 text-xs uppercase tracking-widest font-bold transition-all ${
                  item === range
                    ? "bg-[#E5D3B3] text-black shadow-[0_0_20px_rgba(229,211,179,0.2)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Master Card Rose Gold - Top Performer */}
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-8">
            <div>
              <span className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/70 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5D3B3] shadow-[0_0_10px_rgba(229,211,179,0.6)]"></span>
                Top Performer
              </span>

              <h2 className={`mt-5 text-6xl md:text-7xl font-medium tracking-wide ${topPerformerName === "No data" ? "text-white/40" : "text-white uppercase"}`}>
                {topPerformerName}
              </h2>

              <p className="mt-4 max-w-lg text-white/60 text-lg font-normal leading-relaxed">
                Best overall performance combining app engagement and review generation.
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70 mb-2 font-bold">Performer Score</p>
              <p className={`text-8xl md:text-9xl font-normal tracking-tighter leading-none ${totalViews + totalReviews > 0 ? "text-[#E5D3B3]" : "text-white/30"}`}>
                {totalViews + totalReviews}
              </p>
            </div>
          </div>
        </div>

        {/* Linha de Métricas Secundárias (TOTAL GERAL DA CASA) */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] py-10 px-6 shadow-xl">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 px-6 py-4 md:py-0 text-center last:border-0">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-sm text-white/70 uppercase tracking-widest font-bold">App Views</p>
              <HelpTooltip text="Total number of visits to the restaurant app." />
            </div>
            <p className={`text-4xl md:text-5xl font-medium ${getStyle(totalViews)}`}>{totalViews}</p>
          </div>

          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 px-6 py-4 md:py-0 text-center last:border-0">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-sm text-white/70 uppercase tracking-widest font-bold">Review Clicks</p>
              <HelpTooltip text="Total number of clicks on the review flow." />
            </div>
            <p className={`text-4xl md:text-5xl font-medium ${getStyle(totalReviews)}`}>{totalReviews}</p>
          </div>

          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 px-6 py-4 md:py-0 text-center last:border-0">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-sm text-white/70 uppercase tracking-widest font-bold">Conversion</p>
              <HelpTooltip text="Percentage of app visits that turned into review clicks." />
            </div>
            <p className={`text-4xl md:text-5xl font-medium ${getStyle(overallConversionRate)}`}>{overallConversionRate}%</p>
          </div>

          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 px-6 py-4 md:py-0 text-center last:border-0">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-sm text-white/70 uppercase tracking-widest font-bold">Active App</p>
              <HelpTooltip text="Servers with at least one app view in the selected period." />
            </div>
            <p className={`text-4xl md:text-5xl font-medium ${getStyle(activeAppServers)}`}>{activeAppServers}</p>
          </div>

          <div className="flex-1 px-6 py-4 md:py-0 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-sm text-white/70 uppercase tracking-widest font-bold">Active Review</p>
              <HelpTooltip text="Servers with at least one review click in the selected period." />
            </div>
            <p className={`text-4xl md:text-5xl font-medium ${getStyle(activeReviewServers)}`}>{activeReviewServers}</p>
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
          <div className="rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] p-10 shadow-xl">
            <div className="mb-10 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
              <p className="text-base text-white/90 font-bold uppercase tracking-widest">App Ranking</p>
              <HelpTooltip text="Ranking of servers by app views generated." />
            </div>

            <div className="space-y-8">
              {appRanking.length === 0 ? (
                <p className="text-lg font-normal text-white/50 text-center py-6">No data available.</p>
              ) : (
                appRanking.slice(0, 5).map((server, index) => (
                  <div key={server.id} className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-5">
                        <span className="text-sm font-bold text-white/50 w-5">0{index + 1}</span>
                        <span className="text-lg text-white font-medium tracking-wide">{server.name}</span>
                      </div>
                      <span className={`text-xl font-bold ${getStyle(server.appViews)}`}>{server.appViews}</span>
                    </div>
                    {/* Linha de Progresso */}
                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#E5D3B3]/60 to-[#E5D3B3] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(server.appViews / maxAppViews) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111] via-[#0a0a0a] to-[#050505] p-10 shadow-xl">
            <div className="mb-10 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
              <p className="text-base text-white/90 font-bold uppercase tracking-widest">Review Ranking</p>
              <HelpTooltip text="Ranking of servers by review clicks generated." />
            </div>

            <div className="space-y-8">
              {reviewRanking.length === 0 ? (
                <p className="text-lg font-normal text-white/50 text-center py-6">No data available.</p>
              ) : (
                reviewRanking.slice(0, 5).map((server, index) => (
                  <div key={server.id} className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-5">
                        <span className="text-sm font-bold text-white/50 w-5">0{index + 1}</span>
                        <span className="text-lg text-white font-medium tracking-wide">{server.name}</span>
                      </div>
                      <span className={`text-xl font-bold ${getStyle(server.reviewClicks)}`}>{server.reviewClicks}</span>
                    </div>
                    {/* Linha de Progresso */}
                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#E5D3B3]/60 to-[#E5D3B3] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(server.reviewClicks / maxReviewClicks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}