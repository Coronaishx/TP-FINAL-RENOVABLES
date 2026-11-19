import React, { useMemo } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { formatoNumero } from '../utils/formatters';
import { simularPresa } from '../engine/barrage';
import { simularCorrienteMarea } from '../engine/stream';
import { simularOlas } from '../engine/waves';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Award, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export const TabComparar: React.FC = () => {
  const { sitios, selectSite } = useSimulatorStore();

  // Filtramos sitios con producción real publicada
  const sitiosConReal = useMemo(() => {
    return sitios.filter((s) => s.produccion_real !== null && s.produccion_real !== undefined);
  }, [sitios]);

  // Calculamos los datos comparativos simulados para cada preset
  const dataComparativa = useMemo(() => {
    return sitiosConReal.map((site) => {
      let cfSimulado = 0;
      let eSimuladaGWh = 0;

      if (site.recurso === 'marea') {
        const res = simularPresa({
          A_km2: site.parametros.A_km2?.valor || 17,
          N: site.parametros.N?.valor || 24,
          P_nom_MW: site.parametros.P_nom_MW?.valor || 10,
          Q_nom: site.parametros.Q_nom?.valor || 275,
          H_min: site.parametros.H_min?.valor || 1.5,
          H_start: site.parametros.H_start?.valor || 3.5,
          eta_t: site.parametros.eta_t?.valor || 0.88,
          A_c: site.parametros.A_c?.valor || 600,
          C_d: site.parametros.C_d?.valor || 0.75,
          modo: site.parametros.modo?.valor || 'doble_bombeo',
          deltaZ_bombeo: site.parametros.deltaZ_bombeo?.valor || 1.0,
          eta_b: site.parametros.eta_b?.valor || 0.70,
          a_media: site.parametros.a_media?.valor || 8.17,
          k: site.parametros.k?.valor || 0.15,
        });
        cfSimulado = res.factor_de_planta_pct;
        eSimuladaGWh = res.energia_anual_GWh;
      } else if (site.recurso === 'corriente') {
        const res = simularCorrienteMarea({
          N: site.parametros.N?.valor || 4,
          D: site.parametros.D?.valor || 18,
          C_p: site.parametros.C_p?.valor || 0.42,
          eta_tren: site.parametros.eta_tren?.valor || 0.88,
          v_arranque: site.parametros.v_arranque?.valor || 1.0,
          v_max: site.parametros.v_max?.valor || 3.25,
          P_nom_MW: site.parametros.P_nom_MW?.valor || 1.5,
          disponibilidad: site.parametros.disponibilidad?.valor || 0.92,
          k: site.parametros.k?.valor || 0.18,
        });
        cfSimulado = res.factor_de_planta_pct;
        eSimuladaGWh = res.energia_anual_GWh;
      } else {
        // Olas (Mutriku)
        const res = simularOlas({
          tipo_recurso: 'medio',
          tipo_ola: 'irregular',
          potencia_recurso_kW_m: site.parametros.potencia_recurso_kW_m?.valor || 16.5,
          N: site.parametros.N?.valor || 16,
          B: site.parametros.B?.valor || 4.5,
          CWR: site.parametros.CWR?.valor || 0.28,
          eta_PTO: site.parametros.eta_PTO?.valor || 0.44,
          P_nom_kW: site.parametros.P_nom_kW?.valor || 18.5,
        });
        cfSimulado = res.factor_de_planta_pct;
        eSimuladaGWh = res.energia_anual_GWh;
      }

      const cfReal = site.produccion_real?.factor_de_planta_calculado_pct || 0;
      const difPct = ((cfSimulado - cfReal) / cfReal) * 100;

      return {
        id: site.id,
        nombre: site.nombre,
        tecnologia: site.tecnologia,
        pais: site.pais,
        potencia_MW: site.parametros.P_total_MW?.valor || (site.parametros.P_total_kW?.valor ? site.parametros.P_total_kW.valor / 1000 : 0.296),
        produccion_real_anual: site.produccion_real?.valor_anual_GWh
          ? `${formatoNumero(site.produccion_real.valor_anual_GWh, 1)} GWh/a`
          : `${site.produccion_real?.valor_anual_MWh} MWh/a`,
        cfReal: Math.round(cfReal * 10) / 10,
        cfSimulado: Math.round(cfSimulado * 10) / 10,
        difPct: Math.round(difPct * 10) / 10,
        fuente: site.produccion_real?.fuente,
      };
    });
  }, [sitiosConReal]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado de la pestaña */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <Award className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Conclusión Pedagógica</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Comparativa: Factor de Planta Real vs. Simulado
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Evidencia empírica sobre las cuatro centrales marinas operativas con datos de generación anual publicados.
          Demuestra la brecha entre el potencial teórico del recurso oceánico y la energía eléctrica real entregada a la red.
        </p>
      </div>

      {/* Gráfico comparativo de barras */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Factor de Planta (%): Producción Real Publicada vs. Preset Calibrado
        </h2>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataComparativa} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="#334155" />
              <YAxis unit=" %" domain={[0, 35]} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                formatter={(value: any) => [`${value} %`, '']}
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="cfReal" name="Factor de Planta Real (Publicado)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cfSimulado" name="Factor de Planta Simulado (Calibrado)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla comparativa de detalle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm">
            Tabla de Validación de Centrales Existentes
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Central</th>
                <th className="px-4 py-3">Tecnología</th>
                <th className="px-4 py-3">Potencia</th>
                <th className="px-4 py-3">Producción Real</th>
                <th className="px-4 py-3 text-emerald-800 font-bold">FP Real</th>
                <th className="px-4 py-3 text-blue-800 font-bold">FP Simulado</th>
                <th className="px-4 py-3">Diferencia</th>
                <th className="px-6 py-3">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dataComparativa.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => selectSite(row.id)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    {row.nombre}
                    <span className="text-[10px] text-slate-400 font-normal">({row.pais})</span>
                  </td>
                  <td className="px-4 py-3.5">{row.tecnologia}</td>
                  <td className="px-4 py-3.5 font-mono">{formatoNumero(row.potencia_MW, 1)} MW</td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-emerald-700">{row.produccion_real_anual}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-700 text-sm">{formatoNumero(row.cfReal, 1)} %</td>
                  <td className="px-4 py-3.5 font-bold text-blue-700 text-sm">{formatoNumero(row.cfSimulado, 1)} %</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      Math.abs(row.difPct) <= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {row.difPct > 0 ? `+${formatoNumero(row.difPct, 1)}` : formatoNumero(row.difPct, 1)} %
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-[11px]">{row.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cuadro de conclusiones clave para la exposición */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <h4 className="font-bold text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            ¿Por qué el Factor de Planta es de 19% a 26% en mareas?
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Las mareas siguen un ciclo semidiurno (12,42 h) y una modulación quincenal entre mareas vivas y muertas.
            Una presa solo puede turbinar durante el desnivel hidráulico útil (entre 3 a 5 horas por marea), permaneciendo
            el resto del ciclo en llenado o espera con compuertas abiertas. El factor de planta promedio se sitúa entre el
            <strong> 24% y 26%</strong>.
          </p>
        </div>

        <div className="p-5 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
          <h4 className="font-bold text-teal-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600" />
            La brecha en convertidores de olas (Mutriku ≈ 8%)
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            En oleaje, las turbinas Wells y tomas de fuerza deben soportar tormentas extremas pero generar con oleajes moderados.
            La dispersión estacional del espectro marino y los rendimientos acoplados hidrodinámico-neumático-eléctrico
            hacen que una planta en rompeolas como Mutriku alcance un factor de planta del <strong>8,1%</strong> anual.
          </p>
        </div>
      </div>
    </div>
  );
};
