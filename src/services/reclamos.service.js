import { AppError } from '../utils/AppError.js';
import { esSuministro, exigir, idValido, texto } from '../utils/validaciones.js';
import { MOTIVOS, TIPOS_MEDIDOR, MOTIVO_CON_COBRO, montoSegunMotivo, requiereContraste } from '../utils/tarifario.js';
import * as reclamosRepo from '../repositories/reclamos.repository.js';
import * as pagosRepo from '../repositories/pagos.repository.js';

const ESTADOS_DICTAMEN = ['en_proceso', 'atendido', 'rechazado'];

/* ---------- Helpers de validación ---------- */

const nombreValido = (v) => {
  const n = texto(v);
  exigir(n.length >= 3 && n.length <= 100, 'Escribe el nombre completo (3 a 100 caracteres).');
  return n;
};

const comentarioValido = (v, etiqueta = 'La descripción') => {
  const c = texto(v);
  exigir(c.length >= 5 && c.length <= 1000, `${etiqueta} es obligatoria (5 a 1000 caracteres).`);
  return c;
};

// Tipo de medidor y km solo cuentan cuando el trámite paga contraste
function leerMedidor(body, aplica) {
  if (!aplica) return { tipo_medidor: 'monofasico', km_fuera_zona: 0 };
  const tipo = body.tipo_medidor ?? 'monofasico';
  exigir(TIPOS_MEDIDOR.includes(tipo), 'El tipo de medidor debe ser monofasico o trifasico.');
  const km = body.km_fuera_zona === undefined || body.km_fuera_zona === '' ? 0 : Number(body.km_fuera_zona);
  exigir(Number.isFinite(km) && km >= 0 && km <= 999, 'Los km fuera de la zona urbana deben estar entre 0 y 999.');
  return { tipo_medidor: tipo, km_fuera_zona: km };
}

async function nuevoCodigo() {
  const n = await reclamosRepo.siguienteCodigo();
  return `REC-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}

const estadoPagoInicial = (monto) => (monto > 0 ? 'pendiente' : 'exonerado');

/* ---------- Cliente ---------- */

export async function crear(usuario, body) {
  const motivo = texto(body.motivo);
  exigir(MOTIVOS.includes(motivo), 'El motivo del trámite no es válido.');

  const dni = texto(body.dni);
  exigir(/^\d{8}$/.test(dni) || (motivo === 'Otros' && /^\d{11}$/.test(dni)), 'El DNI debe tener 8 dígitos (RUC de 11 solo en "Otros").');
  const nombre = nombreValido(body.nombre);
  const suministro = texto(body.suministro);
  exigir(esSuministro(suministro), 'El N° de suministro debe tener entre 6 y 10 dígitos.');
  const comentario = comentarioValido(body.comentario);

  const direccion = texto(body.direccion) || null;
  if (motivo === 'Nuevo Suministro') exigir(direccion && direccion.length >= 5, 'La dirección de instalación es obligatoria.');
  exigir(!direccion || direccion.length <= 150, 'La dirección no puede superar 150 caracteres.');

  let mes = null;
  let montoReclamado = null;
  if (requiereContraste(motivo)) {
    mes = texto(body.mes);
    exigir(/^\d{4}-(0[1-9]|1[0-2])$/.test(mes), 'Indica el mes a reclamar (AAAA-MM).');
    montoReclamado = Number(body.montoReclamo);
    exigir(Number.isFinite(montoReclamado) && montoReclamado > 0, 'El monto a reclamar debe ser mayor que 0.');
  }

  const medidor = leerMedidor(body, requiereContraste(motivo));
  const monto = montoSegunMotivo(motivo, medidor); // el monto lo decide el backend

  return reclamosRepo.crear({
    usuario_id: usuario.id, codigo: await nuevoCodigo(), dni, nombre, suministro, motivo, direccion,
    mes, montoReclamado, comentario, ...medidor, monto_calculado: monto,
    estado_pago: estadoPagoInicial(monto), canal_registro: 'web',
  });
}

// Reclamo breve desde el formulario del inicio (sin cobro)
export async function crearRapido(usuario, body) {
  const dni = texto(body.dni);
  exigir(/^\d{8}$/.test(dni), 'El DNI debe tener 8 dígitos.');
  const nombre = nombreValido(body.nombre);
  const suministro = texto(body.suministro);
  exigir(esSuministro(suministro), 'El N° de suministro debe tener entre 6 y 10 dígitos.');
  const comentario = comentarioValido(body.comentario, 'El detalle del reclamo');

  const creado = await reclamosRepo.crear({
    usuario_id: usuario.id, codigo: await nuevoCodigo(), dni, nombre, suministro, motivo: 'Otros', direccion: null,
    mes: null, montoReclamado: null, comentario, tipo_medidor: 'monofasico', km_fuera_zona: 0,
    monto_calculado: 0, estado_pago: 'exonerado', canal_registro: 'web',
  });
  return { codigo: creado.codigo };
}

// Público: no exige cuenta
export async function crearCambioTitular(body) {
  const suministro = texto(body.suministro);
  exigir(esSuministro(suministro), 'El N° de suministro debe tener entre 6 y 10 dígitos, solo números.');
  const nombre = nombreValido(body.nombre);

  const creado = await reclamosRepo.crear({
    usuario_id: null, codigo: await nuevoCodigo(), dni: null, nombre, suministro, motivo: 'Cambio de Titular',
    direccion: null, mes: null, montoReclamado: null, comentario: 'Solicitud de cambio de titular registrada desde la web.',
    tipo_medidor: 'monofasico', km_fuera_zona: 0, monto_calculado: 0, estado_pago: 'exonerado', canal_registro: 'web',
  });
  return { codigo: creado.codigo };
}

export async function seguimiento(valor) {
  const buscado = texto(valor);
  exigir(buscado.length >= 5, 'Escribe un código de seguimiento o un DNI.');
  const reclamo = await reclamosRepo.buscarSeguimiento(buscado);
  if (!reclamo) throw new AppError(404, 'No encontramos ninguna solicitud con ese dato.');
  return reclamo;
}

export const listarMios = (usuarioId) => reclamosRepo.listarDeUsuario(usuarioId);

export async function actualizarMio(usuario, idParam, body) {
  const id = idValido(idParam);
  const reclamo = await reclamosRepo.buscarPorId(id);
  if (!reclamo || reclamo.usuario_id !== usuario.id) throw new AppError(404, 'Solicitud no encontrada.');
  if (reclamo.estado !== 'registrado' || reclamo.estado_pago === 'pagado') {
    throw new AppError(409, 'No se puede actualizar: el trámite ya fue pagado o está en atención.');
  }

  const comentario = comentarioValido(body.comentario, 'La descripción / fundamento');
  const conCobro = requiereContraste(reclamo.motivo);
  const medidor = conCobro ? leerMedidor(body, true) : { tipo_medidor: reclamo.tipo_medidor, km_fuera_zona: reclamo.km_fuera_zona };
  const monto = conCobro ? montoSegunMotivo(reclamo.motivo, medidor) : reclamo.monto_calculado;

  await reclamosRepo.actualizarDatosCliente(id, { comentario, ...medidor, monto_calculado: monto });
  return { mensaje: 'Reclamo actualizado.', monto_calculado: monto };
}

/* ---------- Administrador / empleado ---------- */

export const listarTodos = () => reclamosRepo.listarTodos();

// Atención presencial: se registra sin cuenta de cliente y se cobra luego en caja
export async function crearPresencial(body) {
  const dni = texto(body.dni);
  exigir(/^\d{8}$/.test(dni), 'El DNI debe tener exactamente 8 dígitos.');
  const nombre = nombreValido(body.nombre);
  const suministro = texto(body.suministro);
  exigir(/^\d{6,8}$/.test(suministro), 'El N° de suministro debe tener entre 6 y 8 dígitos.');
  const comentario = comentarioValido(body.comentario, 'El fundamento');
  const medidor = leerMedidor(body, true);
  const monto = montoSegunMotivo(MOTIVO_CON_COBRO, medidor);

  const creado = await reclamosRepo.crear({
    usuario_id: null, codigo: await nuevoCodigo(), dni, nombre, suministro, motivo: MOTIVO_CON_COBRO, direccion: null,
    mes: null, montoReclamado: null, comentario, ...medidor, monto_calculado: monto,
    estado_pago: 'pendiente', canal_registro: 'presencial',
  });
  return { codigo: creado.codigo, monto_calculado: creado.monto_calculado };
}

export async function dictaminar(usuario, idParam, body) {
  const id = idValido(idParam);
  const estado = texto(body.estado);
  exigir(ESTADOS_DICTAMEN.includes(estado), `El estado debe ser uno de: ${ESTADOS_DICTAMEN.join(', ')}.`);
  const respuesta = texto(body.comentario);
  exigir(respuesta.length <= 1000, 'El comentario no puede superar 1000 caracteres.');

  const reclamo = await reclamosRepo.buscarPorId(id);
  if (!reclamo) throw new AppError(404, 'Solicitud no encontrada.');

  // Regla del caso: sin pagar el contraste solo se puede rechazar
  if (requiereContraste(reclamo.motivo) && reclamo.estado_pago === 'pendiente' && estado !== 'rechazado') {
    throw new AppError(409, 'El derecho de contraste está pendiente de pago: no se puede derivar ni atender hasta que se pague.');
  }

  await reclamosRepo.actualizarDictamen(id, estado, respuesta || null, usuario.id);
  return { mensaje: 'Dictamen registrado.' };
}

export async function eliminar(idParam) {
  const id = idValido(idParam);
  if (!(await reclamosRepo.buscarPorId(id))) throw new AppError(404, 'Solicitud no encontrada.');
  if ((await pagosRepo.contarPorReclamo(id)) > 0) {
    throw new AppError(409, 'No se puede eliminar: la solicitud tiene historial de pagos.');
  }
  await reclamosRepo.eliminar(id);
  return { mensaje: 'Reclamo eliminado.' };
}
