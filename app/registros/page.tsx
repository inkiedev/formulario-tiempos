import IncidentTable from "@/components/incident-table";
import Navigation from "@/components/navigation";

export default function RegistrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Registros de Incidentes</h1>
        <IncidentTable />
      </main>
    </div>
  );
}