import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      incidentes: {
        Row: {
          id: string;
          tipo: string;
          tipo_custom: string | null;
          fecha_incidencia: string;
          atr: string;
          alimentador_normal: string;
          usuario_asignado: string;
          observaciones: string;
          created_at: string;
        };
        Insert: {
          id: string;
          tipo: string;
          tipo_custom?: string | null;
          fecha_incidencia: string;
          atr: string;
          alimentador_normal: string;
          usuario_asignado: string;
          observaciones: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          tipo_custom?: string | null;
          fecha_incidencia?: string;
          atr?: string;
          alimentador_normal?: string;
          usuario_asignado?: string;
          observaciones?: string;
          created_at?: string;
        };
      };
    };
  };
};