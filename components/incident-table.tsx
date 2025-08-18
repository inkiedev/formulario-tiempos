"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_INCIDENTES } from "@/lib/constants";
import { incidentesService, type IncidenteWithDuration } from "@/lib/services/incidentes";
import ExcelProcessorModal from "@/components/excel-processor-modal";

const ITEMS_PER_PAGE = 10;

export default function IncidentTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState<keyof IncidenteWithDuration>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [data, setData] = useState<IncidenteWithDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncidentes().then();
  }, []);

  const loadIncidentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const incidentes = await incidentesService.getAll();
      setData(incidentes);
    } catch (err) {
      setError("Error al cargar los incidentes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter(incident => {
      const matchesSearch = incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.alimentador_normal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incident.usuario_asignado.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || incident.tipo === filterType;
      
      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [data, searchTerm, filterType, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: keyof IncidenteWithDuration) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "Emergencia": return "destructive";
      case "Falla de Equipos": return "destructive";
      case "Mantenimiento": return "default";
      case "Corte Programado": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Registros de Incidentes</CardTitle>
          <ExcelProcessorModal />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Input
            placeholder="Buscar por ID, tipo, alimentador o usuario..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          
          <Select value={filterType} onValueChange={(value) => {
            setFilterType(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPOS_INCIDENTES.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedData.length)} de {filteredAndSortedData.length} registros
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <p>Cargando incidentes...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button onClick={loadIncidentes} className="mt-2">
              Reintentar
            </Button>
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("id")}
                    >
                      ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("tipo")}
                    >
                      Tipo {sortField === "tipo" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("duracion")}
                    >
                      Duración {sortField === "duracion" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("fecha_incidencia")}
                    >
                      Fecha Incidencia {sortField === "fecha_incidencia" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("atr")}
                    >
                      ATR {sortField === "atr" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("alimentador_normal")}
                    >
                      Alimentador {sortField === "alimentador_normal" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("usuario_asignado")}
                    >
                      Usuario Asignado {sortField === "usuario_asignado" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono">{incident.id}</TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(incident.tipo)}>
                          {incident.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.duracion} min</TableCell>
                      <TableCell className="text-sm">{new Date(incident.fecha_incidencia).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{new Date(incident.atr).toLocaleString()}</TableCell>
                      <TableCell>{incident.alimentador_normal}</TableCell>
                      <TableCell className="font-mono">{incident.usuario_asignado}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {incident.observaciones || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
