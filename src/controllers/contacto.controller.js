import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/contacto.service.js';

export const enviar = asyncHandler(async (req, res) => res.status(201).json(await service.enviar(req.body ?? {})));
