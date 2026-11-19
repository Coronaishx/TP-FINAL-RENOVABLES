import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { formatoNumero, formatoEntero } from '../utils/formatters';
import { calcularPotenciaTeoricaPresaKW } from '../engine/tide';
import { MapPin, ArrowRight, ShieldAlert, Sparkles, Anchor, Waves } from 'lucide-react';

export const TabArgentina: React.FC = () => {
  const { sitios, selectSite } = useSimulatorStore();

  const sitiosArgentina = sitios.filter((s) => s.pais.includes('Argentina'));

  // Sitios de marea patagónicos con cota teórica calculada
  const sitiosMarea = sitiosArgentina.filter((s) => s.recurso === 'marea').map((s) => {
    const a = s.parametros.a_media?.valor || 5.0;
    const A = s.parametros.A_km2?.valor || 100;
    const P_teorica_kW = calcularPotenciaTeoricaPresaKW(A, a);
    const P_teorica_MW = P_teorica_kW / 1000;

    return {
      ...s,
      a_media: a,
      A_km2: A,
      P_est_MW: s.parametros.potencia_estimada_MW?.valor || 'sin dato',
      Prod_est_GWh: s.parametros.produccion_estimada_GWh?.valor || 'sin dato',
      P_teorica_MW: Math.round(P_teorica_MW),
    };
  });

  const sitioOlasUTN = sitiosArgentina.find((s) => s.id === 'mar-del-plata-utn');

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabecera de la sección argentina */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-sky-700 mb-2">
          <Anchor className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Capítulo Nacional</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Potencial Mareomotriz y Undimotriz en la Costa Argentina
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          La costa patagónica posee uno de los regímenes macromareales más energéticos del mundo, concentrado en los golfos
          de la Península Valdés y los estuarios de Santa Cruz. Hacé clic en cualquier sitio para cargarlo directamente en el simulador.
        </p>
      </div>

      {/* Tabla comparativa de sitios de marea argentinos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">
            Emplazamientos Mareomotrices Patagónicos (Sección 6.3)
          </h2>
          <span className="text-[11px] text-slate-500">
            Cota Teórica = 226 · A · a² [kW]
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Emplazamiento</th>
                <th className="px-4 py-3">Amplitud media (a)</th>
                <th className="px-4 py-3">Superficie (A)</th>
                <th className="px-4 py-3">Potencia Estimada</th>
                <th className="px-4 py-3">Producción Estimada</th>
                <th className="px-4 py-3 text-blue-900 font-bold bg-blue-50/50">Cota Teórica (226·A·a²)</th>
                <th className="px-6 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sitiosMarea.map((sitio) => (
                <tr
                  key={sitio.id}
                  onClick={() => selectSite(sitio.id)}
                  className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                    {sitio.nombre}
                  </td>
                  <td className="px-4 py-3.5 font-mono">{formatoNumero(sitio.a_media, 1)} m</td>
                  <td className="px-4 py-3.5 font-mono">{formatoEntero(sitio.A_km2)} km²</td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                    {sitio.P_est_MW !== 'sin dato' ? `${formatoEntero(sitio.P_est_MW)} MW` : 'sin dato'}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-emerald-700">
                    {sitio.Prod_est_GWh !== 'sin dato' ? `${formatoEntero(sitio.Prod_est_GWh)} GWh/a` : 'sin dato'}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-blue-900 bg-blue-50/40">
                    {formatoEntero(sitio.P_teorica_MW)} MW
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:text-blue-800">
                      Simular presa <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjeta destacada: Prototipo UTN Mar del Plata (Olas) */}
      {sitioOlasUTN && (
        <div
          onClick={() => selectSite(sitioOlasUTN.id)}
          className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 rounded-xl p-6 cursor-pointer hover:border-orange-300 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Waves className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Recurso Undimotriz y Prototipo UTN Mar del Plata (Escollera Norte)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-600 text-white shadow-xs">
              Proyecto Argentino en Marcha (Convenio 2025)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Recurso Costa Bonaerense</span>
              <p className="font-mono text-sm font-bold text-orange-950">2,3 a 7,5 kW/m</p>
              <p className="text-[11px] text-slate-600 mt-1">4,3 kW/m medio en Mar del Plata. Máximos de hasta 69 kW/m en Punta Médanos (Lanfredi et al., 1992).</p>
            </div>

            <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Prototipo Escollera Norte</span>
              <p className="font-mono text-sm font-bold text-orange-950">Hasta 30 kW / unidad</p>
              <p className="text-[11px] text-slate-600 mt-1">Convenio octubre 2025 (PBA, UTN, PROINGED, FREBA). Ensayos 1:20 y 1:10 en el INA (Carreras, 2015).</p>
            </div>

            <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Cálculo Físico Clave</span>
              <p className="font-mono text-sm font-bold text-orange-950">≈ 7 m de frente de ola</p>
              <p className="text-[11px] text-slate-600 mt-1">Con 4,3 kW/m, para 30 kW nominales se debe captar toda la potencia de 6,98 m de cresta marina.</p>
            </div>
          </div>
        </div>
      )}

      {/* Ficha técnica y ambiental de la Península Valdés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            La singularidad del Istmo Carlos Ameghino (Península Valdés)
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Una franja de tierra de solo <strong>5 a 7 km de ancho</strong> separa los golfos San José (al norte) y Nuevo (al sur).
            La onda de marea tarda aproximadamente <strong>5 horas en rodear la península</strong>, generando un desnivel hidráulico
            casi permanente entre ambos golfos.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Las propuestas históricas estimaron del orden de <strong>20 GW</strong> y, en otra variante de menor escala, unos <strong>8 GW</strong>.
            Sin embargo, nunca se concretaron debido a los astronómicos costos de inversión y al riesgo crítico sobre el santuario
            de reproducción de la <strong>ballena franca austral</strong> (Patrimonio de la Humanidad UNESCO).
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Iniciativas Nacionales: ENARSA, Y-TEC e INVAP
          </h4>
          <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
            <li>
              <strong>Memorando ENARSA–RusHydro:</strong> Propuso el desarrollo de centrales en los estuarios patagónicos
              (ríos Santa Cruz, Gallegos y Deseado) por un total conjunto de ≈ 1.000 MW.
            </li>
            <li>
              <strong>Campañas de Medición Y-TEC / UTN:</strong> Despliegue de boyas oceanográficas y correntómetros ADCP en el
              río Gallegos y en el Estrecho de Magallanes.
            </li>
            <li>
              <strong>Turbina Hidrocinética INVAP:</strong> Proyecto de desarrollo tecnológico nacional para turbinas de corriente
              marina y fluvial sin necesidad de represa.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
