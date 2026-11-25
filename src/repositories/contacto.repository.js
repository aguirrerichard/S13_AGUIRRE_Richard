import { pool } from '../config/db.js';

export async function crear({ nombre, correo, suministro, mensaje }) {
  await pool.query(
    'INSERT INTO mensajes_contacto (nombre, correo, suministro, mensaje) VALUES ($1, $2, $3, $4)',
    [nombre, correo, suministro, mensaje]
  );
}
