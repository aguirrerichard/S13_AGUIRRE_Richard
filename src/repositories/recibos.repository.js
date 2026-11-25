import { pool } from '../config/db.js';

// Recibos = tabla facturacion; cada pago queda además en registro_pagos (titular y tarjeta enmascarada)

export async function listarPorSuministro(suministro) {
  const { rows } = await pool.query(
    `SELECT id, numero_suministro, titular, mes_facturacion, monto, estado
       FROM facturacion
      WHERE numero_suministro = $1
      ORDER BY id DESC`,
    [suministro]
  );
  return rows;
}

// Devuelve false si el recibo ya no estaba pendiente (otro pago llegó primero): así nunca se cobra dos veces
export async function registrarPago(recibo, titularPago, ultimos4, db) {
  const { rowCount } = await db.query(
    "UPDATE facturacion SET estado = 'pagado' WHERE id = $1 AND estado = 'pendiente'",
    [recibo.id]
  );
  if (rowCount === 0) return false;
  await db.query(
    `INSERT INTO registro_pagos (numero_suministro, titular_tarjeta, tarjeta_enmascarada, monto)
     VALUES ($1, $2, $3, $4)`,
    [recibo.numero_suministro, titularPago, `**** **** **** ${ultimos4}`, recibo.monto]
  );
  return true;
}
