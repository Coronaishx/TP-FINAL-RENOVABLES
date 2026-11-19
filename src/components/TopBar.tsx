import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { Waves, Presentation, Info, BarChart2, Globe2, Compass } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setTab,
    toggleModoExposicion,
    setModalAcercaDeOpen,
  } = useSimulatorStore();

  return (
    <header className="bg-[#fffcf5]/90 backdrop-blur-md border-b-[3px] border-teal-500 sticky top-0 z-30 shadow-md shadow-cyan-900/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Fila principal (Desktop: todo en una fila / Mobile: logo + acciones) */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Título de la app e isotipo */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Waves className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate flex items-center gap-1.5">
                <span>Simulador Energías Marinas</span>
                <span className="hidden md:inline px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  UNSAM ER1 2026
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Potencial teórico vs. centrales reales · Mareomotriz y Undimotriz
              </p>
            </div>
          </div>

          {/* Pestañas de navegación en DESKTOP (ocultas en pantallas pequeñas) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setTab('simulador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulador'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Simulador</span>
            </button>

            <button
              onClick={() => setTab('comparar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'comparar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Comparar</span>
            </button>

            <button
              onClick={() => setTab('argentina')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'argentina'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Argentina</span>
            </button>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              onClick={toggleModoExposicion}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs"
              title="Activar Modo Exposición para proyector (Atajo: F)"
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden md:inline">Modo Exposición</span>
            </button>

            <button
              onClick={() => setModalAcercaDeOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Ver fuentes bibliográficas y código QR para celular"
            >
              <Info className="w-4 h-4 text-blue-600" />
              <span className="hidden lg:inline">Acerca de / Fuentes</span>
            </button>
          </div>
        </div>

        {/* Barra de navegación inferior exclusiva para MOBILE */}
        <div className="sm:hidden pb-2.5">
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setTab('simulador')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulador'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Simulador</span>
            </button>

            <button
              onClick={() => setTab('comparar')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'comparar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Comparar</span>
            </button>

            <button
              onClick={() => setTab('argentina')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'argentina'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Argentina</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
