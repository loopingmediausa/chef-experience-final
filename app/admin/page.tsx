"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  review_url?: string | null;
};

type Server = {
  id: string;
  name: string;
  code: string;
  restaurant_id: string;
  restaurants?: {
    slug: string;
    name: string;
  } | null;
};

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [restaurantReviewUrl, setRestaurantReviewUrl] = useState("");

  const [serverName, setServerName] = useState("");
  const [serverCode, setServerCode] = useState("");
  const [serverRestaurantId, setServerRestaurantId] = useState("");

  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function loadData() {
    const restaurantsRes = await fetch("/api/restaurants");
    const restaurantsData = await restaurantsRes.json();
    setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);

    const serversRes = await fetch("/api/servers");
    const serversData = await serversRes.json();
    setServers(Array.isArray(serversData) ? serversData : []);
  }

  useEffect(() => {
    loadData();
    setOrigin(window.location.origin);
  }, []);

  async function handleCreateRestaurant(e: FormEvent) {
    e.preventDefault();
    setLoadingRestaurant(true);

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: restaurantName,
          slug: restaurantSlug,
          review_url: restaurantReviewUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar restaurante");
        return;
      }

      setRestaurantName("");
      setRestaurantSlug("");
      setRestaurantReviewUrl("");
      await loadData();
    } catch {
      alert("Erro inesperado ao criar restaurante");
    } finally {
      setLoadingRestaurant(false);
    }
  }

  async function handleCreateServer(e: FormEvent) {
    e.preventDefault();
    setLoadingServer(true);

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serverName,
          code: serverCode,
          restaurant_id: serverRestaurantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar server");
        return;
      }

      setServerName("");
      setServerCode("");
      setServerRestaurantId("");
      await loadData();
    } catch {
      alert("Erro inesperado ao criar server");
    } finally {
      setLoadingServer(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#f8f9fa] p-6 md:p-10 font-sans selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* Textura de fundo bem sutil */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      <div className="max-w-[1500px] mx-auto relative z-10 space-y-10">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-8 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-light mb-3">
              Looping Media
            </p>
            <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white">
              Chef Experience Admin
            </h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1 mt-2"
          >
            Sign Out
          </button>
        </div>

        {/* Formulários de Criação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          
          {/* Create Restaurant */}
          <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 shadow-2xl">
            <h2 className="text-2xl font-light tracking-wide text-white/90 mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5D3B3] shadow-[0_0_8px_rgba(229,211,179,0.5)]"></span> New Restaurant
            </h2>

            <form onSubmit={handleCreateRestaurant} className="space-y-6">
              <div>
                <input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Restaurant name"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none"
                />
              </div>

              <div>
                <input
                  value={restaurantSlug}
                  onChange={(e) => setRestaurantSlug(e.target.value)}
                  placeholder="slug-example"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none"
                />
              </div>

              <div>
                <input
                  value={restaurantReviewUrl}
                  onChange={(e) => setRestaurantReviewUrl(e.target.value)}
                  placeholder="Google review URL"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingRestaurant}
                className="w-full bg-white/90 text-black py-4 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-lg"
              >
                {loadingRestaurant ? "Creating..." : "Create Restaurant"}
              </button>
            </form>
          </div>

          {/* Create Server */}
          <div className="rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#050505] p-10 shadow-2xl">
            <h2 className="text-2xl font-light tracking-wide text-white/90 mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5D3B3] shadow-[0_0_8px_rgba(229,211,179,0.5)]"></span> New Server
            </h2>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div>
                <input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Server name"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none"
                />
              </div>

              <div>
                <input
                  value={serverCode}
                  onChange={(e) => setServerCode(e.target.value)}
                  placeholder="Server code (e.g., 001)"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/30 focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none"
                />
              </div>

              <div>
                <select
                  value={serverRestaurantId}
                  onChange={(e) => setServerRestaurantId(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-5 text-white focus:border-white/30 focus:bg-white/[0.04] focus:ring-0 transition-all text-base font-light outline-none appearance-none"
                >
                  <option value="" className="bg-[#0a0a0a] text-white/50">Select restaurant...</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id} className="bg-[#0a0a0a] text-white">
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingServer}
                className="w-full bg-[#E5D3B3] text-black py-4 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#f4e2c2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-lg"
              >
                {loadingServer ? "Creating..." : "Create Server"}
              </button>
            </form>
          </div>
        </div>

        {/* Listagens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Restaurants List */}
          <div className="lg:col-span-4 rounded-3xl border border-white/5 bg-[#0a0a0a] p-10 shadow-2xl">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 mb-8">Registered Locations</h2>

            <div className="max-h-[700px] overflow-y-auto pr-3 space-y-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#141414] to-[#0a0a0a] p-6 hover:border-white/20 transition-all"
                >
                  <p className="text-lg font-light text-white/90 tracking-wide">{restaurant.name}</p>
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-white/40 flex justify-between">
                      <span>Slug:</span> 
                      <span className="text-white/70">{restaurant.slug}</span>
                    </p>
                    <p className="text-sm text-white/40 flex justify-between items-center">
                      <span>Review URL:</span>
                      <span className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border rounded-md font-medium ${restaurant.review_url ? "border-[#E5D3B3]/30 text-[#E5D3B3] bg-[#E5D3B3]/5" : "border-white/10 text-white/40"}`}>
                        {restaurant.review_url ? "Active" : "Pending"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              {restaurants.length === 0 && (
                <p className="text-base font-light text-white/30 text-center py-8">No locations found.</p>
              )}
            </div>
          </div>

          {/* Servers List */}
          <div className="lg:col-span-8 rounded-3xl border border-white/5 bg-[#0a0a0a] p-10 shadow-2xl">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 mb-8">Active Servers & QR Codes</h2>

            <div className="max-h-[700px] overflow-y-auto pr-3 space-y-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {servers.map((server) => {
                const hasApp = !!server.restaurants?.slug;
                const appLink = hasApp
                  ? `https://appchefexperience.com/${server.restaurants?.slug}?server=${server.code}`
                  : "Link indisponível";

                const restaurantData = restaurants.find(
                  (restaurant) => restaurant.id === server.restaurant_id
                );

                const hasReview = !!(server.restaurants?.slug && restaurantData?.review_url && origin);
                const reviewLink = hasReview
                    ? `${origin}/review/${server.restaurants?.slug}?server=${server.code}`
                    : "Review link indisponível";

                const appQrUrl = hasApp
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appLink)}&bgcolor=FAFAFA&color=050505&margin=2`
                    : "";

                const reviewQrUrl = hasReview
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reviewLink)}&bgcolor=FAFAFA&color=050505&margin=2`
                    : "";

                return (
                  <div
                    key={server.id}
                    className="rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#141414] to-[#0a0a0a] p-8 hover:border-white/10 transition-all shadow-md"
                  >
                    <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-4 mb-8 pb-6 border-b border-white/5">
                      <div>
                        <p className="text-xl font-light tracking-wide text-white/90">{server.name}</p>
                        <p className="text-sm text-white/40 mt-2">
                          ID Code: <span className="text-white/70 font-medium">{server.code}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Assigned to</p>
                        <p className="text-sm font-light text-white/80 bg-white/5 border border-white/10 px-4 py-2 rounded-full inline-block">
                          {server.restaurants?.name ?? "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                      
                      {/* App QR Section */}
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-5 flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${hasApp ? 'bg-[#E5D3B3] shadow-[0_0_5px_rgba(229,211,179,0.5)]' : 'bg-white/20'}`}></span> App Experience
                          </p>
                          
                          <div className="flex gap-6">
                            {appQrUrl ? (
                              <div className="bg-[#fafafa] p-2.5 rounded-lg shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10">
                                <img
                                  src={appQrUrl}
                                  alt={`App QR ${server.name}`}
                                  className="w-24 h-24 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-[116px] h-[116px] bg-[#0f0f0f] rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                                <p className="text-white/20 text-[10px] text-center px-2 uppercase tracking-widest">N/A</p>
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-3 justify-center w-full">
                              <button
                                disabled={!hasApp}
                                onClick={() => {
                                  if (!hasApp) return;
                                  navigator.clipboard.writeText(appLink);
                                  setCopiedId(`app-${server.id}`);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className={`w-full border px-4 py-3 text-[11px] uppercase tracking-[0.15em] text-center transition-colors rounded-lg ${
                                  hasApp 
                                    ? "bg-white/[0.02] border-white/10 hover:bg-white/10 text-white/80" 
                                    : "bg-transparent border-white/5 text-white/20 cursor-not-allowed"
                                }`}
                              >
                                {copiedId === `app-${server.id}` ? "Copied" : "Copy Link"}
                              </button>
                              
                              <a
                                href={hasApp ? appLink : undefined}
                                target={hasApp ? "_blank" : undefined}
                                rel={hasApp ? "noopener noreferrer" : undefined}
                                className={`w-full border px-4 py-3 text-[11px] uppercase tracking-[0.15em] text-center block transition-colors rounded-lg ${
                                  hasApp 
                                    ? "bg-white/[0.02] border-white/10 hover:bg-white/10 text-white/80" 
                                    : "bg-transparent border-white/5 text-white/20 cursor-not-allowed pointer-events-none"
                                }`}
                              >
                                Open App
                              </a>
                            </div>
                          </div>
                        </div>

                        {appQrUrl ? (
                          <a
                            href={appQrUrl}
                            download={`${server.code}-app-qr.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 block w-full bg-white/90 text-black px-4 py-3.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-center hover:bg-white transition-colors rounded-lg"
                          >
                            Download QR
                          </a>
                        ) : (
                          <button disabled className="mt-6 block w-full bg-transparent border border-white/5 text-white/20 px-4 py-3.5 text-[11px] uppercase tracking-[0.15em] text-center cursor-not-allowed rounded-lg">
                            Unavailable
                          </button>
                        )}
                      </div>

                      {/* Review QR Section */}
                      <div className="flex flex-col h-full border-t border-white/5 pt-8 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-5 flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${hasReview ? 'bg-[#E5D3B3] shadow-[0_0_5px_rgba(229,211,179,0.5)]' : 'bg-white/20'}`}></span> Google Review
                          </p>
                          
                          <div className="flex gap-6">
                            {reviewQrUrl ? (
                              <div className="bg-[#fafafa] p-2.5 rounded-lg shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10">
                                <img
                                  src={reviewQrUrl}
                                  alt={`Review QR ${server.name}`}
                                  className="w-24 h-24 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-[116px] h-[116px] bg-[#0f0f0f] rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                                <p className="text-white/20 text-[10px] text-center px-2 uppercase tracking-widest">N/A</p>
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-3 justify-center w-full">
                              <button
                                disabled={!hasReview}
                                onClick={() => {
                                  if (!hasReview) return;
                                  navigator.clipboard.writeText(reviewLink);
                                  setCopiedId(`review-${server.id}`);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className={`w-full border px-4 py-3 text-[11px] uppercase tracking-[0.15em] text-center transition-colors rounded-lg ${
                                  hasReview 
                                    ? "bg-white/[0.02] border-white/10 hover:bg-white/10 text-white/80" 
                                    : "bg-transparent border-white/5 text-white/20 cursor-not-allowed"
                                }`}
                              >
                                {copiedId === `review-${server.id}` ? "Copied" : "Copy Link"}
                              </button>
                              
                              <a
                                href={hasReview ? reviewLink : undefined}
                                target={hasReview ? "_blank" : undefined}
                                rel={hasReview ? "noopener noreferrer" : undefined}
                                className={`w-full border px-4 py-3 text-[11px] uppercase tracking-[0.15em] text-center block transition-colors rounded-lg ${
                                  hasReview 
                                    ? "bg-white/[0.02] border-white/10 hover:bg-white/10 text-white/80" 
                                    : "bg-transparent border-white/5 text-white/20 cursor-not-allowed pointer-events-none"
                                }`}
                              >
                                Open Review
                              </a>
                            </div>
                          </div>
                        </div>

                        {reviewQrUrl ? (
                          <a
                            href={reviewQrUrl}
                            download={`${server.code}-review-qr.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 block w-full bg-white/90 text-black px-4 py-3.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-center hover:bg-white transition-colors rounded-lg"
                          >
                            Download QR
                          </a>
                        ) : (
                          <button disabled className="mt-6 block w-full bg-transparent border border-white/5 text-white/20 px-4 py-3.5 text-[11px] uppercase tracking-[0.15em] text-center cursor-not-allowed rounded-lg">
                            Unavailable
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
              {servers.length === 0 && (
                <p className="text-base font-light text-white/30 text-center py-8">No servers found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
