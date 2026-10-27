// Limpieza de lo que escribe el usuario antes de armar el mensaje de WhatsApp.
// React ya escapa todo lo que se muestra en pantalla; esto evita caracteres de control,
// textos gigantes y valores que no están en las listas permitidas.

// Caracteres de control (excepto salto de línea y tabulación) y marcas de dirección de texto
// invisibles que se usan para disfrazar enlaces o mensajes.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g;

/** Una sola línea: sin saltos, espacios repetidos colapsados, recortado al largo máximo. */
export function cleanLine(value: unknown, max: number): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Varias líneas: conserva los saltos de línea, pero limita su cantidad y el largo total. */
export function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** Solo acepta valores que están en la lista; si no, usa el valor por defecto. */
export function pickAllowed<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Entero entre min y max; si no es un número válido, devuelve min. */
export function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
