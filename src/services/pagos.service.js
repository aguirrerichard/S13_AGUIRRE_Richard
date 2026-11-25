import { randomInt } from 'node:crypto';
import { conTransaccion } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import {
  detectarMarca, esCelular, exigir, idValido, longitudValida, soloDigitos,
  tarjetaVigente, texto, validarCVV, validarLuhn,
} from '../utils/validaciones.js';
import * as reclamosRepo from '../repositories/reclamos.repository.js';
import * as pagosRepo from '../repositories/pagos.repository.js';
import { evaluarBilletera, evaluarTarjeta } from './pasarela.service.js';
import { PROVEEDORES } from '../utils/proveedores.js';

export const codigoOperacion = (prefijo) => `${prefijo}-${Date.now().toString().slice(-8)}${randomInt(100, 1000)}`;

/* ---------- Consultas del cliente ---------- */

export const listarPendientes = (usuarioId) => reclamosRepo.listarPendientesDeUsuario(usuarioId);

export async function obtenerRegistro(usuario, idParam) {
  const id = idValido(idParam);
  const r = await reclamosRepo.buscarPorId(id);
  if (!r || r.usuario_id !== usuario.id) throw new AppError(404, 'Solicitud no encontrada.');
  return { id: r.id, codigo_seguimiento: r.codigo_seguimiento, monto_calculado: r.monto_calculado, estado_pago: r.estado_pago };
}

export async function obtenerComprobante(usuario, codigo) {
  const pago = await pagosRepo.buscarPorCodigoConReclamo(texto(codigo));
  const esPersonal = ['administrador', 'empleado', 'cajero'].includes(usuario.rol);
  // Un cliente solo ve SUS comprobantes: si es de otro, se responde 404 (no se revela que existe)
  if (!pago || (!esPersonal && pago.usuario_id !== usuario.id)) throw new AppError(404, 'Comprobante no encontrado.');
  const { usuario_id, ...datos } = pago;
  return datos;
}

/* ---------- Pago en línea ---------- */

// Un pago rechazado por la entidad NO es un error HTTP: se guarda y se responde { aprobado: false, motivo }
async function cobrarEnLinea(usuario, registroId, datosMedio, evaluar) {
  const id = idValido(registroId, 'La solicitud');
  return conTransaccion(async (db) => {
    const reclamo = await reclamosRepo.buscarPorIdBloqueando(id, db);
    if (!reclamo || reclamo.usuario_id !== usuario.id) throw new AppError(404, 'Solicitud no encontrada.');
    if (reclamo.estado_pago !== 'pendiente' || !(reclamo.monto_calculado > 0)) {
      throw new AppError(409, 'Esta solicitud no tiene un pago pendiente.');
    }

    // La entidad valida y, si aprueba, descuenta el saldo dentro de esta misma transacción
    const resultado = await evaluar(db, reclamo.monto_calculado);
    const pago = await pagosRepo.crear({
      reclamo_id: reclamo.id, usuario_id: usuario.id, codigo_operacion: codigoOperacion('OP'), canal: 'pasarela',
      ...datosMedio, ...(resultado.metodo ? { metodo: resultado.metodo } : {}), monto: reclamo.monto_calculado,
      estado: resultado.aprobado ? 'aprobado' : 'rechazado', motivo_rechazo: resultado.motivo ?? null,
    }, db);

    if (resultado.aprobado) await reclamosRepo.marcarPagado(reclamo.id, 'pasarela', db);
    return { aprobado: resultado.aprobado, codigo: resultado.aprobado ? pago.codigo_operacion : null, motivo: resultado.motivo ?? null };
  });
}

export async function pagarConTarjeta(usuario, body) {
  const numero = soloDigitos(body.numero);
  const marca = detectarMarca(numero); // la marca se deduce del número: no se confía en la que envía el navegador
  exigir(marca, 'Marca de tarjeta no reconocida.');
  exigir(longitudValida(numero, marca) && validarLuhn(numero), 'El número de tarjeta no es válido.');
  exigir(tarjetaVigente(body.mes, body.anio), 'La tarjeta está vencida o la fecha no es válida.');
  exigir(validarCVV(body.cvv, marca), 'El CVV no es válido.');

  return cobrarEnLinea(
    usuario, body.registroId,
    // Jamás se guarda el número completo ni el CVV: solo los últimos 4 dígitos
    { metodo: 'tarjeta_credito', marca_tarjeta: marca, referencia: `**** ${numero.slice(-4)}` },
    (db, monto) => evaluarTarjeta(db, { numero, mes: body.mes, anio: body.anio, cvv: body.cvv }, monto)
  );
}

export async function pagarConBilletera(usuario, body) {
  const proveedor = texto(body.proveedor);
  const proveedorDb = PROVEEDORES[proveedor];
  exigir(proveedorDb, 'El proveedor de billetera no es válido.');
  const celular = soloDigitos(body.celular);
  exigir(esCelular(celular), 'El celular debe tener 9 dígitos y empezar con 9.');
  const codigo = texto(body.codigoAprobacion);
  exigir(/^\d{6}$/.test(codigo), 'El código de aprobación tiene 6 dígitos.');

  return cobrarEnLinea(
    usuario, body.registroId,
    { metodo: 'billetera', proveedor_billetera: proveedorDb, referencia: `*** *** ${celular.slice(-3)}` },
    (db, monto) => evaluarBilletera(db, { proveedor: proveedorDb, celular, codigo }, monto)
  );
}
