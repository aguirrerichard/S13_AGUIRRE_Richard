// Envuelve un controller async: si algo falla, el error pasa al errorHandler
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
