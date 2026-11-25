import { AppError } from '../utils/AppError.js';

// Se usa después de auth: requireRol('administrador', 'empleado') deja pasar solo a esos roles (si no, 403)
export const requireRol = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.usuario?.rol)) {
    return next(new AppError(403, 'No tienes permiso para realizar esta acción.'));
  }
  next();
};
