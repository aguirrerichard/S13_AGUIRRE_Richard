import { pool } from '../config/db.js';

// Repository = única capa que escribe SQL. Los datos del usuario SIEMPRE viajan como parámetros ($1, $2...), nunca concatenados.
// La tabla usuarios heredada tiene columnas duplicadas (correo / correo_electronico, contrasena / "contraseña"): se leen con COALESCE.

const CORREO = 'COALESCE(correo, correo_electronico)';
const CLAVE = 'COALESCE(contrasena, "contraseña")';

export async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT id, nombre, ${CORREO} AS correo, ${CLAVE} AS contrasena, rol, turno
       FROM usuarios WHERE LOWER(${CORREO}) = $1`,
    [correo]
  );
  return rows[0];
}

export async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, ${CORREO} AS correo, rol, turno FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function crear({ nombre, correo, hash, rol }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, contrasena, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, correo, rol, turno`,
    [nombre, correo, hash, rol]
  );
  return rows[0];
}
