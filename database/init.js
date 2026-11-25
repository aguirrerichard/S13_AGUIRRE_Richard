// Uso:
//   npm run db:init                      aplica database/schema.sql sobre tu Neon y siembra servicios/cliente de ejemplo
//   npm run db:reset                     borra y recrea SOLO lc_servicios y lc_clientes (tus tablas originales no se tocan)
//   node database/init.js --hash-passwords   convierte a bcrypt las contraseñas que sigan en texto plano (opcional)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const reset = process.argv.includes('--reset');
const hashear = process.argv.includes('--hash-passwords');

try {
  if (reset) await pool.query('DROP TABLE IF EXISTS public.lc_servicios, public.lc_clientes CASCADE');
  await pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

  const servicios = [
    ['Contraste de medidor monofásico', 'Prueba de contraste para medidores monofásicos', 35],
    ['Contraste de medidor trifásico', 'Prueba de contraste para medidores trifásicos', 75],
    ['Kilómetro fuera de zona urbana', 'Recargo por cada km fuera de la zona urbana', 2.5],
    ['Cambio de titular', 'Trámite de cambio de titularidad del suministro', 0],
    ['Nuevo suministro', 'Instalación de un nuevo punto de suministro', 0],
  ];
  for (const [nombre, descripcion, precio] of servicios) {
    await pool.query('INSERT INTO lc_servicios (nombre, descripcion, precio) VALUES ($1,$2,$3) ON CONFLICT (nombre) DO NOTHING', [nombre, descripcion, precio]);
  }
  await pool.query(
    `INSERT INTO lc_clientes (nombre, dni, correo, telefono) VALUES ('Juan Pérez Huamán','45678912','juan@correo.com','987654321')
     ON CONFLICT DO NOTHING`
  );

  if (hashear) {
    // Ojo: si otra aplicación tuya lee la misma tabla y compara la clave en texto plano, dejará de poder iniciar sesión.
    const { rows } = await pool.query("SELECT id, contrasena FROM usuarios WHERE contrasena IS NOT NULL AND contrasena NOT LIKE '$2%'");
    for (const u of rows) {
      await pool.query('UPDATE usuarios SET contrasena = $2 WHERE id = $1', [u.id, await bcrypt.hash(u.contrasena, 10)]);
    }
    console.log(`Contraseñas convertidas a bcrypt: ${rows.length}`);
  }

  console.log('Base lista: columnas, índices y tablas lc_servicios / lc_clientes aplicados sobre tu Neon.');
} catch (err) {
  console.error('No se pudo inicializar la base:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
