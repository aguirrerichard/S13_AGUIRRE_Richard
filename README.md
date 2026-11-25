# LuzCentro Perú · Backend (Node + Express + PostgreSQL en Neon)

API por capas que consume el frontend `luzcentro-frontend` (contrato en su README).

## Cómo ejecutarlo

```bash
npm install
# .env ya tiene DATABASE_URL (Neon), DB_SSL=true y JWT_SECRET
npm run db:init             # aplica database/schema.sql sobre TUS tablas de Neon (seguro repetirlo)
npm run dev                 # http://localhost:3000/api/salud
```

## Base de datos (tus tablas de Neon)

La API usa directamente tus tablas: `usuarios`, `reclamos_luz`, `pagos`, `facturacion`, `registro_pagos`, `mensajes_contacto`,
`banco_cuentas`, `banco_tarjetas` y `billeteras`. `db:init` **no borra datos**; solo agrega lo que faltaba:

- `reclamos_luz`: columnas `respuesta`, `atendido_por`, `canal_registro`; el estado `Servir` pasa a `atendido` y el medidor se guarda sin tilde (`monofasico`/`trifasico`).
- Secuencia `seq_codigo_reclamo` (códigos `REC-AAAA-00001`) e índices únicos (correo, código de seguimiento, un solo pago aprobado por solicitud).
- Tablas nuevas `lc_servicios` y `lc_clientes` (el catálogo y los clientes del módulo de gestión no existían en tu base).

Contraseñas: los usuarios actuales siguen con clave en texto plano y pueden entrar igual; los que se registran por la API se guardan con bcrypt.
Para convertir todas a bcrypt (si ninguna otra app tuya las lee en texto plano): `node database/init.js --hash-passwords`.

Usuarios de tu base: `admin@luzcentro.pe` (administrador123), `empleado@luzcentro.pe` (turno mañana) y `empleado1@luzcentro.pe` (tarde) con `emp123`, `caja@correo.com` / `1234` (cajera), `cliente1@luz.com` … `cliente10@luz.com` con `123456`.

### Pasarela simulada con tus tablas bancarias
El pago en línea valida contra `banco_tarjetas` / `banco_cuentas` (tarjeta existente y activa, vencimiento y CVV exactos, saldo suficiente) y `billeteras` (celular + código de aprobación + saldo). Si aprueba, **descuenta el saldo** en la misma transacción; si rechaza, guarda el pago como `rechazado` con su motivo.
Pruebas: `4111 1111 1111 1111 · 12/2029 · CVV 123` aprueba (saldo S/ 1015); `4000 0000 0000 0002 · 08/2028 · 456` → fondos insuficientes; `5105 1051 0510 5100 · 03/2027 · 321` → bloqueada; billetera `yipay` (en el frontend `andipay`) `987654321` código `123456` aprueba; `pagomóvil 912345678` código `654321` → saldo insuficiente.
Para volver a dejar los saldos como al inicio, vuelve a ejecutar la sección de `banco_cuentas` / `billeteras` de tu SQL.

## Capas (carpeta → qué hace)

| Carpeta | Responsabilidad |
|---|---|
| `routes/` | URL + método → middlewares y controller |
| `controllers/` | Capa HTTP: lee `req`, llama al service, responde código + JSON |
| `services/` | Reglas de negocio y validaciones (monto, estados, pagos, roles de dato) |
| `repositories/` | Único lugar con SQL, siempre con parámetros `$1, $2` (incluye `banco.repository` de la pasarela) |
| `middlewares/` | `auth` (JWT → 401), `requireRol` (403), `requireTurno`, `errorHandler` |
| `config/` | `db.js`: pool de `pg` con `DATABASE_URL` y transacciones |
| `utils/` | `AppError`, validaciones, tarifario, turnos |

Recorrido de una petición: `POST /api/auth/login` → `auth.routes` → `auth.controller.login` → `auth.service.login` (valida, compara bcrypt, firma JWT) → `usuarios.repository.buscarPorCorreo` (`SELECT ... WHERE LOWER(correo) = $1`) → Neon → `{ token, usuario }`.
Otro: `GET /api/servicios` → `servicios.routes` → `servicios.controller.listar` → `servicios.service.listar` → `servicios.repository.listarActivos` → JSON.

## Endpoints

Contrato completo del frontend (auth, reclamos, pagos, caja, facturación, contacto) más:
`GET /servicios`, `GET /servicios/:id` (público, 404) · `POST/PUT/DELETE /servicios` (administrador/empleado) · `GET/POST /clientes`, `GET /clientes/:id` (administrador/empleado, 400 si faltan datos o el correo es inválido).
Errores siempre `{ "mensaje": "..." }`: 400 datos inválidos · 401 sin token/clave mala · 403 rol sin permiso · 404 · 409 conflicto.

## Rúbrica S13 → dónde se cumple

- **Arquitectura por capas**: las 7 carpetas de arriba, sin lógica mezclada en `server.js`.
- **Ruta de punta a punta**: login y `GET /servicios`, descritos arriba.
- **Neon**: `config/db.js` (DATABASE_URL), `database/schema.sql` (ajustes sobre tus tablas), SQL con `$n` en `repositories/`; ninguna consulta concatena texto del usuario.
- **GitHub**: `.gitignore` (excluye `.env` y `node_modules`) y `.env.example` sin valores reales.

## Publicación (S14)

Render (plan Free): Build `npm install`, Start `npm start`, Health check `/api/salud`. Variables: `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `CORS_ORIGIN=https://tu-app.vercel.app`.
