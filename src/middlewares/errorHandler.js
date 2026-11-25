// Últimos middlewares: convierten cualquier error en { mensaje } con su código HTTP
export function noEncontrada(req, res) {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
}

export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido.' });
  if (err.code === '23505') return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos.' }); // UNIQUE de PostgreSQL
  if (err.status) return res.status(err.status).json({ mensaje: err.message });
  console.error(err); // el detalle técnico solo va al log del servidor, no al cliente
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}
