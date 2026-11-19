import React, { useEffect, useRef } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { X, QrCode, BookOpen, GraduationCap, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

export const ModalAcercaDe: React.FC = () => {
  const { modalAcercaDeOpen, setModalAcercaDeOpen } = useSimulatorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (modalAcercaDeOpen && canvasRef.current) {
      const url = window.location.href || 'http://localhost:5173';
      QRCode.toCanvas(canvasRef.current, url, {
        width: 160,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }, (error) => {
        if (error) console.error('Error generando QR local:', error);
      });
    }
  }, [modalAcercaDeOpen]);

  if (!modalAcercaDeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="panel-mar max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 panel-mar-header">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Acerca del Proyecto y Fuentes Bibliográficas
            </h2>
          </div>
          <button
            onClick={() => setModalAcercaDeOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Tarjeta contexto académico y QR */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Universidad Nacional de San Martín (UNSAM)
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Energías Renovables I — Ingeniería en Energía
              </h3>
              <p className="text-xs text-slate-600">
                Simulador interactivo desarrollado para la exposición oral del <strong>19/11/2026</strong>.
                Objetivo pedagógico: evidenciar la distancia real entre el potencial teórico del mar y lo que entregan
                las centrales comerciales.
              </p>
              <p className="text-[11px] text-slate-500 italic">
                Regla de oro: No inventar datos. Todo valor numérico proviene de fuentes académicas o se rotula como supuesto ajustable calibrado.
              </p>
            </div>

            {/* Código QR generado localmente sin conexión */}
            <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
              <canvas ref={canvasRef} className="rounded" />
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 mt-1.5">
                <QrCode className="w-3 h-3 text-blue-600" />
                <span>Escanear desde celular</span>
              </div>
            </div>
          </div>

          {/* Lista completa de fuentes bibliográficas (Sección 7) */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-700" />
              Bibliografía y Fuentes Publicadas (Sección 7)
            </h4>

            <ul className="space-y-2.5 text-[11px] text-slate-700 divide-y divide-slate-100">
              <li className="pt-2">
                <strong>Carreras, G. A. (2015).</strong> <em>Energías renovables marinas. Una alternativa sustentable para contribuir a la satisfacción de las futuras demandas energéticas</em>. Universidad Tecnológica Nacional (UTN), Facultad Regional Mar del Plata.
              </li>
              <li className="pt-2">
                <strong>Cátedra de Energías Renovables I (2026).</strong> <em>Clase 01: Recursos oceánicos y tecnologías de aprovechamiento marino</em>. UNSAM, Escuela de Hábitat y Sostenibilidad.
              </li>
              <li className="pt-2">
                <strong>Clark, G. (2018).</strong> <em>Proposed Swansea Bay tidal lagoon</em>. Department for Business, Energy and Industrial Strategy, Gobierno del Reino Unido.
              </li>
              <li className="pt-2">
                <strong>Comisión Europea (2020).</strong> <em>Estrategia de la UE para aprovechar el potencial de las energías renovables marinas en pos de un futuro climáticamente neutro</em> (COM(2020) 741 final). Bruselas.
              </li>
              <li className="pt-2">
                <strong>EMEC - European Marine Energy Centre (2024).</strong> <em>Six tidal stream projects successful in the UK's latest renewable auctions (Allocation Round 6)</em>. Orkney, Reino Unido.
              </li>
              <li className="pt-2">
                <strong>Fernández Díez, P. (s.f.).</strong> <em>Energía maremotriz</em>. Departamento de Ingeniería Eléctrica y Energética, Universidad de Cantabria.
              </li>
              <li className="pt-2">
                <strong>Leyes de la República Argentina:</strong> Ley N.° 26.190 (2006, Régimen de fomento para el uso de fuentes renovables), Ley N.° 27.191 (2015, Modificatoria y metas renovables) y Ley General del Ambiente N.° 25.675 (2002).
              </li>
              <li className="pt-2">
                <strong>Provincia de Buenos Aires (2025).</strong> <em>La Provincia desarrolla el primer dispositivo de energía undimotriz del país</em>. Convenio Subsecretaría de Energía, UTN Mar del Plata, PROINGED y FREBA.
              </li>
              <li className="pt-2">
                <strong>Quintero González, J. R. y Quintero González, L. E. (2015).</strong> Energía mareomotriz: potencial energético y medio ambiente. <em>Gestión y Ambiente, 18</em>(2), 121–134.
              </li>
              <li className="pt-2">
                <strong>REN21 (2025).</strong> <em>Renewables 2025 Global Status Report: Ocean Power Chapter</em>. Paris: REN21 Secretariat.
              </li>
              <li className="pt-2">
                <strong>Tidal Lagoon Power (2019).</strong> <em>Swansea Bay Tidal Lagoon: Project documentation and technical parameters</em>.
              </li>
            </ul>
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>Funcionamiento 100% offline — Mapas y QR locales</span>
          <button
            onClick={() => setModalAcercaDeOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
