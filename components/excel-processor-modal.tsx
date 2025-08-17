"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { incidentesService, type IncidenteWithDuration } from "@/lib/services/incidentes";

interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

export default function ExcelProcessorModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ExcelRow[] | null>(null);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const getIncidentsByMonth = (incidents: IncidenteWithDuration[], monthYear: string) => {
    if (!monthYear) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      return incidents.filter(incident => {
        const incidentDate = new Date(incident.fecha_incidencia);
        return incidentDate.getMonth() === currentMonth && 
               incidentDate.getFullYear() === currentYear;
      });
    }

    const [year, month] = monthYear.split('-').map(Number);
    return incidents.filter(incident => {
      const incidentDate = new Date(incident.fecha_incidencia);
      return incidentDate.getMonth() === (month - 1) && 
             incidentDate.getFullYear() === year;
    });
  };

  const findIncidentById = (incidents: IncidenteWithDuration[], incidentId: string) => {
    // Limpiar el ID del Excel: quitar "INC", "INC-", "INC " y espacios extra
    const cleanId = incidentId
      .replace(/^INC[\s-]*/i, '') // Quita INC, INC-, INC seguido de espacios
      .trim(); // Quita espacios al inicio y final
    
    return incidents.find(incident => {
      // Limpiar el ID de la base de datos de la misma manera
      const cleanIncidentId = incident.id
        .replace(/^INC[\s-]*/i, '')
        .trim();

      
      return cleanIncidentId === cleanId;
    });
  };

  const processExcelFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      // Leer archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      // Obtener incidentes del mes seleccionado
      const allIncidents = await incidentesService.getAll();
      const monthIncidents = getIncidentsByMonth(allIncidents, selectedMonth);

      // Procesar datos y agregar columnas
      let matchesFound = 0;
      const processedData = data.map(row => {
        // Buscar columna que contenga el ID del incidente
        let incidentId = '';
        let foundColumn = '';
        
        // Buscar en orden de prioridad las columnas más comunes para IDs
        const priorityColumns = ['ID', 'Id', 'id', 'incidente', 'Incidente', 'incident_id', 'numero', 'codigo'];
        
        for (const col of priorityColumns) {
          if (row[col]) {
            incidentId = String(row[col]).trim();
            foundColumn = col;
            break;
          }
        }

        // Si no encuentra en columnas específicas, buscar en todas las columnas
        if (!incidentId) {
          for (const [key, value] of Object.entries(row)) {
            if (value && String(value).match(/^(INC[\s-]?)?[\w\d-]+$/)) {
              incidentId = String(value).trim();
              foundColumn = key;
              break;
            }
          }
        }
        const matchedIncident = incidentId ? findIncidentById(monthIncidents, incidentId) : null;

        const newRow: ExcelRow = { ...row };
        
        if (matchedIncident) {
          matchesFound++;
          newRow['Duracion Calculada'] = `${matchedIncident.duracion} min`;
          newRow['Observaciones'] = matchedIncident.observaciones;
        }
        
        return newRow;
      });

      setProcessedData(processedData);
      setMatchesFound(matchesFound);
      setTotalRows(data.length);
    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert('Error al procesar el archivo. Verifique que sea un archivo Excel válido.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadProcessedFile = () => {
    if (!processedData) return;

    // Obtener todas las columnas originales del primer row
    const firstRow = processedData[0];
    if (!firstRow) return;
    
    const originalColumns = Object.keys(firstRow).filter(key => key !== 'Duracion Calculada' && key !== 'Observaciones');
    const finalColumns = [...originalColumns, 'Duracion Calculada', 'Observaciones'];
    
    // Reorganizar datos con orden de columnas específico
    const reorderedData = processedData.map(row => {
      const orderedRow: ExcelRow = {};
      
      // Primero todas las columnas originales
      originalColumns.forEach(col => {
        if (row[col] !== undefined) {
          orderedRow[col] = row[col];
        }
      });
      
      // Luego las nuevas columnas al final (solo si existen)
      if (row['Duracion Calculada'] !== undefined) {
        orderedRow['Duracion Calculada'] = row['Duracion Calculada'];
      }
      if (row['Observaciones'] !== undefined) {
        orderedRow['Observaciones'] = row['Observaciones'];
      }
      
      return orderedRow;
    });

    // Crear nuevo workbook con orden específico de columnas
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reorderedData, { 
      header: finalColumns.filter(col => 
        reorderedData.some(row => row[col] !== undefined)
      )
    });

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Incidentes Procesados");

    // Generar archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // Generar nombre del archivo con fecha
    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `incidentes_procesados_${dateStr}.xlsx`;
    
    saveAs(blob, fileName);
  };

  const resetModal = () => {
    setFile(null);
    setProcessedData(null);
    setProcessing(false);
    setMatchesFound(0);
    setTotalRows(0);
    setSelectedMonth("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('sheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setProcessedData(null);
        setMatchesFound(0);
        setTotalRows(0);
      } else {
        alert('Por favor, seleccione un archivo Excel válido (.xlsx o .xls)');
      }
    }
  };

  // Generar opciones de meses para el año actual y anterior
  const generateMonthOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const options = [];

    // Año actual
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const monthValue = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      options.push({ value: monthValue, label: monthLabel });
    }

    // Año anterior
    const previousYear = currentYear - 1;
    for (let month = 0; month < 12; month++) {
      const date = new Date(previousYear, month, 1);
      const monthValue = `${previousYear}-${String(month + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      options.unshift({ value: monthValue, label: monthLabel });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetModal();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Procesar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Archivo Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Sube un archivo Excel con columnas de incidentes. Se agregarán las columnas &#34;Duracion Calculada&#34; y
            &#34;Observaciones&#34; basadas en los incidentes del mes seleccionado.
          </div>

          <div className="space-y-2">
            <Label htmlFor="month-select">Mes de comparación</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes (por defecto: mes actual)" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excel-file">Archivo Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{file.name}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={processExcelFile} 
              disabled={!file || processing}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              {processing ? 'Procesando...' : 'Procesar'}
            </Button>

            {processedData && (
              <Button 
                onClick={downloadProcessedFile}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            )}
          </div>

          {processedData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                ✅ Archivo procesado exitosamente
                <br />
                📊 {totalRows} filas procesadas
                <br />
                🎯 {matchesFound} coincidencias encontradas
                <br />
                📥 Listo para descargar
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
