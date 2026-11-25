import { conTransaccion } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { esFechaISO, exigir, idValido, texto } from '../utils/validaciones.js';
import { redondear } from '../utils/tarifario.js';
import * as reclamosRepo from '../repositories/reclamos.repository.js';
import * as pagosRepo from '../repositories/pagos.repository.js';
import { codigoOperacion } from './pagos.service.js';
import { PROVEEDORES } from '../utils/proveedores.js';

// Medios aceptados en ventanilla -> cómo se guardan en pagos
const MEDIOS = {
  efectivo: { metodo: 'efectivo' },
  pos: { metodo: 'pos' },
  andipay: { metodo: 'billetera', proveedor_billetera: PROVEEDORES.andipay },
  yipay: { metodo: 'billetera', proveedor_billetera: PROVEEDORES.yipay },
  pagomovil: { metodo: 'billetera', proveedor_billetera: PROVEEDORES.pagomovil },
};

const hoyEnLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

function leerFecha(valor) {
  const fecha = texto(valor) || hoyEnLima();
  exigir(esFechaISO(fecha), 'La fecha debe tener el formato AAAA-MM-DD.');
  return fecha;
}

export const pendientes = (q) => reclamosRepo.buscarPendientesDeCobro(texto(q).slice(0, 60));

export async function cobrar(cajero, body) {
  const id = idValido(body.registroId, 'La solicitud');
  const medio = MEDIOS[texto(body.metodo)];
  exigir(medio, 'El medio de pago no es válido.');
  const esEfectivo = medio.metodo === 'efectivo';
  const referencia = texto(body.referencia);
  if (!esEfectivo) exigir(/^\d{6,12}$/.test(referencia), 'Ingresa el número de voucher u operación (6 a 12 dígitos).');

  return conTransaccion(async (db) => {
    const reclamo = await reclamosRepo.buscarPorIdBloqueando(id, db);
    if (!reclamo) throw new AppError(404, 'Solicitud no encontrada.');
    if (reclamo.estado_pago !== 'pendiente' || !(reclamo.monto_calculado > 0)) {
      throw new AppError(409, 'Esta solicitud ya fue pagada o no requiere pago.');
    }

    let montoRecibido = null;
    let vuelto = null;
    if (esEfectivo) {
      montoRecibido = Number(body.montoRecibido);
      exigir(Number.isFinite(montoRecibido) && montoRecibido >= reclamo.monto_calculado, 'El monto recibido es menor que el total.');
      vuelto = redondear(montoRecibido - reclamo.monto_calculado);
    }

    const pago = await pagosRepo.crear({
      reclamo_id: reclamo.id, codigo_operacion: codigoOperacion('CJ'), canal: 'caja', ...medio,
      referencia: esEfectivo ? null : referencia, monto: reclamo.monto_calculado,
      monto_recibido: montoRecibido, vuelto, estado: 'aprobado', cajero_id: cajero.id,
    }, db);
    await reclamosRepo.marcarPagado(reclamo.id, 'caja', db);
    return { codigo: pago.codigo_operacion, vuelto: vuelto ?? 0 };
  });
}

export const pagosEnLinea = (query) =>
  pagosRepo.listarPasarelaPorFecha(leerFecha(query.fecha), texto(query.soloPorVerificar) === 'true');

export const resumen = (query) => pagosRepo.resumenPorFecha(leerFecha(query.fecha));

export async function verificar(usuario, idParam) {
  const id = idValido(idParam);
  const pago = await pagosRepo.buscarPorId(id);
  if (!pago || pago.canal !== 'pasarela') throw new AppError(404, 'Pago no encontrado.');
  if (pago.estado !== 'aprobado') throw new AppError(409, 'Solo se verifican pagos aprobados.');
  if (pago.verificado) throw new AppError(409, 'Este pago ya fue verificado.');
  await pagosRepo.marcarVerificado(id, usuario.id);
  return { mensaje: 'Pago verificado.' };
}
