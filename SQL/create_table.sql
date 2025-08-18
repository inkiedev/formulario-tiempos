-- Crear la tabla de incidentes en Supabase
CREATE TABLE incidentes (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  tipo_custom TEXT,
  fecha_incidencia TIMESTAMP WITH TIME ZONE NOT NULL,
  atr TIMESTAMP WITH TIME ZONE NOT NULL,
  alimentador_normal TEXT NOT NULL,
  usuario_asignado TEXT NOT NULL,
  observaciones TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_incidentes_tipo ON incidentes(tipo);
CREATE INDEX idx_incidentes_fecha_incidencia ON incidentes(fecha_incidencia);
CREATE INDEX idx_incidentes_created_at ON incidentes(created_at);

-- Habilitar RLS (Row Level Security) - opcional
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos (ajustar según necesidades)
CREATE POLICY "Allow read access to incidentes" ON incidentes
FOR SELECT USING (true);

-- Política para permitir inserción a todos (ajustar según necesidades)
CREATE POLICY "Allow insert access to incidentes" ON incidentes
FOR INSERT WITH CHECK (true);