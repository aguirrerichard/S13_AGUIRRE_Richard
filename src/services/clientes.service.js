import { AppError } from '../utils/AppError.js';
import { esCelular, esCorreo, esDni, exigir, idValido, soloDigitos, texto } from '../utils/validaciones.js';
import * as clientesRepo from '../repositories/clientes.repository.js';

export const listar = () => clientesRepo.listar();

export async function obtener(idParam) {
  const cliente = await clientesRepo.buscarPorId(idValido(idParam));
  if (!cliente) throw new AppError(404, 'Cliente no encontrado.');
  return cliente;
}

export async function crear(body) {
  const nombre = texto(body.nombre);
  const dni = texto(body.dni);
  const correo = texto(body.correo).toLowerCase();
  const telefono = soloDigitos(body.telefono) || null;
  exigir(nombre.length >= 3 && nombre.length <= 100, 'El nombre es obligatorio (3 a 100 caracteres).');
  exigir(esDni(dni), 'El DNI debe tener exactamente 8 dígitos.');
  exigir(esCorreo(correo), 'El correo no tiene un formato válido.');
  exigir(!telefono || esCelular(telefono), 'El celular debe tener 9 dígitos y empezar con 9.');

  if (await clientesRepo.buscarPorDniOCorreo(dni, correo)) throw new AppError(409, 'Ya existe un cliente con ese DNI o correo.');
  return clientesRepo.crear({ nombre, dni, correo, telefono });
}
