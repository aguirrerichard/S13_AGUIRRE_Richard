-- Ajustes de LuzCentro sobre las tablas que YA existen en Neon (usuarios, reclamos_luz, pagos, facturacion, etc.).
-- Es seguro ejecutarlo varias veces (todo usa IF NOT EXISTS). No borra ni reemplaza tus datos.

-- 1) reclamos_luz: columnas que el backend necesita y la tabla original no tenía
ALTER TABLE public.reclamos_luz ADD COLUMN IF NOT EXISTS respuesta TEXT;
ALTER TABLE public.reclamos_luz ADD COLUMN IF NOT EXISTS atendido_por INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL;
ALTER TABLE public.reclamos_luz ADD COLUMN IF NOT EXISTS canal_registro VARCHAR(12) NOT NULL DEFAULT 'web';

-- 2) Limpieza de valores heredados: el estado "Servir" era "atendido" y el medidor se guardaba con tilde
UPDATE public.reclamos_luz SET estado = 'atendido' WHERE estado = 'Servir';
UPDATE public.reclamos_luz SET tipo_medidor = 'monofasico' WHERE tipo_medidor = 'monofásico';
UPDATE public.reclamos_luz SET tipo_medidor = 'trifasico'  WHERE tipo_medidor = 'trifásico';

-- 3) Secuencia para los códigos de seguimiento REC-AAAA-00001
CREATE SEQUENCE IF NOT EXISTS public.seq_codigo_reclamo START 1;

-- 4) Reglas de integridad que las tablas originales no tenían (evitan duplicados aunque falle la lógica)
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_correo ON public.usuarios (LOWER(correo));
CREATE UNIQUE INDEX IF NOT EXISTS uq_reclamos_codigo ON public.reclamos_luz (codigo_seguimiento);
-- Una solicitud solo puede tener UN pago aprobado (evita doble cobro)
CREATE UNIQUE INDEX IF NOT EXISTS uq_pago_aprobado ON public.pagos (id_registro) WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_reclamos_usuario ON public.reclamos_luz (id_usuario);
CREATE INDEX IF NOT EXISTS idx_reclamos_dni ON public.reclamos_luz (dni);
CREATE INDEX IF NOT EXISTS idx_facturacion_suministro ON public.facturacion (numero_suministro);

-- 5) Tablas nuevas (no existían en tu base): catálogo de servicios y clientes del módulo de gestión
CREATE TABLE IF NOT EXISTS public.lc_servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(300),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.lc_clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  dni CHAR(8) NOT NULL UNIQUE,
  correo VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(9),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
