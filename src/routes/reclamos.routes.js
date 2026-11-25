import { Router } from 'express';
import * as ctrl from '../controllers/reclamos.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { requireTurno } from '../middlewares/requireTurno.js';

const router = Router();
const personal = requireRol('administrador', 'empleado');
const cliente = requireRol('cliente');

// Las rutas fijas van ANTES de "/:id", si no Express las confundiría con un id
router.post('/cambio-titular', ctrl.crearCambioTitular); // público
router.get('/seguimiento/:valor', auth, ctrl.seguimiento);
router.get('/mis', auth, cliente, ctrl.listarMios);
router.post('/rapido', auth, cliente, ctrl.crearRapido);
router.post('/presencial', auth, personal, ctrl.crearPresencial);

router.get('/', auth, personal, ctrl.listarTodos);
router.post('/', auth, cliente, ctrl.crear);
router.put('/:id/dictamen', auth, personal, requireTurno, ctrl.dictaminar);
router.put('/:id', auth, cliente, ctrl.actualizarMio);
router.delete('/:id', auth, personal, requireTurno, ctrl.eliminar);

export default router;
