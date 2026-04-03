import { supabase } from "../lib/supabase";

export default async function Home() {
  const { count: viewsCount, error: viewsError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "app_view");

  if (viewsError) {
    console.error("Erro ao buscar views:", viewsError);
  }

  const totalViews = viewsCount ?? 0;
// Buscar eventos com server_id
const { data: events } = await supabase
  .from("events")
  .select("server_id")
  .eq("event_type", "app_view")
  .not("server_id", "is", null);

// Contar acessos por server
const serverCount: Record<string, number> = {};

events?.forEach((event) => {
  if (!event.server_id) return;
  serverCount[event.server_id] =
    (serverCount[event.server_id] || 0) + 1;
});

// Descobrir o server com mais acessos
let topServerId = null;
let maxViews = 0;

for (const serverId in serverCount) {
  if (serverCount[serverId] > maxViews) {
    maxViews = serverCount[serverId];
    topServerId = serverId;
  }
}

// Buscar nome do server
let topServerName = "Sem dados";

const { data: servers, error: serversError } = await supabase
  .from("servers")
  .select("id, name");

console.log("serversError:", serversError);
console.log("servers:", servers);

if (topServerId && servers) {
  const matchedServer = servers.find((server) => server.id === topServerId);

  if (matchedServer) {
    topServerName = matchedServer.name;
  }
}
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">
          Chef Experience Dashboard
        </p>

        <h1 className="text-4xl md:text-6xl font-semibold mt-4">
          Chamas do Brazil
        </h1>

        <p className="text-white/60 mt-4 text-lg">
          Live performance overview
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50">App Views</p>
            <p className="text-5xl font-semibold mt-3">{totalViews}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
  <p className="text-sm text-white/50">Top Server</p>
  <p className="text-3xl font-semibold mt-3">{topServerName}</p>
</div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50">Status</p>
            <p className="text-3xl font-semibold mt-3 text-green-400">Online</p>
          </div>
        </div>
      </div>
    </main>
  );
}