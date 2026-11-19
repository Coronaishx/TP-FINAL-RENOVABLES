import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { X, Scale, Leaf, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const ModalFicha: React.FC = () => {
  const { sitios, selectedSiteId, modalFichaOpen, setModalFichaOpen } = useSimulatorStore();

  if (!modalFichaOpen) return null;
  const site = sitios.find((s) => s.id === selectedSiteId);
  if (!site) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="panel-mar max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Cabecera modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 panel-mar-header">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Ficha Técnica, Regulatoria y Ambiental
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {site.nombre}
              <span className="text-xs font-normal text-slate-500">({site.pais})</span>
            </h2>
          </div>
          <button
            onClick={() => setModalFichaOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Descripción general */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Descripción General
            </h3>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{site.descripcion}</p>
          </div>

          {/* Parámetros técnicos y fuentes */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Trazabilidad de Parámetros Numéricos
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2">Parámetro</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Estado / Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(site.parametros).map(([k, p]: [string, any]) => (
                    <tr key={k} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-medium text-slate-800">{k}</td>
                      <td className="px-3 py-1.5 font-mono">{String(p.valor)} {p.unidad !== 'adimensional' && p.unidad !== 'modo' && p.unidad !== 'tipo' ? p.unidad : ''}</td>
                      <td className="px-3 py-1.5">
                        {p.supuesto ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Supuesto ajustable ({p.explicacion || 'calibrado'})
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">{p.fuente}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marco regulatorio */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-purple-600" />
              Marco Regulatorio
            </h3>
            <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-lg text-purple-950">
              <p>{site.ficha_regulatoria}</p>
            </div>
          </div>

          {/* Impacto ambiental */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" />
              Impacto Ambiental y Ciclo de Vida
            </h3>
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-950">
              <p>{site.ficha_ambiental}</p>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setModalFichaOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Cerrar ficha
          </button>
        </div>
      </div>
    </div>
  );
};
