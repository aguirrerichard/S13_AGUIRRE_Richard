import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/facturacion.service.js';

export const consultar = asyncHandler(async (req, res) => res.json(await service.consultar(req.params.suministro)));
export const pagar = asyncHandler(async (req, res) => res.json(await service.pagar(req.params.suministro, req.body ?? {})));
