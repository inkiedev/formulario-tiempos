import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Sistema de Incidentes</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost">Registrar Incidente</Button>
            </Link>
            <Link href="/registros">
              <Button variant="ghost">Ver Registros</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}