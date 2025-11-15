import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
import CompletarPerfil from "./pages/auth/CompletarPerfil";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/errors/Forbidden";
import ListadoTorneos from "./pages/torneos/ListadoTorneos";
import DetalleTorneo from "./pages/torneos/DetalleTorneo";
import GestionOlimpiadas from "./pages/olimpiadas/GestionOlimpiadas";
import ListadoPartidos from "./pages/partidos/ListadoPartidos";
import DetallePartido from "./pages/partidos/DetallePartido";
import ListadoEquipos from "./pages/equipos/ListadoEquipos";
import { DetalleEquipo } from "./pages/equipos/DetalleEquipo";
import TablaPosiciones from "./pages/posiciones/TablaPosiciones";
import Usuarios from "./pages/admin/Usuarios";
import PerfilUsuario from "./pages/perfil/PerfilUsuario";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route
            path="/auth/completar-perfil"
            element={
              <ProtectedRoute>
                <CompletarPerfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/torneos"
            element={
              <ProtectedRoute>
                <ListadoTorneos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/torneos/:id"
            element={
              <ProtectedRoute>
                <DetalleTorneo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/olimpiadas"
            element={
              <ProtectedRoute>
                <GestionOlimpiadas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partidos"
            element={
              <ProtectedRoute>
                <ListadoPartidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partidos/:id"
            element={
              <ProtectedRoute>
                <DetallePartido />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipos"
            element={
              <ProtectedRoute>
                <ListadoEquipos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipos/:id"
            element={
              <ProtectedRoute>
                <DetalleEquipo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posiciones"
            element={
              <ProtectedRoute>
                <TablaPosiciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilUsuario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute requiredRole="Administrador">
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
