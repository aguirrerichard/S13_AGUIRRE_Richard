import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

// Controller = capa HTTP: lee req, llama al service y arma la respuesta (código + JSON). No tiene reglas de negocio.

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body ?? {}));
});

export const registro = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.registrar(req.body ?? {}));
});

export const perfil = asyncHandler(async (req, res) => {
  res.json(await authService.perfil(req.usuario.id));
});
