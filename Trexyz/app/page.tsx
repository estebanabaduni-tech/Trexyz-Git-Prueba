import {
  Box, Cog, Gift, Layers, Upload, Printer, MessageCircle, MapPin, ArrowRight, HandHeart,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { QuoteForm } from "@/components/quote-form";
import TrexyzLogo from "@/components/trexyz-logo-lazy";

const SERVICES = [
  { icon: Box, title: "Prototipos", text: "Convertí tu idea en una pieza real para probarla, medirla y mejorarla antes de producir." },
  { icon: Cog, title: "Piezas funcionales", text: "Repuestos, soportes y accesorios hechos a medida para lo que necesitás." },
  { icon: Gift, title: "Regalos y decoración", text: "Objetos personalizados con nombre, logo o el diseño que imagines." },
  { icon: Layers, title: "Series pequeñas", text: "Varias unidades de una misma pieza, con terminación pareja." },
];

const STEPS = [
  { icon: Upload, title: "Contanos tu idea", text: "Con un archivo 3D, una foto, un dibujo o simplemente una descripción." },
  { icon: MessageCircle, title: "Te cotizamos", text: "Revisamos tu pedido y te pasamos precio y plazo por WhatsApp." },
  { icon: Printer, title: "Lo imprimimos", text: "Fabricamos tu pieza capa por capa, con el material que elijas." },
  { icon: HandHeart, title: "Lo recibís", text: "Coordinamos la entrega en Villa María." },
];

const MATERIALS = [
  { name: "PLA", tag: "Versátil", text: "Buen detalle y muchos colores. Ideal para prototipos y decoración." },
  { name: "PETG", tag: "Resistente", text: "Más tenaz que el PLA. Para piezas de uso diario y mecánicas." },
  { name: "ABS / ASA", tag: "Técnico", text: "Soporta mejor el calor y los golpes. Para piezas exigidas." },
  { name: "TPU", tag: "Flexible", text: "Material tipo goma para juntas, fundas y amortiguación." },
];

const FAQ = [
  { q: "¿Cuánto tarda mi pedido?", a: "Depende del tamaño y la cantidad de piezas. Mandanos tu consulta y te damos el plazo al cotizar." },
  { q: "¿Y si no tengo el diseño 3D?", a: "Consultanos: contanos qué necesitás, con medidas o fotos, y vemos cómo resolverlo." },
  { q: "¿Qué material me conviene?", a: "Según el uso de la pieza. Si no estás seguro, te asesoramos al cotizar." },
  { q: "¿Dónde están y cómo recibo mi pedido?", a: "Trabajamos en Villa María, Córdoba. La entrega se coordina por WhatsApp." },
];

const sectionTitle = "text-3xl font-bold tracking-tight text-white sm:text-4xl";
const eyebrow = "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="inicio">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
          <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-4 md:py-16 lg:py-20">
            <div className="order-2 min-w-0 text-center md:order-1 md:text-left">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-sky-200">
                <MapPin className="size-3.5" />
                Impresión 3D en Villa María, Córdoba
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Tus ideas,{" "}
                <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  impresas en 3D
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0">
                Prototipos, piezas funcionales y objetos personalizados, hechos a medida. Contanos qué necesitás y te cotizamos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <a
                  href="#cotizar"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-white shadow-[0_0_34px_-6px] shadow-primary transition hover:bg-sky-500"
                >
                  Cotizar mi pieza
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </a>
                <a
                  href="#servicios"
                  className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 font-semibold text-white transition hover:bg-accent"
                >
                  Ver servicios
                </a>
              </div>
            </div>

            <div className="order-1 min-w-0 md:order-2">
              <TrexyzLogo className="mx-auto aspect-[4/5] w-full max-w-[480px] sm:aspect-square md:aspect-[4/5]" />
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <p className={eyebrow}>Servicios</p>
          <h2 className={sectionTitle}>Lo que podemos fabricar para vos</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="group rounded-2xl border border-border bg-gradient-to-b from-card to-background p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_14px_44px_-18px] hover:shadow-blue-500/50"
              >
                <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-blue-600/15 text-sky-300 ring-1 ring-sky-400/25 transition group-hover:bg-blue-600/25">
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* PROCESO */}
        <section id="proceso" className="scroll-mt-20 border-y border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <p className={eyebrow}>Cómo funciona</p>
            <h2 className={sectionTitle}>De la idea a tus manos en 4 pasos</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative overflow-hidden rounded-2xl border border-border bg-background/70 p-6">
                  <span className="pointer-events-none absolute -right-1 -top-3 font-mono text-7xl font-black text-sky-400/10">{i + 1}</span>
                  <Icon className="mb-4 size-7 text-sky-300" />
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* MATERIALES */}
        <section id="materiales" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <p className={eyebrow}>Materiales</p>
          <h2 className={sectionTitle}>El material justo para cada uso</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {MATERIALS.map((m) => (
              <div key={m.name} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30">
                  {m.name.split(" ")[0]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{m.name}</h3>
                    <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[11px] text-sky-300">{m.tag}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6 md:pb-24">
          <p className={eyebrow}>Preguntas frecuentes</p>
          <h2 className={sectionTitle}>Lo que más nos preguntan</h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group p-5 open:bg-accent/30">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-medium text-white [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="text-xl text-sky-300 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* COTIZAR */}
        <section id="cotizar" className="relative scroll-mt-20 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-t from-blue-700/20 to-transparent" aria-hidden />
          <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6 md:pb-28">
            <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-[0_0_80px_-30px] shadow-blue-500/50 backdrop-blur sm:p-10">
              <p className={eyebrow}>Cotizá gratis</p>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">Contanos qué querés imprimir</h2>
              <QuoteForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="font-bold tracking-[0.18em] text-white">
            TRE<span className="text-sky-400">X</span>YZ <span className="font-normal tracking-normal text-muted-foreground">3D</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> Villa María, Córdoba
          </span>
        </div>
      </footer>
    </>
  );
}
