import React, { useState } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { formatoNumero } from '../utils/formatters';
import { RotateCcw, FileText, Info, AlertTriangle, Table } from 'lucide-react';
import { BETZ_LIMIT } from '../engine/constants';

export const ParameterPanel: React.FC = () => {
  const {
    sitios,
    selectedSiteId,
    currentParams,
    updateParam,
    resetCurrentSiteParams,
    setModalFichaOpen,
    tablaEstadosCSV,
    setTablaEstadosCSV,
  } = useSimulatorStore();

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvInput, setCsvInput] = useState(tablaEstadosCSV || 'H,T,frecuencia_%\n1.5,6.0,30\n2.5,8.0,45\n4.0,10.0,20\n6.0,12.0,5');

  const site = sitios.find((s) => s.id === selectedSiteId);
  if (!site) return null;

  const handleApplyCsv = () => {
    setTablaEstadosCSV(csvInput);
    updateParam('tipo_recurso', 'tabla');
    setShowCsvModal(false);
  };

  const isPresa = site.recurso === 'marea';
  const isCorriente = site.recurso === 'corriente';
  const isOlas = site.recurso === 'olas';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Cabecera del panel */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Parámetros de Simulación
          </span>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            {site.nombre}
            <span className="text-xs font-normal text-slate-500">({site.pais})</span>
          </h2>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={resetCurrentSiteParams}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors"
            title="Restablecer valores originales del sitio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalFichaOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded shadow-xs hover:bg-slate-50 transition-colors"
            title="Ver marco regulatorio e impacto ambiental"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Ficha</span>
          </button>
        </div>
      </div>

      {/* Selector de modo o tecnología */}
      <div className="px-4 py-2 bg-blue-50/40 border-b border-blue-100 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">Tecnología:</span>
        <span className="font-semibold text-blue-800">{site.tecnologia}</span>
      </div>

      {/* Cuerpo scrolleable con sliders y campos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* PARÁMETROS PARA PRESA / LAGUNA */}
        {isPresa && (
          <>
            {/* Modo de operación */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Modo de Operación</label>
                <span className="text-[10px] text-slate-400">
                  {site.parametros.modo?.fuente || (
                    <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">supuesto</span>
                  )}
                </span>
              </div>
              <select
                value={currentParams.modo || 'vaciado'}
                onChange={(e) => updateParam('modo', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
              >
                <option value="vaciado">Simple efecto: Generación en vaciado (Ebb)</option>
                <option value="llenado">Simple efecto: Generación en llenado (Flood)</option>
                <option value="doble_efecto">Doble efecto (Genera en ambos sentidos)</option>
                <option value="doble_bombeo">Doble efecto con bombeo auxiliar</option>
              </select>
            </div>

            {/* Amplitud media de marea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Amplitud media de marea (a)</span>
                <span className="font-bold text-slate-900">{formatoNumero(currentParams.a_media, 2)} m</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="14.0"
                step="0.1"
                value={currentParams.a_media ?? 8.17}
                onChange={(e) => updateParam('a_media', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Fuente: {site.parametros.a_media?.fuente || 'Sin fuente'}</span>
                <span>Rango: 2 a 14 m</span>
              </div>
            </div>

            {/* Superficie del embalse */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Superficie embalse (A)</span>
                <span className="font-bold text-slate-900">{formatoNumero(currentParams.A_km2, 1)} km²</span>
              </div>
              <input
                type="range"
                min="5"
                max="3000"
                step="1"
                value={currentParams.A_km2 ?? 17}
                onChange={(e) => updateParam('A_km2', parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Fuente: {site.parametros.A_km2?.fuente || 'Fernández Díez'}
              </div>
            </div>

            {/* Número de turbinas y potencia nominal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Turbinas (N)</label>
                <input
                  type="number"
                  min="1"
                  max="400"
                  value={currentParams.N ?? 24}
                  onChange={(e) => updateParam('N', parseInt(e.target.value, 10))}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Potencia nominal</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={currentParams.P_nom_MW ?? 10}
                    onChange={(e) => updateParam('P_nom_MW', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                  />
                  <span className="ml-1 text-[11px] text-slate-500 font-medium">MW</span>
                </div>
              </div>
            </div>

            {/* Parámetros marcados como supuestos ajustables */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Supuestos ajustables (calibrados)</span>
              </div>

              {/* Caudal nominal por turbina */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    Q nominal / turbina
                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                  </span>
                  <span className="font-semibold text-slate-800">{formatoNumero(currentParams.Q_nom, 0)} m³/s</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="5"
                  value={currentParams.Q_nom ?? 275}
                  onChange={(e) => updateParam('Q_nom', parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 italic">
                  {site.parametros.Q_nom?.explicacion || 'Calibrado para el preset real'}
                </p>
              </div>

              {/* Salto de arranque */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    Salto arranque (H_start)
                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                  </span>
                  <span className="font-semibold text-slate-800">{formatoNumero(currentParams.H_start, 2)} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={currentParams.H_start ?? 3.5}
                  onChange={(e) => updateParam('H_start', parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Salto mínimo */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    Salto corte mín (H_min)
                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                  </span>
                  <span className="font-semibold text-slate-800">{formatoNumero(currentParams.H_min, 2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={currentParams.H_min ?? 1.5}
                  onChange={(e) => updateParam('H_min', parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Rendimiento turbina */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    Rendimiento (η_t)
                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                  </span>
                  <span className="font-semibold text-slate-800">{Math.round((currentParams.eta_t ?? 0.88) * 100)} %</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.95"
                  step="0.01"
                  value={currentParams.eta_t ?? 0.88}
                  onChange={(e) => updateParam('eta_t', parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Modulación vivas/muertas (k) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    Modulación vivas/muertas (k)
                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                  </span>
                  <span className="font-semibold text-slate-800">{formatoNumero(currentParams.k, 2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={currentParams.k ?? 0}
                  onChange={(e) => updateParam('k', parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Nota cota teórica */}
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-slate-700 text-[11px] leading-relaxed">
              <span className="font-bold text-blue-900 block mb-0.5">Cota teórica de Bernshtein:</span>
              La potencia media disponible de una cuenca de marea está acotada por:
              <div className="font-mono text-center font-bold text-blue-950 my-1 bg-white/70 py-1 rounded">
                P_teórica [kW] = 226 · A[km²] · a²[m]
              </div>
              <span className="italic text-slate-600">
                La central real nunca puede superar esta potencia media teórica por límites termodinámicos e hidrodinámicos.
              </span>
            </div>
          </>
        )}

        {/* PARÁMETROS PARA CORRIENTES DE MAREA */}
        {isCorriente && (
          <>
            {/* Velocidad máxima de corriente */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Velocidad pico media (v_max)</span>
                <span className="font-bold text-teal-800">{formatoNumero(currentParams.v_max, 2)} m/s</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="6.0"
                step="0.05"
                value={currentParams.v_max ?? 3.25}
                onChange={(e) => updateParam('v_max', parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Fuente: {site.parametros.velocidad_maxima_nudos?.fuente || 'Supuesto calibrado'}</span>
                <span>≈ {formatoNumero((currentParams.v_max ?? 3.25) * 1.94384, 1)} nudos</span>
              </div>
            </div>

            {/* Número y potencia unitaria */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Turbinas (N)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={currentParams.N ?? 4}
                  onChange={(e) => updateParam('N', parseInt(e.target.value, 10))}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">P nominal unitaria</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={currentParams.P_nom_MW ?? 1.5}
                    onChange={(e) => updateParam('P_nom_MW', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                  />
                  <span className="ml-1 text-[11px] text-slate-500 font-medium">MW</span>
                </div>
              </div>
            </div>

            {/* Diámetro de rotor */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Diámetro de rotor (D)</span>
                <span className="font-bold text-slate-900">{formatoNumero(currentParams.D, 1)} m</span>
              </div>
              <input
                type="range"
                min="8"
                max="30"
                step="0.5"
                value={currentParams.D ?? 18}
                onChange={(e) => updateParam('D', parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Coeficiente Cp con validación Betz */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  Coeficiente de potencia (Cp)
                  <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">supuesto</span>
                </span>
                <span className={`font-bold ${currentParams.C_p > BETZ_LIMIT ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatoNumero(currentParams.C_p, 3)}
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.59"
                step="0.01"
                value={currentParams.C_p ?? 0.42}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val <= BETZ_LIMIT) updateParam('C_p', val);
                }}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">
                Límite de Betz: 16/27 ≈ 0,593 (máximo físico absoluto).
              </div>
            </div>

            {/* Disponibilidad */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Disponibilidad operativa</span>
                <span className="font-bold text-slate-900">{Math.round((currentParams.disponibilidad ?? 0.92) * 100)} %</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.0"
                step="0.01"
                value={currentParams.disponibilidad ?? 0.92}
                onChange={(e) => updateParam('disponibilidad', parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Referencia física clave */}
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">Dato de referencia de densidad energética:</span>
              El agua de mar es ≈ 830 veces más densa que el aire. Por ello,{' '}
              <strong>una corriente de agua de 2 m/s posee por m² la misma potencia que un viento de 18 m/s</strong> (65 km/h).
            </div>
          </>
        )}

        {/* PARÁMETROS PARA CONVERTIDORES DE OLAS */}
        {isOlas && (
          <>
            {/* Modalidad de recurso: valor medio o matriz de estados */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Modalidad de Recurso</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateParam('tipo_recurso', 'medio')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                    currentParams.tipo_recurso !== 'tabla'
                      ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Flujo medio (kW/m)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(true)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    currentParams.tipo_recurso === 'tabla'
                      ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Matriz de estados</span>
                </button>
              </div>
            </div>

            {/* Flujo medio anual */}
            {currentParams.tipo_recurso !== 'tabla' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Flujo medio de energía</span>
                  <span className="font-bold text-orange-700">{formatoNumero(currentParams.potencia_recurso_kW_m, 1)} kW/m</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="70"
                  step="0.5"
                  value={currentParams.potencia_recurso_kW_m ?? 16.5}
                  onChange={(e) => updateParam('potencia_recurso_kW_m', parseFloat(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  Fuente: {site.parametros.potencia_recurso_kW_m?.fuente || 'Lanfredi et al. / Carreras'}
                </div>
              </div>
            )}

            {/* Ancho de captura B y CWR */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Ancho frontal (B)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={currentParams.B ?? 4.5}
                    onChange={(e) => updateParam('B', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                  />
                  <span className="ml-1 text-[11px] text-slate-500">m</span>
                </div>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">CWR (Captura)</label>
                <input
                  type="number"
                  min="0.1"
                  max="0.9"
                  step="0.02"
                  value={currentParams.CWR ?? 0.3}
                  onChange={(e) => updateParam('CWR', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Potencia nominal unitaria y unidades */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Potencia nominal</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    step="1"
                    value={currentParams.P_nom_kW ?? 18.5}
                    onChange={(e) => updateParam('P_nom_kW', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                  />
                  <span className="ml-1 text-[11px] text-slate-500">kW</span>
                </div>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-0.5">Dispositivos (N)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={currentParams.N ?? 16}
                  onChange={(e) => updateParam('N', parseInt(e.target.value, 10))}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Nota específica para Mar del Plata Prototipo UTN */}
            {site.id === 'mar-del-plata-utn' && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5 text-amber-900">Dimensionamiento del prototipo UTN:</span>
                Con un recurso medio de <strong>4,3 kW/m</strong> en Mar del Plata, una unidad de <strong>30 kW</strong> requiere
                captar el 100% de la energía de <strong>≈ 7 m de frente de ola</strong> (30 / 4,3 = 6,98 m) para alcanzar su potencia nominal.
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para ingresar tabla de estados de mar CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Table className="w-4 h-4 text-orange-600" />
              Matriz de Estados de Mar (Dispersión H-T)
            </h3>
            <p className="text-xs text-slate-600">
              Ingresá los estados de mar en formato CSV (Columnas: Altura H [m], Período T [s], Frecuencia [%]):
            </p>
            <textarea
              rows={6}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              className="w-full font-mono text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCsv}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
              >
                Aplicar matriz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
