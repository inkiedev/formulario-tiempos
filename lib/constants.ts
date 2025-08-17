export const TIPOS_INCIDENTES = [
  "Programada",
  "No programada sin servicio",
  "No programada con servicio",
  "Alumbrado publico"
] as const;

export type TipoIncidente = typeof TIPOS_INCIDENTES[number];
