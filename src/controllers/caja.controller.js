import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/caja.service.js';

export const pendientes = asyncHandler(async (req, res) => res.json(await service.pendientes(req.query.q)));
export const cobrar = asyncHandler(async (req, res) => res.status(201).json(await service.cobrar(req.usuario, req.body ?? {})));
export const pagosEnLinea = asyncHandler(async (req, res) => res.json(await service.pagosEnLinea(req.query)));
export const verificar = asyncHandler(async (req, res) => res.json(await service.verificar(req.usuario, req.params.id)));
export const resumen = asyncHandler(async (req, res) => res.json(await service.resumen(req.query)));
