// Variables de entorno públicas, validadas.
// NEXT_PUBLIC_* queda incluida en el código que baja al navegador: no pongas secretos acá.
// El número de WhatsApp es un dato público (cualquiera lo ve en el enlace), no una clave.

const rawNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").trim();

// Formato internacional, solo dígitos, entre 8 y 15 (estándar E.164, sin "+").
const isValidNumber = /^\d{8,15}$/.test(rawNumber);

if (rawNumber && !isValidNumber && process.env.NODE_ENV !== "production") {
  console.warn(
    "[config] NEXT_PUBLIC_WHATSAPP_NUMBER no es válido. Usá solo dígitos con código de país, sin + ni espacios (ej. 5493534000000)."
  );
}

/** Número validado, o cadena vacía si falta o es inválido (el formulario se deshabilita). */
export const WHATSAPP_NUMBER = isValidNumber ? rawNumber : "";
