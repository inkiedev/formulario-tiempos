import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type IncidenteInsert = Database['public']['Tables']['incidentes']['Insert'];
type IncidenteRow = Database['public']['Tables']['incidentes']['Row'];

export interface CreateIncidenteData {
  id: string;
  tipo: string;
  tipoCustom?: string;
  fechaIncidencia: string;
  atr: string;
  alimentadorNormal: string;
  observaciones: string;
}

export interface IncidenteWithDuration extends Omit<IncidenteRow, 'tipo_custom'> {
  tipo_custom: string | null;
  duracion: number;
}

const calculateDuration = (fechaIncidencia: string, atr: string): number => {
  const inicio = new Date(fechaIncidencia);
  const fin = new Date(atr);
  const diffMs = fin.getTime() - inicio.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60))); // en minutos
};

export const incidentesService = {
  async create(data: CreateIncidenteData) {
    const incidenteData: IncidenteInsert = {
      id: `INC ${data.id}`,
      tipo: data.tipo,
      tipo_custom: data.tipoCustom || null,
      fecha_incidencia: data.fechaIncidencia,
      atr: data.atr,
      alimentador_normal: data.alimentadorNormal,
      observaciones: data.observaciones,
    };

    const { data: result, error } = await supabase
      .from('incidentes')
      .insert(incidenteData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear incidente: ${error.message}`);
    }

    return result;
  },

  async getAll(): Promise<IncidenteWithDuration[]> {
    const { data, error } = await supabase
      .from('incidentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener incidentes: ${error.message}`);
    }

    return data.map(incident => ({
      ...incident,
      duracion: calculateDuration(incident.fecha_incidencia, incident.atr),
    }));
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('incidentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener incidente: ${error.message}`);
    }

    return {
      ...data,
      duracion: calculateDuration(data.fecha_incidencia, data.atr),
    };
  },

  async update(id: string, updates: Partial<CreateIncidenteData>) {
    const updateData: Partial<IncidenteInsert> = {};
    
    if (updates.tipo) updateData.tipo = updates.tipo;
    if (updates.tipoCustom !== undefined) updateData.tipo_custom = updates.tipoCustom || null;
    if (updates.fechaIncidencia) updateData.fecha_incidencia = updates.fechaIncidencia;
    if (updates.atr) updateData.atr = updates.atr;
    if (updates.alimentadorNormal) updateData.alimentador_normal = updates.alimentadorNormal;
    if (updates.observaciones) updateData.observaciones = updates.observaciones;

    const { data, error } = await supabase
      .from('incidentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar incidente: ${error.message}`);
    }

    return {
      ...data,
      duracion: calculateDuration(data.fecha_incidencia, data.atr),
    };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('incidentes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar incidente: ${error.message}`);
    }

    return true;
  },
};