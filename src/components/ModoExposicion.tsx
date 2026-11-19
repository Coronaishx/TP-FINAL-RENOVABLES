import React, { useEffect } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { SchematicAnimation } from './SchematicAnimation';
import { formatoNumero, formatoEntero } from '../utils/formatters';
import { X, Maximize, Minimize, Zap, Award, TrendingUp, Clock, Info } from 'lucide-react';

export const ModoExposicion: React.FC = () => {
  const {
    sitios,
    selectedSiteId,
    simulationResults,
    modoExposicion,
    toggleModoExposicion,
    selectSite,
    setTab,
    togglePause,
  } = useSimulatorStore();

  const site = sitios.find((s) => s.id === selectedSiteId);

  // Atajos de teclado en modo exposición
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si hay un modal o input activo, ignorar
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
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'Escape') {
        if (modoExposicion) toggleModoExposicion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectSite, setTab, togglePause, modoExposicion, toggleModoExposicion]);

  if (!modoExposicion || !site || !simulationResults) return null;

  const tieneDatosReales = !!site.produccion_real;
  const prodRealGWh = site.produccion_real?.valor_anual_GWh;
  const cfReal = site.produccion_real?.factor_de_planta_calculado_pct;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 overflow-hidden select-none">
      {/* Barra superior de presentación */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-sm font-semibold tracking-wider text-amber-400 uppercase">
            MODO EXPOSICIÓN — ENERGÍAS RENOVABLES I (UNSAM)
          </span>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mt-1">
            {site.nombre}
            <span className="text-xl font-normal text-slate-400">({site.pais}) — {site.tecnologia}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            title="Pantalla completa (Atajo: F)"
          >
            <Maximize className="w-4 h-4" />
            <span>Pantalla completa (F)</span>
          </button>

          <button
            onClick={toggleModoExposicion}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Salir (Esc)</span>
          </button>
        </div>
      </div>

      {/* Contenido principal en 2 columnas de alto contraste */}
      <div className="flex-1 grid grid-cols-12 gap-6 my-4 overflow-hidden items-stretch">
        {/* Columna Izquierda: Esquema animado grande (7 cols) */}
        <div className="col-span-7 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex-1 min-h-[360px] flex items-center justify-center">
            <SchematicAnimation />
          </div>

          <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <p className="text-base text-slate-200 leading-relaxed font-sans">
              {site.descripcion}
            </p>
          </div>
        </div>

        {/* Columna Derecha: Tarjetas gigantes de resultados (5 cols) */}
        <div className="col-span-5 flex flex-col justify-between space-y-4">
          {/* Card 1: Factor de Planta Gigante */}
          <div className="p-6 bg-gradient-to-br from-blue-900/40 to-slate-900 border-2 border-blue-500/50 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-lg font-bold uppercase tracking-wider">Factor de Planta Simulado</span>
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-6xl font-black text-amber-300 my-2">
              {formatoNumero(simulationResults.factor_de_planta_pct, 1)} %
            </div>
            {tieneDatosReales && cfReal && (
              <div className="text-base font-semibold text-emerald-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Real publicado en central:</span>
                <span className="text-xl font-bold">{formatoNumero(cfReal, 1)} %</span>
              </div>
            )}
          </div>

          {/* Card 2: Energía Anual */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-base font-bold uppercase tracking-wider">Energía Neta Anual</span>
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-5xl font-black text-white my-1">
              {simulationResults.energia_anual_GWh >= 1.0
                ? `${formatoNumero(simulationResults.energia_anual_GWh, 1)} GWh/a`
                : `${formatoEntero(simulationResults.energia_anual_MWh)} MWh/a`}
            </div>
            {tieneDatosReales && prodRealGWh && (
              <div className="text-sm text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Generación real publicada:</span>
                <span className="text-emerald-400 font-bold">{formatoNumero(prodRealGWh, 1)} GWh/año</span>
              </div>
            )}
          </div>

          {/* Card 3: Potencia Media vs Potencia Nominal */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl text-base">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Potencia Media</span>
              <span className="text-2xl font-bold text-teal-300">
                {formatoNumero(simulationResults.potencia_media_MW, 2)} MW
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Potencia Instalada</span>
              <span className="text-2xl font-bold text-slate-200">
                {formatoNumero(simulationResults.potencia_nominal_total_MW, 1)} MW
              </span>
            </div>
          </div>

          {/* Card 4: Cota Teórica o Cita Física */}
          {simulationResults.potencia_teorica_MW && (
            <div className="p-4 bg-blue-950/50 border border-blue-900 rounded-xl text-sm text-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-blue-400 block">Cota Teórica 226·A·a²</span>
                <span className="text-xl font-bold text-white">{formatoEntero(simulationResults.potencia_teorica_MW)} MW</span>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold text-blue-400 block">Rendimiento Teórico</span>
                <span className="text-xl font-bold text-amber-300">{formatoNumero(simulationResults.relacion_teorica_pct, 1)} %</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de atajos de teclado al pie */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-slate-500 font-bold">Atajos de teclado:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">1</span> La Rance
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">2</span> Sihwa
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">3</span> MeyGen
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">4</span> Mutriku
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">5</span> San José
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">6</span> MdP (UTN)
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">C</span> Comparar
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">Espacio</span> Pausa
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">F</span> Fullscreen
        </div>

        <span className="text-slate-500 hidden sm:inline">Presioná ESC para salir</span>
      </div>
    </div>
  );
};
