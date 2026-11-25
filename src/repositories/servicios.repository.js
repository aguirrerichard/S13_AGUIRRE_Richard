import { pool } from '../config/db.js';

export async function listarActivos() {
  const { rows } = await pool.query(
    'SELECT id, nombre, descripcion, precio FROM lc_servicios WHERE activo ORDER BY id'
  );
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await pool.query('SELECT id, nombre, descripcion, precio, activo FROM lc_servicios WHERE id = $1', [id]);
  return rows[0];
}

export async function crear({ nombre, descripcion, precio }) {
  const { rows } = await pool.query(
    `INSERT INTO lc_servicios (nombre, descripcion, precio)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, descripcion, precio, activo`,
    [nombre, descripcion, precio]
  );
  return rows[0];
}

export async function actualizar(id, { nombre, descripcion, precio }) {
  const { rows } = await pool.query(
    `UPDATE lc_servicios SET nombre = $2, descripcion = $3, precio = $4
      WHERE id = $1
      RETURNING id, nombre, descripcion, precio, activo`,
    [id, nombre, descripcion, precio]
  );
  return rows[0];
}

export async function eliminar(id) {
  const { rowCount } = await pool.query('DELETE FROM lc_servicios WHERE id = $1', [id]);
  return rowCount > 0;
}
