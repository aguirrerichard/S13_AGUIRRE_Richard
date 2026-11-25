import * as usuariosRepo from '../repositories/usuarios.repository.js';
import { AppError } from '../utils/AppError.js';
import { normalizarTurno, turnoActual } from '../utils/turnos.js';

// Regla del parcial: un empleado solo edita dentro de su turno. El administrador no tiene turno.
export async function requireTurno(req, res, next) {
  try {
    if (process.env.VALIDAR_TURNO === 'false' || req.usuario.rol !== 'empleado') return next();
    const usuario = await usuariosRepo.buscarPorId(req.usuario.id);
    const asignado = normalizarTurno(usuario?.turno);
    if (asignado !== turnoActual()) {
      throw new AppError(403, `Acceso restringido por turno: tu turno es ${asignado} y el sistema está en turno ${turnoActual()}.`);
    }
    next();
  } catch (err) {
    next(err);
  }
}
