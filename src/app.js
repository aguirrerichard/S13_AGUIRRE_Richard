import express from 'express';
import cors from 'cors';
import { errorHandler, noEncontrada } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import reclamosRoutes from './routes/reclamos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import facturacionRoutes from './routes/facturacion.routes.js';
import contactoRoutes from './routes/contacto.routes.js';
import serviciosRoutes from './routes/servicios.routes.js';
import clientesRoutes from './routes/clientes.routes.js';

const app = express();

// CORS: solo el frontend indicado en CORS_ORIGIN puede llamar a la API desde el navegador
const origenes = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenes.length ? { origin: origenes } : undefined));
app.use(express.json());

app.get('/api/salud', (req, res) => res.json({ ok: true, servicio: 'LuzCentro API' }));
app.use('/api/auth', authRoutes);
app.use('/api/reclamos', reclamosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/clientes', clientesRoutes);

app.use(noEncontrada);
app.use(errorHandler);

export default app;
