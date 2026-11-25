import { Router } from 'express';
import * as ctrl from '../controllers/pagos.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';

const router = Router();
const cliente = requireRol('cliente');

router.get('/pendientes', auth, cliente, ctrl.pendientes);
router.get('/registro/:id', auth, cliente, ctrl.registro);
router.post('/tarjeta', auth, cliente, ctrl.tarjeta);
router.post('/billetera', auth, cliente, ctrl.billetera);
router.get('/comprobante/:codigo', auth, ctrl.comprobante); // el service decide si el cliente es el dueño

export default router;
