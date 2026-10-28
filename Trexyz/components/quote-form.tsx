"use client";

import { useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { cleanName, cleanText, clampInt, filterNameInput, pickAllowed } from "@/lib/sanitize";

const TIPOS = [
  "Prototipo",
  "Pieza funcional / repuesto",
  "Regalo personalizado",
  "Serie corta",
  "No sé, necesito asesoramiento",
] as const;
const MATERIALES = ["PLA", "PETG", "ABS / ASA", "TPU flexible", "No sé"] as const;

const MAX_NOMBRE = 80;
const MAX_CANTIDAD = 500;
const MAX_DETALLES = 3000;
const COOLDOWN_MS = 15_000; // evita envíos repetidos seguidos

const field =
  "w-full rounded-xl border border-input bg-secondary/60 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

export function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "wait" | "name">("idle");
  const [detallesLen, setDetallesLen] = useState(0);
  const lastSubmit = useRef(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!WHATSAPP_NUMBER) return;

    const d = new FormData(e.currentTarget);

    // Campo trampa: las personas no lo ven; los bots automáticos suelen completarlo.
    if (d.get("sitio_web")) return;

    const now = Date.now();
    if (now - lastSubmit.current < COOLDOWN_MS) {
      setStatus("wait");
      return;
    }

    const nombre = cleanName(d.get("nombre"), MAX_NOMBRE);
    if (!nombre) {
      setStatus("name");
      return;
    }
    const tipo = pickAllowed(d.get("tipo"), TIPOS, TIPOS[0]);
    const material = pickAllowed(d.get("material"), MATERIALES, MATERIALES[0]);
    const cantidad = clampInt(d.get("cantidad"), 1, MAX_CANTIDAD);
    const detalles = cleanText(d.get("detalles"), MAX_DETALLES);

    const text = [
      "Hola TREXYZ! Quiero cotizar una impresión 3D.",
      `• Nombre: ${nombre}`,
      `• Tipo de trabajo: ${tipo}`,
      `• Material: ${material}`,
      `• Cantidad: ${cantidad}`,
      `• Detalles: ${detalles || "-"}`,
    ].join("\n");

    lastSubmit.current = now;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setStatus("sent");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" autoComplete="on">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-muted-foreground">
          Nombre
          <input
            name="nombre"
            required
            maxLength={MAX_NOMBRE}
            autoComplete="name"
            placeholder="Tu nombre"
            // Solo letras, espacios, apóstrofe, punto y guion (sin números ni símbolos).
            pattern="[\p{L}\p{M} '’.\-]+"
            title="Solo letras: sin números ni símbolos."
            onInput={(e) => {
              e.currentTarget.value = filterNameInput(e.currentTarget.value, MAX_NOMBRE);
            }}
            className={field}
          />
        </label>
        <label className="grid gap-1.5 text-sm text-muted-foreground">
          Cantidad
          <input name="cantidad" type="number" min={1} max={MAX_CANTIDAD} step={1} defaultValue={1} required inputMode="numeric" className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-muted-foreground">
          ¿Qué necesitás?
          <select name="tipo" className={field} defaultValue={TIPOS[0]}>
            {TIPOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm text-muted-foreground">
          Material
          <select name="material" className={field} defaultValue={MATERIALES[0]}>
            {MATERIALES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-muted-foreground">
        Contanos tu idea (medidas, colores, uso…)
        <textarea
          name="detalles"
          rows={4}
          maxLength={MAX_DETALLES}
          placeholder="Podés adjuntar el archivo STL por WhatsApp después."
          onChange={(e) => setDetallesLen(e.currentTarget.value.length)}
          className={field}
        />
        <span className="text-right text-xs text-muted-foreground/80">
          {detallesLen}/{MAX_DETALLES}
        </span>
      </label>

      {/* Campo trampa anti-bots: oculto para personas y lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No completar
          <input name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={!WHATSAPP_NUMBER}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white shadow-[0_0_30px_-6px] shadow-primary transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle className="size-5" />
        Enviar por WhatsApp
      </button>
      {!WHATSAPP_NUMBER && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-center text-xs text-amber-200">
          Falta configurar el número de WhatsApp (NEXT_PUBLIC_WHATSAPP_NUMBER).
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground" role="status">
        {status === "sent" && "¡Listo! Se abrió WhatsApp con tu consulta."}
        {status === "name" && "Escribí tu nombre usando solo letras."}
        {status === "wait" && "Ya enviaste una consulta hace un momento. Esperá unos segundos para enviar otra."}
        {status === "idle" && "Sin compromiso. Te respondemos por WhatsApp."}
      </p>
    </form>
  );
}
