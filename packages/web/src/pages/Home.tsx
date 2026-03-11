import { Link } from "react-router";
import { Heart, Truck, Star } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stroke">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mimos Decor" className="w-10 h-10 rounded-lg" />
            <span className="font-bold text-[18px] text-text-dark tracking-tight">Mimos Decor</span>
          </div>
          <Link
            to="/login"
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-semibold text-[14px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Acessar Sistema
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-rosa-light to-page-bg">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/logo.png" alt="Mimos Decor" className="w-32 h-32 mx-auto mb-8 drop-shadow-lg" />
          <h1 className="text-[42px] font-extrabold text-text-dark tracking-tight leading-tight mb-4">
            Decoracao com carinho
          </h1>
          <p className="text-[18px] text-text-secondary max-w-xl mx-auto leading-relaxed mb-8">
            Transformamos ambientes com pecas unicas e selecionadas. Cada detalhe pensado para tornar sua casa mais acolhedora.
          </p>
          <Link
            to="/login"
            className="inline-flex bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold text-[16px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
          >
            Entrar no Sistema
          </Link>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-[28px] font-bold text-text-dark tracking-tight text-center mb-12">Nossos Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Produtos Selecionados", desc: "Cada peca e escolhida a dedo, garantindo qualidade e exclusividade para a sua decoracao." },
              { icon: Truck, title: "Entrega Cuidadosa", desc: "Embalagem especial e acompanhamento do pedido do inicio ao fim, com todo o cuidado que voce merece." },
              { icon: Star, title: "Precos Justos", desc: "Trabalhamos com precos transparentes e competitivos nos principais marketplaces do Brasil." },
            ].map((item) => (
              <div key={item.title} className="bg-card-bg border border-stroke rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-rosa-light rounded-xl flex items-center justify-center mx-auto mb-5">
                  <item.icon size={28} className="text-primary" />
                </div>
                <h3 className="text-[17px] font-bold text-text-dark mb-3">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar-bg py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/logo.png" alt="Mimos Decor" className="w-12 h-12 mx-auto mb-4 rounded-lg opacity-80" />
          <p className="text-white/60 text-[13px]">
            &copy; {new Date().getFullYear()} Mimos Decor. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
