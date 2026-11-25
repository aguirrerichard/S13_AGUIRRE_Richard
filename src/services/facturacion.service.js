import { AppError } from '../utils/AppError.js';
import { esSuministro, exigir, texto } from '../utils/validaciones.js';
import { conTransaccion } from '../config/db.js';
import * as recibosRepo from '../repositories/recibos.repository.js';

export async function consultar(suministro) {
  const numero = texto(suministro);
  exigir(esSuministro(numero), 'El N° de suministro debe tener entre 6 y 10 dígitos.');
  const recibos = await recibosRepo.listarPorSuministro(numero);
  if (recibos.length === 0) throw new AppError(404, 'El suministro no existe en nuestros registros.');
  return recibos;
}

// El monto sale de la base de datos: el navegador solo manda el titular y los últimos 4 dígitos de la tarjeta
export async function pagar(suministro, body) {
  const recibos = await consultar(suministro);
  const titular = texto(body.titular);
  exigir(/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{5,60}$/.test(titular), 'Escribe el nombre como figura en la tarjeta.');
  const ultimos4 = texto(body.ultimos4);
  exigir(/^\d{4}$/.test(ultimos4), 'Los últimos 4 dígitos de la tarjeta no son válidos.');

  const pendiente = recibos.find((r) => r.estado === 'pendiente'); // los recibos vienen del más reciente al más antiguo
  if (!pendiente) throw new AppError(409, 'El suministro no tiene recibos pendientes.');

  const registrado = await conTransaccion((db) => recibosRepo.registrarPago(pendiente, titular, ultimos4, db));
  if (!registrado) throw new AppError(409, 'Este recibo ya fue pagado.');
  return { mensaje: 'Pago registrado.', monto: pendiente.monto, mes_facturacion: pendiente.mes_facturacion };
}
