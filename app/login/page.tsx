"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Verifique se este caminho está correto no seu projeto

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // No momento do sucesso do login:
const { data: { user } } = await supabase.auth.getUser();

// Se for o seu e-mail de admin da Looping
if (user?.email === "seu-email-da-looping@gmail.com") {
  router.push("/admin");
} else {
  // Se for qualquer outro (o cliente), manda direto para o dashboard dele
  // Vamos precisar buscar o slug dele rapidinho
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('owner_id', user?.id)
    .single();

  if (restaurant) {
    router.push(`/dashboard/${restaurant.slug}`);
  } else {
    // Caso de erro: usuário sem restaurante vinculado
    router.push("/login");
  }
}

  return (
    <main className="min-h-screen bg-black text-white flex font-sans selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* TEXTURA DE FUMAÇA ANIMADA NO FUNDO (Cria volume e movimento sutil) */}
      <div 
        className="absolute inset-0 z-0 opacity-10 grayscale scale-110"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544025162-8315ea07f239?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'subtleMove 30s ease-in-out infinite alternate'
        }}
      ></div>
      
      {/* Overlay escura para garantir o minimalismo absoluto e contraste */}
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

        {/* Lado Direito - Formulário de Login (METÁLICO NO FUNDO) */}
        {/* MUDANÇA: Este container agora recebe o degradê metálico Master Card Black */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-gradient-to-br from-[#f8f9fa]/15 via-[#404040]/25 via-[#080808]/90 to-black border-l border-white/5">
          
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-xl font-light tracking-[0.3em] uppercase">
              Chef Experience
            </h1>
          </div>

          {/* MUDANÇA: Simplificamos a caixa, agora o formulário flutua diretamente no fundo */}
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
                  className="block w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 text-white placeholder-transparent focus:border-white focus:ring-0 transition-colors peer [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#080808] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
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
                  className="block w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 text-white placeholder-transparent focus:border-white focus:ring-0 transition-colors peer [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#080808] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
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

              {/* Botão Premium - Sólido comtracking largo */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4.5 text-[12px] uppercase tracking-[0.25em] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 rounded-sm"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </div>
          {/* FIM DO CONTEÚDO DO FORMULÁRIO */}

        </div>
        
      </div>

      {/* DEFINIÇÃO DA ANIMAÇÃO SUTIL (Adicionar ao seu arquivo de CSS global ou style tag) */}
      <style jsx global>{`
        @keyframes subtleMove {
          0% { transform: scale(1.1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-1%, -1%); }
        }
      `}</style>
      
    </main>
  );
}