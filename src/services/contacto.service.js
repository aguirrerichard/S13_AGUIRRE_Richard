import { esCorreo, esSuministro, exigir, texto } from '../utils/validaciones.js';
import * as contactoRepo from '../repositories/contacto.repository.js';

export async function enviar(body) {
  const nombre = texto(body.nombre);
  const correo = texto(body.correo);
  const suministro = texto(body.suministro) || null;
  const mensaje = texto(body.mensaje);
  exigir(nombre.length >= 3 && nombre.length <= 100, 'Escribe tu nombre completo.');
  exigir(esCorreo(correo), 'El correo no tiene un formato válido.');
  exigir(!suministro || esSuministro(suministro), 'El N° de suministro debe tener entre 6 y 10 dígitos.');
  exigir(mensaje.length >= 5 && mensaje.length <= 1000, 'El mensaje debe tener entre 5 y 1000 caracteres.');

  await contactoRepo.crear({ nombre, correo, suministro, mensaje });
  return { mensaje: 'Mensaje recibido. Te responderemos a la brevedad.' };
}
