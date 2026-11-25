import 'dotenv/config';
import pg from 'pg';

// NUMERIC llega de PostgreSQL como texto; lo convertimos a número de JavaScript
pg.types.setTypeParser(1700, (v) => Number(v));

// Un único pool de conexiones para toda la API. La cadena viene de DATABASE_URL (.env, nunca en el código).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Ejecuta varias consultas como una sola unidad: o se guardan todas (COMMIT) o ninguna (ROLLBACK).
export async function conTransaccion(trabajo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await trabajo(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
