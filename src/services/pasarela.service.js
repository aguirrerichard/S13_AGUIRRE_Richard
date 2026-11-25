import * as bancoRepo from '../repositories/banco.repository.js';

// Entidad financiera simulada con TUS tablas de Neon: banco_tarjetas / banco_cuentas (tarjetas) y billeteras (Yipay, Pagomóvil).
// Se valida como lo haría un banco: la tarjeta existe, está activa, vencimiento y CVV coinciden y hay saldo.
// Si todo está bien, el monto se descuenta en la MISMA transacción del pago (db) y queda registrado en pagos.
// Datos de prueba (los de tu SQL): 4111 1111 1111 1111 · 12/2029 · CVV 123 → aprobada (saldo S/ 1015)
//   4000 0000 0000 0002 · 08/2028 · 456 → "Fondos insuficientes" · 5105 1051 0510 5100 → "Tarjeta bloqueada"
//   Billetera yipay 987654321 · código 123456 → aprobada · pagomóvil 912345678 · 654321 → saldo insuficiente (S/ 15)

const rechazo = (motivo, extra = {}) => ({ aprobado: false, motivo, ...extra });

export async function evaluarTarjeta(db, { numero, mes, anio, cvv }, monto) {
  const tarjeta = await bancoRepo.buscarTarjeta(numero, db);
  if (!tarjeta) return rechazo('Tarjeta no reconocida por la entidad emisora.');

  const metodo = tarjeta.tipo === 'credito' ? 'tarjeta_credito' : 'tarjeta_debito';
  if (tarjeta.estado !== 'activa') return rechazo('Tarjeta bloqueada por la entidad emisora.', { metodo });
  if (Number(mes) !== tarjeta.mes_venc || Number(anio) !== tarjeta.anio_venc) return rechazo('Fecha de vencimiento inválida.', { metodo });
  if (String(cvv) !== tarjeta.cvv) return rechazo('CVV incorrecto.', { metodo });

  const cuenta = await bancoRepo.cuentaBloqueando(tarjeta.id_cuenta, db);
  if (!cuenta || cuenta.saldo_disponible < monto) return rechazo('Fondos insuficientes.', { metodo });

  await bancoRepo.descontarCuenta(cuenta.id, monto, db);
  return { aprobado: true, metodo };
}

export async function evaluarBilletera(db, { proveedor, celular, codigo }, monto) {
  const billetera = await bancoRepo.billeteraBloqueando(proveedor, celular, db);
  if (!billetera) return rechazo('No existe una billetera registrada con ese celular.');
  if (billetera.codigo_aprobacion !== codigo) return rechazo('Código de aprobación inválido o vencido.');
  if (billetera.saldo_disponible < monto) return rechazo('Saldo insuficiente en la billetera.');

  await bancoRepo.descontarBilletera(billetera.id, monto, db);
  return { aprobado: true };
}
