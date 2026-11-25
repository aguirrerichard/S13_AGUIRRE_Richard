import { Router } from 'express';
import * as ctrl from '../controllers/contacto.controller.js';

const router = Router();
router.post('/', ctrl.enviar);

export default router;
