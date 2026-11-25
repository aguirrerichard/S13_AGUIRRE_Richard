import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/servicios.service.js';

export const listar = asyncHandler(async (req, res) => res.json(await service.listar()));
export const obtener = asyncHandler(async (req, res) => res.json(await service.obtener(req.params.id)));
export const crear = asyncHandler(async (req, res) => res.status(201).json(await service.crear(req.body ?? {})));
export const actualizar = asyncHandler(async (req, res) => res.json(await service.actualizar(req.params.id, req.body ?? {})));
export const eliminar = asyncHandler(async (req, res) => res.json(await service.eliminar(req.params.id)));
