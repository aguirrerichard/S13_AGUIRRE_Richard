// Error con código HTTP: los services lo lanzan y el errorHandler lo convierte en { mensaje }
export class AppError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
