// Entidad financiera simulada: tablas banco_tarjetas, banco_cuentas y billeteras.
// Todas las funciones reciben "db" (el client de la transacción del pago) y bloquean la fila del saldo con FOR UPDATE.

export async function buscarTarjeta(numero, db) {
  const { rows } = await db.query(
    'SELECT id, id_cuenta, tipo, mes_venc, anio_venc, cvv, estado FROM banco_tarjetas WHERE numero = $1',
    [numero]
  );
  return rows[0];
}

export async function cuentaBloqueando(id, db) {
  const { rows } = await db.query('SELECT id, saldo_disponible FROM banco_cuentas WHERE id = $1 FOR UPDATE', [id]);
  return rows[0];
}

export async function descontarCuenta(id, monto, db) {
  await db.query('UPDATE banco_cuentas SET saldo_disponible = saldo_disponible - $2 WHERE id = $1', [id, monto]);
}

export async function billeteraBloqueando(proveedor, celular, db) {
  const { rows } = await db.query(
    'SELECT id, saldo_disponible, codigo_aprobacion FROM billeteras WHERE proveedor = $1 AND celular = $2 FOR UPDATE',
    [proveedor, celular]
  );
  return rows[0];
}

export async function descontarBilletera(id, monto, db) {
  await db.query('UPDATE billeteras SET saldo_disponible = saldo_disponible - $2 WHERE id = $1', [id, monto]);
}
