import { Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import AvisoPWA from "./components/AvisoPWA";
import BottomNav from "./components/BottomNav";
import MapaScreen from "./screens/MapaScreen";
import ViajesScreen from "./screens/ViajesScreen";
import ViajeFormScreen from "./screens/ViajeFormScreen";
import AjustesScreen from "./screens/AjustesScreen";

// Recharts y las tarjetas de descubrir pesan: los traemos solo cuando entrás ahí.
const StatsScreen = lazy(() => import("./screens/StatsScreen"));
const DescubrirScreen = lazy(() => import("./screens/DescubrirScreen"));

const Cargando = () => (
  <p className="px-5 py-10 text-center text-[13px] text-tinta-suave">
    Cargando…
  </p>
);

export default function App() {
  const { pathname } = useLocation();

  // Cada pantalla arranca arriba de todo.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const sinNav = pathname.startsWith("/viajes/") || pathname === "/ajustes";

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-md">
      <main
        key={pathname}
        className="animate-fade-in"
        style={{
          paddingBottom: sinNav
            ? "calc(24px + var(--safe-bottom))"
            : "calc(var(--nav-h) + var(--safe-bottom) + 16px)",
        }}
      >
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<MapaScreen />} />
            <Route path="/viajes" element={<ViajesScreen />} />
            <Route path="/viajes/nuevo" element={<ViajeFormScreen />} />
            <Route path="/viajes/:id" element={<ViajeFormScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/descubrir" element={<DescubrirScreen />} />
            <Route path="/ajustes" element={<AjustesScreen />} />
            <Route path="*" element={<MapaScreen />} />
          </Routes>
        </Suspense>
      </main>
      {!sinNav && <BottomNav />}
      {!sinNav && <AvisoPWA />}
    </div>
  );
}
