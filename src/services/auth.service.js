import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import * as usuariosRepo from '../repositories/usuarios.repository.js';
import { AppError } from '../utils/AppError.js';
import { esCorreo, exigir, texto } from '../utils/validaciones.js';
import { normalizarTurno } from '../utils/turnos.js';

// Service = reglas de negocio. No sabe nada de req/res (HTTP) ni escribe SQL.

const HASH_FALSO = bcrypt.hashSync('no-existe', 10); // se compara aunque el correo no exista: así no se filtra qué correos están registrados

// Solo el personal con turno lo muestra (en la base todos los usuarios traen uno por defecto)
const publico = (u) => ({
  id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol,
  turno: ['empleado', 'cajero'].includes(u.rol) ? normalizarTurno(u.turno) : null,
});

const sha = (v) => createHash('sha256').update(v).digest();

// Tus usuarios antiguos tienen la clave en texto plano; los nuevos (registro) se guardan con bcrypt. Se aceptan ambos formatos.
async function claveCoincide(ingresada, guardada) {
  if (!guardada) return bcrypt.compare(ingresada, HASH_FALSO).then(() => false);
  if (/^\$2[aby]\$/.test(guardada)) return bcrypt.compare(ingresada, guardada);
  return timingSafeEqual(sha(ingresada), sha(guardada));
}

const firmar = (u) =>
  jwt.sign({ id: u.id, rol: u.rol, nombre: u.nombre }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRA || '8h' });

export async function login(body) {
  const correo = texto(body.correo).toLowerCase();
  const contrasena = typeof body.contrasena === 'string' ? body.contrasena : '';
  exigir(correo && contrasena, 'El correo y la contraseña son obligatorios.');
  exigir(esCorreo(correo), 'El correo no tiene un formato válido.');

  const usuario = await usuariosRepo.buscarPorCorreo(correo);
  const coincide = await claveCoincide(contrasena, usuario?.contrasena);
  if (!usuario || !coincide) throw new AppError(401, 'Correo o contraseña incorrectos.');

  return { token: firmar(usuario), usuario: publico(usuario) };
}

// El registro público SIEMPRE crea clientes: el rol nunca se toma del cuerpo de la petición
export async function registrar(body) {
  const nombre = texto(body.nombre);
  const correo = texto(body.correo).toLowerCase();
  const contrasena = typeof body.contrasena === 'string' ? body.contrasena.trim() : '';
  exigir(nombre.length >= 3 && nombre.length <= 100, 'Escribe tu nombre completo (mínimo 3 caracteres).');
  exigir(esCorreo(correo), 'El correo no tiene un formato válido.');
  exigir(contrasena.length >= 6 && contrasena.length <= 72, 'La contraseña debe tener entre 6 y 72 caracteres.');

  if (await usuariosRepo.buscarPorCorreo(correo)) throw new AppError(409, 'Ese correo ya está registrado.');

  const hash = await bcrypt.hash(contrasena, 10);
  const usuario = await usuariosRepo.crear({ nombre, correo, hash, rol: 'cliente' });
  return { token: firmar(usuario), usuario: publico(usuario) };
}

export async function perfil(usuarioId) {
  const usuario = await usuariosRepo.buscarPorId(usuarioId);
  if (!usuario) throw new AppError(401, 'La cuenta ya no está disponible.');
  return publico(usuario);
}
