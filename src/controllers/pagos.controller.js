import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/pagos.service.js';

export const pendientes = asyncHandler(async (req, res) => res.json(await service.listarPendientes(req.usuario.id)));
export const registro = asyncHandler(async (req, res) => res.json(await service.obtenerRegistro(req.usuario, req.params.id)));
export const tarjeta = asyncHandler(async (req, res) => res.json(await service.pagarConTarjeta(req.usuario, req.body ?? {})));
export const billetera = asyncHandler(async (req, res) => res.json(await service.pagarConBilletera(req.usuario, req.body ?? {})));
export const comprobante = asyncHandler(async (req, res) => res.json(await service.obtenerComprobante(req.usuario, req.params.codigo)));
