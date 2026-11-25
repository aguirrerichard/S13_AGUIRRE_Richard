import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/clientes.service.js';

export const listar = asyncHandler(async (req, res) => res.json(await service.listar()));
export const obtener = asyncHandler(async (req, res) => res.json(await service.obtener(req.params.id)));
export const crear = asyncHandler(async (req, res) => res.status(201).json(await service.crear(req.body ?? {})));
