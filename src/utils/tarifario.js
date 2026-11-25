// Regla de negocio de LuzCentro: derecho de prueba de contraste de medidor.
// Funciones puras: el MONTO lo calcula el backend, nunca se acepta el que diga el navegador.

export const MOTIVOS = ['Nuevo Suministro', 'Cambio de Titular', 'Reclamo por Monto Excesivo', 'Otros'];
export const MOTIVO_CON_COBRO = 'Reclamo por Monto Excesivo';
export const TIPOS_MEDIDOR = ['monofasico', 'trifasico'];

export const redondear = (valor) => Math.round(valor * 100) / 100;
export const requiereContraste = (motivo) => motivo === MOTIVO_CON_COBRO;

// Monofásico S/ 35.00 o Trifásico S/ 75.00, más S/ 2.50 por km fuera de la zona urbana
export function calcularMontoServicio({ tipo_medidor, km_fuera_zona }) {
  const base = tipo_medidor === 'trifasico' ? 75 : 35;
  return redondear(base + 2.5 * Math.max(0, Number(km_fuera_zona) || 0));
}

// 0 si el trámite no paga contraste
export const montoSegunMotivo = (motivo, datos) => (requiereContraste(motivo) ? calcularMontoServicio(datos) : 0);
