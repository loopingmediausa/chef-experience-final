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
      // 1. Tentar o login e capturar os dados do usuário na resposta
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

      // 2. Lógica de Redirecionamento Baseada no Perfil
      
      // Se for o seu e-mail de Admin da Looping Media
      if (user.email === "info.loopingmedia@gmail.com") {
        router.push("/admin");
      } else {
        // Busca o slug do restaurante onde o owner_id é igual ao ID do usuário logado
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
          // Redireciona o cliente direto para o Dashboard dele
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

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 text-white placeholder-transparent focus:border-white focus:ring-0 transition-colors peer"
                  placeholder="Email address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 -top-3.5 text-xs text-white/40 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-white/70"
                >
                  Email address
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 text-white placeholder-transparent focus:border-white focus:ring-0 transition-colors peer"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 -top-3.5 text-xs text-white/40 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-white/70"
                >
                  Password
                </label>
              </div>

              {error && (
                <p className="text-red-400/80 text-sm font-light">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4.5 text-[12px] uppercase tracking-[0.25em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 rounded-sm"
              >
                {loading ? "Authenticating..." : "Sign In"}
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