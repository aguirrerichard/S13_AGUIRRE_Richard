import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

// Routes = mapa de URLs: qué middleware y qué controller atiende cada método + ruta
const router = Router();
router.post('/login', ctrl.login);
router.post('/registro', ctrl.registro);
router.get('/perfil', auth, ctrl.perfil);

export default router;
