import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

// Exige "Authorization: Bearer <token>". Si es válido deja el usuario en req.usuario.
export function auth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Falta el token de autenticación.'));
  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: datos.id, rol: datos.rol, nombre: datos.nombre };
    next();
  } catch {
    next(new AppError(401, 'El token no es válido o ya venció. Inicia sesión de nuevo.'));
  }
}
