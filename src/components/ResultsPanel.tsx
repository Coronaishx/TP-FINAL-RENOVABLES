import React, { useRef } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { SchematicAnimation } from './SchematicAnimation';
import { formatoNumero, formatoEntero } from '../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Download, Zap, TrendingUp, Clock, Award, ShieldAlert } from 'lucide-react';

export const ResultsPanel: React.FC = () => {
  const { sitios, selectedSiteId, simulationResults } = useSimulatorStore();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const site = sitios.find((s) => s.id === selectedSiteId);
  if (!site || !simulationResults) return null;

  const isPresa = site.recurso === 'marea';
  const isCorriente = site.recurso === 'corriente';
  const isOlas = site.recurso === 'olas';

  // Datos reales publicados si existen
  const tieneDatosReales = !!site.produccion_real;
  const prodRealGWh = site.produccion_real?.valor_anual_GWh;
  const prodRealMWh = site.produccion_real?.valor_anual_MWh;
  const cfReal = site.produccion_real?.factor_de_planta_calculado_pct;

  // Comparación porcentual
  let difProdPct: number | null = null;
  if (prodRealGWh !== undefined) {
    difProdPct = ((simulationResults.energia_anual_GWh - prodRealGWh) / prodRealGWh) * 100;
  } else if (prodRealMWh !== undefined) {
    difProdPct = ((simulationResults.energia_anual_MWh - prodRealMWh) / prodRealMWh) * 100;
  }

  // Exportar gráfico como imagen PNG
  const handleExportPNG = () => {
    if (!chartContainerRef.current) return;
    const svgElem = chartContainerRef.current.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const canvas = document.createElement('canvas');
    const svgSize = svgElem.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `simulacion_${site.id}_grafico.png`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  // Reducir serie temporal a las primeras 72 horas para un gráfico muy claro y legible
  const serieGrafico = simulationResults.serie_temporal.filter((p) => p.t_horas <= 72);

  return (
    <div className="flex flex-col h-full panel-mar overflow-hidden space-y-3 p-3 sm:p-4">
      {/* 1. Animación esquemática SVG */}
      <SchematicAnimation />

      {/* 2. Tarjetas de resultados clave (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Energía Anual */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">Energía Anual</span>
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="font-bold text-base text-slate-900">
            {simulationResults.energia_anual_GWh >= 1.0
              ? `${formatoNumero(simulationResults.energia_anual_GWh, 1)} GWh/a`
              : `${formatoEntero(simulationResults.energia_anual_MWh)} MWh/a`}
          </div>
          <span className="text-[10px] text-slate-400">Ciclo 8.760 h anualizado</span>
        </div>

        {/* Potencia Media */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">Potencia Media</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="font-bold text-base text-slate-900">
            {formatoNumero(simulationResults.potencia_media_MW, 2)} MW
          </div>
          <span className="text-[10px] text-slate-400">
            P. Nom: {formatoNumero(simulationResults.potencia_nominal_total_MW, 1)} MW
          </span>
        </div>

        {/* Factor de Planta */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">Factor de Planta</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-bold text-base text-slate-900">
            {formatoNumero(simulationResults.factor_de_planta_pct, 1)} %
          </div>
          <span className="text-[10px] text-slate-400">Rendimiento capacidad</span>
        </div>

        {/* Horas de Generación */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">Horas Operación</span>
            <Clock className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="font-bold text-base text-slate-900">
            {formatoNumero(simulationResults.horas_generacion_dia, 1)} h/día
          </div>
          <span className="text-[10px] text-slate-400">Disponibilidad de ciclo</span>
        </div>
      </div>

      {/* Relación con Cota Teórica para Presas */}
      {isPresa && simulationResults.potencia_teorica_MW && (
        <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-600 font-medium">Cota teórica (226·A·a²): </span>
            <strong className="text-blue-900">{formatoEntero(simulationResults.potencia_teorica_MW)} MW</strong>
          </div>
          <div>
            <span className="text-slate-600 font-medium">Simulado / Teórico: </span>
            <strong className="text-blue-900">{formatoNumero(simulationResults.relacion_teorica_pct, 1)} %</strong>
          </div>
        </div>
      )}

      {/* 3. Barra doble "Simulado vs Real" si el sitio tiene producción publicada */}
      {tieneDatosReales && (
        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-600" />
              Comparación con Datos Reales Publicados
            </span>
            {difProdPct !== null && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                Math.abs(difProdPct) <= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Diferencia: {difProdPct > 0 ? `+${formatoNumero(difProdPct, 1)}` : formatoNumero(difProdPct, 1)} %
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            {/* Simulado */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Simulado:</span>
                <span className="font-bold text-slate-900">
                  {prodRealGWh !== undefined
                    ? `${formatoNumero(simulationResults.energia_anual_GWh, 1)} GWh/a`
                    : `${formatoEntero(simulationResults.energia_anual_MWh)} MWh/a`}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (simulationResults.factor_de_planta_pct / 35) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Factor de planta simulado: <strong>{formatoNumero(simulationResults.factor_de_planta_pct, 1)} %</strong>
              </div>
            </div>

            {/* Real */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Real publicado:</span>
                <span className="font-bold text-emerald-700">
                  {prodRealGWh !== undefined ? `${formatoNumero(prodRealGWh, 1)} GWh/a` : `${formatoEntero(prodRealMWh)} MWh/a`}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((cfReal || 25) / 35) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Factor de planta real: <strong>{formatoNumero(cfReal, 1)} %</strong> ({site.produccion_real?.fuente})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Gráfico Temporal (Recharts) */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            {isPresa && 'Nivel de Mar, Embalse y Potencia Generada (primeras 72 h)'}
            {isCorriente && 'Velocidad de Corriente y Potencia Generada (primeras 72 h)'}
            {isOlas && 'Altura de Oleaje y Potencia Instantánea (primeras 48 h)'}
          </span>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Exportar gráfico actual como imagen PNG para diapositivas"
          >
            <Download className="w-3 h-3 text-slate-600" />
            <span>Exportar PNG</span>
          </button>
        </div>

        <div ref={chartContainerRef} className="flex-1 w-full bg-slate-50/50 rounded-lg p-2 border border-slate-100">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={serieGrafico} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="t_horas" tick={{ fontSize: 10 }} unit=" h" />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                unit={isPresa ? ' m' : isCorriente ? ' m/s' : ' m'}
                stroke="#64748b"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                unit=" MW"
                stroke="#2563eb"
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                labelFormatter={(label) => `Tiempo: ${label} h`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

              {/* Curvas según tecnología */}
              {isPresa && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="nivel_mar" name="Nivel Mar [m]" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="nivel_embalse" name="Nivel Embalse [m]" stroke="#0284c7" dot={false} strokeWidth={2} strokeDasharray="4 2" />
                  <Line yAxisId="right" type="monotone" dataKey="potencia_MW" name="Potencia [MW]" stroke="#eab308" dot={false} strokeWidth={2.5} />
                </>
              )}

              {isCorriente && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="velocidad_corriente" name="Velocidad [m/s]" stroke="#0d9488" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="potencia_MW" name="Potencia [MW]" stroke="#eab308" dot={false} strokeWidth={2.5} />
                </>
              )}

              {isOlas && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="altura_ola" name="Altura Ola [m]" stroke="#ea580c" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="potencia_MW" name="Potencia [MW]" stroke="#eab308" dot={false} strokeWidth={2.5} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
