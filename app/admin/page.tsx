"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  // Estados do formulário New Restaurant
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  // Estados do formulário New Server
  const [serverName, setServerName] = useState("");
  const [serverCode, setServerCode] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [loadingServer, setLoadingServer] = useState(false);

  // Lista temporária de restaurantes (vamos trocar por busca real depois)
  const [restaurants] = useState([
    { id: "1", name: "Casa Pollastro", slug: "casa-pollastro" },
    { id: "2", name: "Chamas do Brasil", slug: "chamas-do-brasil" },
  ]);

  async function handleCreateRestaurant(e: FormEvent) {
    e.preventDefault();
    setLoadingRestaurant(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .insert({
          name: restaurantName,
          slug: restaurantSlug,
          google_review_url: googleReviewUrl,
          owner_id: "seu-user-id-aqui", // ← depois vamos pegar do auth
        });

      if (error) throw error;

      alert("✅ Restaurante criado com sucesso!");
      setRestaurantName("");
      setRestaurantSlug("");
      setGoogleReviewUrl("");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar restaurante: " + err.message);
    } finally {
      setLoadingRestaurant(false);
    }
  }

  async function handleCreateServer(e: FormEvent) {
    e.preventDefault();
    setLoadingServer(true);

    try {
      const { error } = await supabase
        .from("servers")
        .insert({
          name: serverName,
          code: serverCode,
          restaurant_id: selectedRestaurantId,
        });

      if (error) throw error;

      alert("✅ Server criado com sucesso!");
      setServerName("");
      setServerCode("");
      setSelectedRestaurantId("");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar server: " + err.message);
    } finally {
      setLoadingServer(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#f8f9fa] font-sans relative overflow-hidden">
      {/* TEXTURA DE FUNDO */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      <div className="max-w-screen-2xl mx-auto relative z-10 p-8 md:p-12">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-light">LOOPING MEDIA</p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">Chef Experience Admin</h1>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="text-xs uppercase tracking-[0.25em] px-8 py-4 border border-white/20 hover:border-white/40 rounded-3xl transition-all hover:bg-white/5"
          >
            SIGN OUT
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* CARD NEW RESTAURANT */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.015] p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#E5D3B3]"></div>
              <h2 className="text-xl font-light tracking-widest uppercase">New Restaurant</h2>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-8">
              <div className="relative">
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white placeholder-transparent focus:outline-none transition-all text-base"
                  placeholder=" "
                />
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  Restaurant name
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={restaurantSlug}
                  onChange={(e) => setRestaurantSlug(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white placeholder-transparent focus:outline-none transition-all text-base"
                  placeholder=" "
                />
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  slug-example
                </label>
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white placeholder-transparent focus:outline-none transition-all text-base"
                  placeholder=" "
                />
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  Google review URL
                </label>
              </div>

              <button
                type="submit"
                disabled={loadingRestaurant}
                className="w-full bg-gradient-to-r from-zinc-200 via-white to-zinc-100 text-zinc-950 py-6 text-sm font-semibold uppercase tracking-[0.125em] rounded-3xl hover:from-white hover:to-zinc-100 shadow-lg hover:shadow-white/20 active:scale-[0.97] transition-all duration-300 disabled:opacity-60"
              >
                {loadingRestaurant ? "Creating..." : "CREATE RESTAURANT"}
              </button>
            </form>
          </div>

          {/* CARD NEW SERVER */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.015] p-8 md:p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#E5D3B3]"></div>
              <h2 className="text-xl font-light tracking-widest uppercase">New Server</h2>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-8">
              <div className="relative">
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white placeholder-transparent focus:outline-none transition-all text-base"
                  placeholder=" "
                />
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  Server name
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={serverCode}
                  onChange={(e) => setServerCode(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white placeholder-transparent focus:outline-none transition-all text-base"
                  placeholder=" "
                />
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  Server code (e.g., 001)
                </label>
              </div>

              <div className="relative">
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-[#E5D3B3]/60 rounded-3xl px-7 py-7 text-white focus:outline-none transition-all text-base appearance-none"
                >
                  <option value="" disabled>
                    Select restaurant...
                  </option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <label className="absolute left-7 top-7 text-xs text-white/40 transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#E5D3B3]/70 pointer-events-none">
                  Select restaurant
                </label>
              </div>

              <button
                type="submit"
                disabled={loadingServer}
                className="w-full bg-gradient-to-r from-[#E5D3B3] to-[#f0e4d0] text-[#050505] py-6 text-sm font-semibold uppercase tracking-[0.125em] rounded-3xl hover:brightness-110 shadow-lg hover:shadow-[#E5D3B3]/30 active:scale-[0.97] transition-all duration-300 disabled:opacity-60"
              >
                {loadingServer ? "Creating..." : "CREATE SERVER"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}