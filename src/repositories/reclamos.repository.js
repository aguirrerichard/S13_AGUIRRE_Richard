import { pool } from '../config/db.js';

// "db" es el pool normal o un client dentro de una transacción (los dos tienen .query)

// La tabla reclamos_luz conserva sus nombres originales; aquí se exponen con los nombres del contrato de la API
const columnas = (a = '') => `
  ${a}id, ${a}id_usuario AS usuario_id, ${a}codigo_seguimiento, ${a}dni, ${a}nombre_cliente, ${a}numero_suministro,
  ${a}motivo, ${a}direccion, ${a}mes_reclamo, ${a}monto_reclamo AS monto_reclamado, ${a}comentario, ${a}respuesta,
  ${a}tipo_medidor, ${a}km_fuera_zona, ${a}monto_calculado, ${a}estado, ${a}estado_pago, ${a}canal_pago,
  ${a}canal_registro, ${a}atendido_por, ${a}fecha_registro AS created_at`;

export async function siguienteCodigo(db = pool) {
  const { rows } = await db.query("SELECT nextval('seq_codigo_reclamo') AS n");
  return Number(rows[0].n);
}

export async function crear(d, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO reclamos_luz
       (id_usuario, codigo_seguimiento, dni, nombre_cliente, numero_suministro, motivo, direccion,
        mes_reclamo, monto_reclamo, comentario, tipo_medidor, km_fuera_zona, monto_calculado,
        estado, estado_pago, canal_registro)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'registrado',$14,$15)
     RETURNING id, codigo_seguimiento AS codigo, monto_calculado, estado_pago`,
    [d.usuario_id, d.codigo, d.dni, d.nombre, d.suministro, d.motivo, d.direccion,
     d.mes, d.montoReclamado, d.comentario, d.tipo_medidor, d.km_fuera_zona, d.monto_calculado,
     d.estado_pago, d.canal_registro]
  );
  return rows[0];
}

export async function buscarPorId(id, db = pool) {
  const { rows } = await db.query(`SELECT ${columnas()} FROM reclamos_luz WHERE id = $1`, [id]);
  return rows[0];
}

// Bloquea la fila hasta terminar la transacción: evita que dos pagos simultáneos cobren dos veces
export async function buscarPorIdBloqueando(id, db) {
  const { rows } = await db.query(`SELECT ${columnas()} FROM reclamos_luz WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0];
}

export async function listarTodos() {
  const { rows } = await pool.query(`SELECT ${columnas()} FROM reclamos_luz ORDER BY fecha_registro DESC, id DESC`);
  return rows;
}

// Reclamos del cliente + código de su pago aprobado (para el botón "Ver comprobante")
export async function listarDeUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT ${columnas('r.')}, p.codigo_operacion
       FROM reclamos_luz r
       LEFT JOIN LATERAL (
         SELECT codigo_operacion FROM pagos
          WHERE id_registro = r.id AND estado = 'aprobado'
          ORDER BY id DESC LIMIT 1
       ) p ON true
      WHERE r.id_usuario = $1
      ORDER BY r.fecha_registro DESC, r.id DESC`,
    [usuarioId]
  );
  return rows;
}

export async function buscarSeguimiento(valor) {
  const { rows } = await pool.query(
    `SELECT codigo_seguimiento, estado, motivo, nombre_cliente
       FROM reclamos_luz
      WHERE UPPER(codigo_seguimiento) = UPPER($1) OR dni = $1
      ORDER BY fecha_registro DESC LIMIT 1`,
    [valor]
  );
  return rows[0];
}

export async function actualizarDatosCliente(id, { comentario, tipo_medidor, km_fuera_zona, monto_calculado }) {
  await pool.query(
    `UPDATE reclamos_luz
        SET comentario = $2, tipo_medidor = $3, km_fuera_zona = $4, monto_calculado = $5
      WHERE id = $1`,
    [id, comentario, tipo_medidor, km_fuera_zona, monto_calculado]
  );
}

export async function actualizarDictamen(id, estado, respuesta, atendidoPor) {
  await pool.query(
    'UPDATE reclamos_luz SET estado = $2, respuesta = $3, atendido_por = $4 WHERE id = $1',
    [id, estado, respuesta, atendidoPor]
  );
}

export async function eliminar(id) {
  await pool.query('DELETE FROM reclamos_luz WHERE id = $1', [id]);
}

export async function marcarPagado(id, canal, db) {
  await db.query("UPDATE reclamos_luz SET estado_pago = 'pagado', canal_pago = $2, fecha_pago = now() WHERE id = $1", [id, canal]);
}

// Solicitudes del cliente que aún deben pagarse
export async function listarPendientesDeUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT id, codigo_seguimiento, monto_calculado
       FROM reclamos_luz
      WHERE id_usuario = $1 AND estado_pago = 'pendiente' AND monto_calculado > 0 AND estado <> 'rechazado'
      ORDER BY fecha_registro DESC, id DESC`,
    [usuarioId]
  );
  return rows;
}

// Solicitudes por cobrar en ventanilla; el criterio busca por código, DNI, nombre o suministro
export async function buscarPendientesDeCobro(criterio) {
  const patron = `%${criterio.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await pool.query(
    `SELECT id, codigo_seguimiento, nombre_cliente AS cliente, dni, numero_suministro, monto_calculado
       FROM reclamos_luz
      WHERE estado_pago = 'pendiente' AND monto_calculado > 0 AND estado <> 'rechazado'
        AND ($1 = '' OR codigo_seguimiento ILIKE $2 OR dni ILIKE $2
             OR nombre_cliente ILIKE $2 OR numero_suministro ILIKE $2)
      ORDER BY fecha_registro DESC, id DESC
      LIMIT 50`,
    [criterio, patron]
  );
  return rows;
}
