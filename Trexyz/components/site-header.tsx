"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Cómo funciona" },
  { href: "#materiales", label: "Materiales" },
  { href: "#faq", label: "Preguntas" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#inicio"
          className="text-lg font-extrabold tracking-[0.18em] text-white"
          onClick={() => setOpen(false)}
        >
          TRE<span className="text-sky-400">X</span>YZ
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
          <a
            href="#cotizar"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-4px] shadow-primary transition hover:bg-sky-500"
          >
            Cotizar
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-lg text-white md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav id="menu-movil" className="border-t border-border bg-background px-4 pb-5 pt-2 md:hidden" aria-label="Móvil">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-foreground/90 border-b border-border/60"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#cotizar"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-primary px-5 py-3 text-center font-semibold text-white"
          >
            Cotizar mi pieza
          </a>
        </nav>
      )}
    </header>
  );
}
