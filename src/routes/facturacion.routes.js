import { Router } from 'express';
import * as ctrl from '../controllers/facturacion.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();
router.get('/:suministro', auth, ctrl.consultar);
router.post('/:suministro/pago', auth, ctrl.pagar);

export default router;
