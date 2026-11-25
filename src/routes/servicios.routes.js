import { Router } from 'express';
import * as ctrl from '../controllers/servicios.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';

const router = Router();
const personal = requireRol('administrador', 'empleado');

// Lectura pública; gestión (POST, PUT, DELETE) solo con token de administrador o empleado
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', auth, personal, ctrl.crear);
router.put('/:id', auth, personal, ctrl.actualizar);
router.delete('/:id', auth, personal, ctrl.eliminar);

export default router;
