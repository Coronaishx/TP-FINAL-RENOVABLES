import React, { useEffect } from 'react';
import { useSimulatorStore } from './store/simulatorStore';
import { TopBar } from './components/TopBar';
import { MapWorld } from './components/MapWorld';
import { ParameterPanel } from './components/ParameterPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { TabComparar } from './components/TabComparar';
import { TabArgentina } from './components/TabArgentina';
import { ModalFicha } from './components/ModalFicha';
import { ModalAcercaDe } from './components/ModalAcercaDe';
import { ModoExposicion } from './components/ModoExposicion';

export const App: React.FC = () => {
  const {
    activeTab,
    recomputeSimulation,
    selectSite,
    setTab,
    togglePause,
    modoExposicion,
    toggleModoExposicion,
  } = useSimulatorStore();

  // Inicializar simulación en la carga
  useEffect(() => {
    recomputeSimulation();
  }, [recomputeSimulation]);

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '1') {
        selectSite('la-rance');
      } else if (e.key === '2') {
        selectSite('sihwa');
      } else if (e.key === '3') {
        selectSite('meygen');
      } else if (e.key === '4') {
        selectSite('mutriku');
      } else if (e.key === '5') {
        selectSite('golfo-san-jose');
      } else if (e.key === '6') {
        selectSite('mar-del-plata-utn');
      } else if (e.key === 'c' || e.key === 'C') {
        setTab('comparar');
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleModoExposicion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectSite, setTab, togglePause, toggleModoExposicion]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Barra de navegación superior */}
      <TopBar />

      {/* Contenido principal según pestaña activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 overflow-hidden">
        {activeTab === 'simulador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[640px]">
            {/* Zona 1: Mapa (40% ≈ 5 columnas) */}
            <div className="lg:col-span-5 h-[360px] lg:h-auto min-h-[380px]">
              <MapWorld />
            </div>

            {/* Zona 2: Parámetros (25% ≈ 3 columnas) */}
            <div className="lg:col-span-3 h-[520px] lg:h-auto overflow-hidden">
              <ParameterPanel />
            </div>

            {/* Zona 3: Resultados y Esquema (35% ≈ 4 columnas) */}
            <div className="lg:col-span-4 h-full overflow-y-auto">
              <ResultsPanel />
            </div>
          </div>
        )}

        {activeTab === 'comparar' && <TabComparar />}

        {activeTab === 'argentina' && <TabArgentina />}
      </main>

      {/* Modales y vistas overlay */}
      <ModalFicha />
      <ModalAcercaDe />
      {modoExposicion && <ModoExposicion />}
    </div>
  );
};
export default App;
