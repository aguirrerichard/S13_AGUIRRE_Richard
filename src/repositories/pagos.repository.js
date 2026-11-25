import { pool } from '../config/db.js';

// Tabla pagos: id_registro = reclamo pagado, id_usuario = cliente que pagó en línea, id_cajero = quien cobró en ventanilla
export async function crear(p, db) {
  const { rows } = await db.query(
    `INSERT INTO pagos
       (id_registro, id_usuario, codigo_operacion, canal, metodo, marca_tarjeta, proveedor_billetera, referencia,
        monto, monto_recibido, vuelto, estado, motivo_rechazo, id_cajero)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id, codigo_operacion`,
    [p.reclamo_id, p.usuario_id ?? null, p.codigo_operacion, p.canal, p.metodo, p.marca_tarjeta ?? null,
     p.proveedor_billetera ?? null, p.referencia ?? null, p.monto, p.monto_recibido ?? null, p.vuelto ?? null,
     p.estado, p.motivo_rechazo ?? null, p.cajero_id ?? null]
  );
  return rows[0];
}

export async function contarPorReclamo(reclamoId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM pagos WHERE id_registro = $1', [reclamoId]);
  return rows[0].total;
}

export async function buscarPorCodigoConReclamo(codigo) {
  const { rows } = await pool.query(
    `SELECT p.id, p.codigo_operacion, p.canal, p.metodo, p.marca_tarjeta, p.proveedor_billetera, p.referencia,
            p.monto, p.monto_recibido, p.vuelto, p.fecha_pago,
            r.codigo_seguimiento, r.nombre_cliente AS cliente, r.tipo_medidor, r.km_fuera_zona, r.id_usuario AS usuario_id,
            c.nombre AS cajero
       FROM pagos p
       JOIN reclamos_luz r ON r.id = p.id_registro
       LEFT JOIN usuarios c ON c.id = p.id_cajero
      WHERE p.codigo_operacion = $1 AND p.estado = 'aprobado'`,
    [codigo]
  );
  return rows[0];
}

// Pagos hechos por la pasarela en una fecha (hora de Lima)
export async function listarPasarelaPorFecha(fecha, soloPorVerificar) {
  const { rows } = await pool.query(
    `SELECT p.id, p.fecha_pago, p.codigo_operacion, p.metodo, p.marca_tarjeta, p.proveedor_billetera,
            p.referencia, p.monto, p.estado, p.motivo_rechazo, p.verificado,
            v.nombre AS verificador, r.codigo_seguimiento, r.nombre_cliente AS cliente
       FROM pagos p
       JOIN reclamos_luz r ON r.id = p.id_registro
       LEFT JOIN usuarios v ON v.id = p.verificado_por
      WHERE p.canal = 'pasarela'
        AND (p.fecha_pago AT TIME ZONE 'America/Lima')::date = $1::date
        AND ($2::boolean = false OR (p.estado = 'aprobado' AND p.verificado = false))
      ORDER BY p.id DESC`,
    [fecha, soloPorVerificar]
  );
  return rows;
}

export async function resumenPorFecha(fecha) {
  const { rows } = await pool.query(
    `SELECT canal, metodo, COUNT(*)::int AS operaciones, SUM(monto) AS total
       FROM pagos
      WHERE estado = 'aprobado'
        AND (fecha_pago AT TIME ZONE 'America/Lima')::date = $1::date
      GROUP BY canal, metodo
      ORDER BY canal, metodo`,
    [fecha]
  );
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await pool.query('SELECT id, canal, estado, verificado FROM pagos WHERE id = $1', [id]);
  return rows[0];
}

export async function marcarVerificado(id, usuarioId) {
  await pool.query('UPDATE pagos SET verificado = true, verificado_por = $2, fecha_verificacion = now() WHERE id = $1', [id, usuarioId]);
}
