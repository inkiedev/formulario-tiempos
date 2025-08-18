"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TIPOS_INCIDENTES } from "@/lib/constants";
import { incidentesService } from "@/lib/services/incidentes";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  id: z.string().min(1, "El ID del incidente es requerido").length(10, "El ID debe tener exactamente 10 caracteres"),
  tipo: z.string().min(1, "El tipo de incidente es requerido"),
  tipoCustom: z.string().optional(),
  fechaIncidencia: z.string().min(1, "La fecha de incidencia es requerida"),
  atr: z.string().min(1, "El ATR es requerido"),
  alimentadorNormal: z.string().min(1, "El alimentador normal es requerido"),
  usuarioAsignado: z.string().min(1, "El usuario asignado es requerido").length(10, "El usuario asignado debe tener exactamente 10 caracteres"),
  observaciones: z.string().min(1, "Las observaciones son requeridas"),
}).refine((data) => {
  if (data.fechaIncidencia && data.atr) {
    const fechaIncidencia = new Date(data.fechaIncidencia);
    const atr = new Date(data.atr);
    return atr >= fechaIncidencia;
  }
  return true;
}, {
  message: "El ATR no puede ser anterior a la fecha de incidencia",
  path: ["atr"],
});

export default function IncidentForm() {
  const [tipoCustomVisible, setTipoCustomVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      tipo: "",
      tipoCustom: "",
      fechaIncidencia: "",
      atr: "",
      alimentadorNormal: "",
      usuarioAsignado: "",
      observaciones: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      await incidentesService.create({
        id: values.id,
        tipo: values.tipo,
        tipoCustom: values.tipoCustom,
        fechaIncidencia: values.fechaIncidencia,
        atr: values.atr,
        alimentadorNormal: values.alimentadorNormal,
        usuarioAsignado: values.usuarioAsignado,
        observaciones: values.observaciones,
      });
      
      // Resetear formulario
      form.reset();
      
      // Mostrar mensaje de éxito (opcional)
      alert("Incidente registrado exitosamente");
      
      // Redirigir a la tabla de registros
      router.push("/registros");
      
    } catch (error) {
      console.error("Error al registrar incidente:", error);
      alert("Error al registrar el incidente. Por favor, intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Formulario de Incidentes</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID del Incidente</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                      INC
                    </div>
                    <Input 
                      className="pl-12"
                      maxLength={10}
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Incidente</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setTipoCustomVisible(value === "custom");
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de incidente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_INCIDENTES.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Otro (especificar)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {tipoCustomVisible && (
            <FormField
              control={form.control}
              name="tipoCustom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique el tipo</FormLabel>
                  <FormControl>
                    <Input placeholder="Especifique el tipo de incidente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="fechaIncidencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora de Incidencia</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="atr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ATR (Fecha y Hora)</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alimentadorNormal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alimentador Normal</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingrese el alimentador normal" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usuarioAsignado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario Asignado</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                      qas/05-
                    </div>
                    <Input 
                      className="pl-16"
                      maxLength={10}
                      placeholder="Ingrese el usuario asignado"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingrese observaciones (requerido)"
                    className="resize-none"
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Incidente"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
