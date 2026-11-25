import { Router } from 'express';
import * as ctrl from '../controllers/caja.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';

const router = Router();
router.use(auth, requireRol('cajero', 'administrador')); // todo el módulo de caja exige token y uno de estos roles

router.get('/pendientes', ctrl.pendientes);
router.post('/cobros', ctrl.cobrar);
router.get('/pagos-en-linea', ctrl.pagosEnLinea);
router.put('/pagos/:id/verificar', ctrl.verificar);
router.get('/resumen', ctrl.resumen);

export default router;
