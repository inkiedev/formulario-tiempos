import IncidentForm from "@/components/incident-form";
import Navigation from "@/components/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Registrar Nuevo Incidente</h1>
        <IncidentForm />
      </main>
    </div>
  );
}
