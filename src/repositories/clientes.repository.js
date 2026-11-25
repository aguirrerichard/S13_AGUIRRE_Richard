import { pool } from '../config/db.js';

export async function listar() {
  const { rows } = await pool.query('SELECT id, nombre, dni, correo, telefono, created_at FROM lc_clientes ORDER BY id DESC');
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await pool.query('SELECT id, nombre, dni, correo, telefono, created_at FROM lc_clientes WHERE id = $1', [id]);
  return rows[0];
}

export async function buscarPorDniOCorreo(dni, correo) {
  const { rows } = await pool.query('SELECT id, dni, correo FROM lc_clientes WHERE dni = $1 OR correo = $2', [dni, correo]);
  return rows[0];
}

export async function crear({ nombre, dni, correo, telefono }) {
  const { rows } = await pool.query(
    `INSERT INTO lc_clientes (nombre, dni, correo, telefono)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, dni, correo, telefono, created_at`,
    [nombre, dni, correo, telefono]
  );
  return rows[0];
}
