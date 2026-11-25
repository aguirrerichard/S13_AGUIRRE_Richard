import { AppError } from './AppError.js';

export const texto = (v) => (typeof v === 'string' ? v.trim() : '');
export const soloDigitos = (v) => String(v ?? '').replace(/\D/g, '');

export const esCorreo = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(c));
export const esDni = (v) => /^\d{8}$/.test(texto(v));
export const esSuministro = (v) => /^\d{6,10}$/.test(texto(v));
export const esCelular = (v) => /^9\d{8}$/.test(soloDigitos(v));
export const esFechaISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') && !isNaN(new Date(v));

// Lanza 400 si la condición no se cumple
export function exigir(condicion, mensaje) {
  if (!condicion) throw new AppError(400, mensaje);
}

// Convierte un parámetro de la URL en entero positivo o lanza 400
export function idValido(valor, nombre = 'El id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, `${nombre} no es válido.`);
  return n;
}

/* ---------- Tarjetas (mismas reglas que el frontend; el backend NO confía en el navegador) ---------- */

export function validarLuhn(numero) {
  const d = soloDigitos(numero);
  if (d.length < 13 || d.length > 19) return false;
  let suma = 0;
  let duplicar = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (duplicar) { n *= 2; if (n > 9) n -= 9; }
    suma += n;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

export function detectarMarca(numero) {
  const n = soloDigitos(numero);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  return null;
}

const LONGITUDES = { Visa: [13, 16, 19], Mastercard: [16], 'American Express': [15] };
export const longitudValida = (numero, marca) => (LONGITUDES[marca] ?? []).includes(soloDigitos(numero).length);

export const validarCVV = (cvv, marca) => new RegExp(`^\\d{${marca === 'American Express' ? 4 : 3}}$`).test(String(cvv ?? ''));

// La tarjeta vence al terminar el mes indicado
export function tarjetaVigente(mes, anio, hoy = new Date()) {
  const m = Number(mes);
  const a = Number(anio);
  if (!Number.isInteger(m) || !Number.isInteger(a) || m < 1 || m > 12 || a < 2000) return false;
  return new Date(a, m, 1) > hoy;
}
