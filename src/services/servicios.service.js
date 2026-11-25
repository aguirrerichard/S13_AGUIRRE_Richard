import { AppError } from '../utils/AppError.js';
import { exigir, idValido, texto } from '../utils/validaciones.js';
import * as serviciosRepo from '../repositories/servicios.repository.js';

function leerDatos(body) {
  const nombre = texto(body.nombre);
  exigir(nombre.length >= 3 && nombre.length <= 80, 'El nombre del servicio debe tener entre 3 y 80 caracteres.');
  const descripcion = texto(body.descripcion) || null;
  exigir(!descripcion || descripcion.length <= 300, 'La descripción no puede superar 300 caracteres.');
  const precio = Number(body.precio);
  exigir(body.precio !== '' && body.precio !== null && Number.isFinite(precio) && precio >= 0 && precio <= 99999, 'El precio debe ser un número entre 0 y 99999.');
  return { nombre, descripcion, precio };
}

export const listar = () => serviciosRepo.listarActivos();

export async function obtener(idParam) {
  const servicio = await serviciosRepo.buscarPorId(idValido(idParam));
  if (!servicio) throw new AppError(404, 'Servicio no encontrado.');
  return servicio;
}

export const crear = (body) => serviciosRepo.crear(leerDatos(body));

export async function actualizar(idParam, body) {
  const id = idValido(idParam);
  const servicio = await serviciosRepo.actualizar(id, leerDatos(body));
  if (!servicio) throw new AppError(404, 'Servicio no encontrado.');
  return servicio;
}

export async function eliminar(idParam) {
  if (!(await serviciosRepo.eliminar(idValido(idParam)))) throw new AppError(404, 'Servicio no encontrado.');
  return { mensaje: 'Servicio eliminado.' };
}
