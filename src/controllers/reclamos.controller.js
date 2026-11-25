import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/reclamos.service.js';

export const seguimiento = asyncHandler(async (req, res) => res.json(await service.seguimiento(req.params.valor)));
export const crear = asyncHandler(async (req, res) => res.status(201).json(await service.crear(req.usuario, req.body ?? {})));
export const crearRapido = asyncHandler(async (req, res) => res.status(201).json(await service.crearRapido(req.usuario, req.body ?? {})));
export const crearCambioTitular = asyncHandler(async (req, res) => res.status(201).json(await service.crearCambioTitular(req.body ?? {})));
export const listarMios = asyncHandler(async (req, res) => res.json(await service.listarMios(req.usuario.id)));
export const actualizarMio = asyncHandler(async (req, res) => res.json(await service.actualizarMio(req.usuario, req.params.id, req.body ?? {})));

export const listarTodos = asyncHandler(async (req, res) => res.json(await service.listarTodos()));
export const crearPresencial = asyncHandler(async (req, res) => res.status(201).json(await service.crearPresencial(req.body ?? {})));
export const dictaminar = asyncHandler(async (req, res) => res.json(await service.dictaminar(req.usuario, req.params.id, req.body ?? {})));
export const eliminar = asyncHandler(async (req, res) => res.json(await service.eliminar(req.params.id)));
