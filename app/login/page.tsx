"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      const user = loginData.user;

      if (!user) {
        setError("Usuário não encontrado após o login.");
        setLoading(false);
        return;
      }

      if (user.email === "info.loopingmedia@gmail.com") {
        router.push("/admin");
      } else {
        const { data: restaurant, error: dbError } = await supabase
          .from("restaurants")
          .select("slug")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (dbError) {
          console.error("Erro no banco:", dbError);
          setError("Erro ao conectar com o banco de dados.");
          setLoading(false);
          return;
        }

        if (restaurant && restaurant.slug) {
          router.push(`/dashboard/${restaurant.slug}`);
        } else {
          setError("Nenhum restaurante vinculado a este e-mail.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex font-sans selection:bg-white selection:text-black relative overflow-hidden">
      {/* TEXTURA DE FUNDO */}
      <div 
        className="absolute inset-0 z-0 opacity-10 grayscale scale-110"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'subtleMove 30s ease-in-out infinite alternate'
        }}
      ></div>
      
      <div className="absolute inset-0 bg-black/80 z-10"></div>

      <div className="relative z-20 flex w-full min-h-screen">
        
        {/* Lado Esquerdo - Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 border-r border-white/5 bg-[#050505]">
          <div className="relative z-10">
            <h1 className="text-2xl font-light tracking-[0.3em] uppercase text-white/90">
              Chef<br />Experience
            </h1>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="text-5xl font-semibold tracking-tight leading-[1.1] mb-6 text-white">
              STOP SELLING WORDS.<br />START SELLING HUNGER.
            </h2>
            <p className="text-white/60 text-lg font-light tracking-wide">
              The First Video-Menu Technology in the USA.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-white/30 tracking-[0.2em] uppercase">
              © {new Date().getFullYear()} Looping Media
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-gradient-to-br from-[#f8f9fa]/15 via-[#404040]/25 via-[#080808]/90 to-black border-l border-white/5">
          <div className="w-full max-w-[460px] space-y-12 relative z-20">
            
            <div className="mb-10">
              <h2 className="text-3xl font-light tracking-wide">Welcome.</h2>
              <p className="mt-2 text-white/40 text-sm font-light">
                Sign in to access your digital operation.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-10">
              {/* Campo Email - Mais elegante (caixa arredondada com fundo sutil) */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-white/40 rounded-3xl px-6 pt-7 pb-3 text-white text-base placeholder-transparent focus:outline-none transition-all duration-300"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-6 top-5 text-xs text-white/40 transition-all duration-300 peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-white/70 pointer-events-none"
                >
                  Email address
                </label>
              </div>

              {/* Campo Password - Mesmo estilo elegante */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="peer w-full bg-white/5 border border-white/10 focus:border-white/40 rounded-3xl px-6 pt-7 pb-3 text-white text-base placeholder-transparent focus:outline-none transition-all duration-300"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="absolute left-6 top-5 text-xs text-white/40 transition-all duration-300 peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-white/70 pointer-events-none"
                >
                  Password
                </label>
              </div>

              {error && (
                <p className="text-red-400/80 text-sm font-light">{error}</p>
              )}

              {/* Botão - Cantos bem arredondados + gradiente silver metálico */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-zinc-200 via-white to-zinc-100 text-zinc-950 py-6 text-sm font-semibold uppercase tracking-[0.125em] rounded-3xl hover:from-white hover:to-zinc-100 shadow-lg hover:shadow-white/20 active:scale-95 transition-all duration-300 disabled:opacity-60"
              >
                {loading ? "Authenticating..." : "SIGN IN"}
              </button>
            </form>
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