import React, { useEffect, useRef } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { Play, Pause, FastForward, Clock } from 'lucide-react';
import { formatoNumero } from '../utils/formatters';

export const SchematicAnimation: React.FC = () => {
  const {
    sitios,
    selectedSiteId,
    simulationResults,
    isPaused,
    togglePause,
    animSpeed,
    setAnimSpeed,
    simTimeSeconds,
    advanceSimTime,
  } = useSimulatorStore();

  const site = sitios.find((s) => s.id === selectedSiteId);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  // Ángulo acumulado del rotor de corriente (gira proporcional a la velocidad del agua)
  const rotorAngleRef = useRef<number>(0);
  const rotorLastRef = useRef<number>(performance.now());

  // Loop de animación fluido
  useEffect(() => {
    const loop = (now: number) => {
      const dtMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isPaused) {
        // Velocidad: 1 h/s = 3600 s/s; 6 h/s = 21600 s/s; 24 h/s = 86400 s/s
        const multiplier = animSpeed === 1 ? 3600 : animSpeed === 6 ? 21600 : 86400;
        const deltaSeconds = (dtMs / 1000) * multiplier;
        advanceSimTime(deltaSeconds);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPaused, animSpeed, advanceSimTime]);

  if (!site || !simulationResults) return null;

  // Encontrar el punto de la serie temporal más cercano al tiempo simulado actual
  const timeHours = (simTimeSeconds / 3600) % 72; // cíclico en 72 h para la vista esquemática
  const tSegundosCiclo = simTimeSeconds % (12.42 * 3600); // ciclo semidiurno M2
  const faseM2 = (2 * Math.PI * tSegundosCiclo) / (12.42 * 3600);

  // Valores instantáneos para la animación
  const diaSimulado = Math.floor(simTimeSeconds / 86400) + 1;
  const horaSimulada = Math.floor((simTimeSeconds % 86400) / 3600);
  const minutoSimulado = Math.floor((simTimeSeconds % 3600) / 60);

  // Animaciones por tecnología
  const isPresa = site.recurso === 'marea';
  const isCorriente = site.recurso === 'corriente';
  const isOlas = site.recurso === 'olas';

  // Variables dinámicas para presa
  // Sea level oscila entre -a/2 y +a/2
  const a_media = site.parametros.a_media?.valor || 8.17;
  const nivelMarM = (a_media / 2) * Math.cos(faseM2);
  // Basin level suavizado
  const nivelEmbalseM = (a_media / 2) * 0.7 * Math.cos(faseM2 - 1.2);
  const saltoM = Math.abs(nivelMarM - nivelEmbalseM);
  const generandoPresa = saltoM > 1.4;
  const flujoHaciaMar = nivelEmbalseM > nivelMarM;

  // Variables dinámicas para corriente
  const velCorriente = Math.abs(Math.sin(faseM2)) * 3.2;
  const flujoFlujo = Math.sin(faseM2) >= 0; // true: flujo (hacia der), false: reflujo (hacia izq)

  // Avance del rotor: 1 vuelta cada 3.5/v segundos reales (equivalente a la versión anterior)
  {
    const ahora = performance.now();
    const dt = Math.min(0.1, (ahora - rotorLastRef.current) / 1000);
    rotorLastRef.current = ahora;
    if (!isPaused && velCorriente > 0.8) {
      // Gira en un sentido con el flujo y en el opuesto con el reflujo, sin saltos
      const sentido = flujoFlujo ? 1 : -1;
      rotorAngleRef.current = (rotorAngleRef.current + sentido * dt * (360 * velCorriente) / 3.5) % 360;
    }
  }
  const rotorAngle = rotorAngleRef.current;

  // Variables dinámicas para olas
  const alturaOlaM = 2.0 + 0.8 * Math.sin((simTimeSeconds / 4) * Math.PI);
  // Movimiento oscilatorio de la columna o boya
  const faseOlaRapida = (simTimeSeconds * 2 * Math.PI) / 8; // período 8 s
  const desplazamientoVertical = Math.sin(faseOlaRapida); // -1 a 1
  const aireExhalando = Math.cos(faseOlaRapida) >= 0; // sube agua -> expulsa aire

  return (
    <div className="flex flex-col bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* Barra superior de controles de animación */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        {/* Reloj de tiempo simulado */}
        <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Día {diaSimulado}</span>
          <span className="text-blue-400 font-bold">
            {String(horaSimulada).padStart(2, '0')}:{String(minutoSimulado).padStart(2, '0')} h
          </span>
        </div>

        {/* Controles de velocidad y pausa */}
        <div className="flex items-center space-x-1">
          <button
            onClick={togglePause}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title={isPaused ? 'Reanudar animación (Espacio)' : 'Pausar animación (Espacio)'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={() => setAnimSpeed(1)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              animSpeed === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ×1 h/s
          </button>
          <button
            onClick={() => setAnimSpeed(6)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              animSpeed === 6 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ×6 h/s
          </button>
          <button
            onClick={() => setAnimSpeed(24)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              animSpeed === 24 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ×1 d/s
          </button>
        </div>
      </div>

      {/* Área del esquema SVG */}
      <div className="relative h-48 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* CASO 1: PRESA DE MAREA / LAGUNA */}
        {isPresa && (
          <svg viewBox="0 0 500 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
            {/* Cielo */}
            <rect width="500" height="200" fill="#0f172a" />

            {/* Niveles de agua dinámicos */}
            {/* Nivel del mar (lado izquierdo: x de 0 a 190) */}
            {/* Mapeamos nivelMarM [-7, 7] m a Y [140, 60] */}
            {(() => {
              const yMar = 100 - (nivelMarM / 8) * 35;
              const yEmb = 100 - (nivelEmbalseM / 8) * 35;
              return (
                <>
                  {/* Agua del mar */}
                  <rect x="0" y={yMar} width="200" height={200 - yMar} fill="#1e40af" opacity="0.85" />
                  <line x1="0" y1={yMar} x2="200" y2={yMar} stroke="#60a5fa" strokeWidth="2" />
                  <text x="15" y={yMar - 8} fill="#93c5fd" fontSize="10" fontWeight="bold">
                    Mar abierto ({nivelMarM >= 0 ? `+${nivelMarM.toFixed(1)}` : nivelMarM.toFixed(1)} m)
                  </text>

                  {/* Agua del embalse (lado derecho: x de 300 a 500) */}
                  <rect x="300" y={yEmb} width="200" height={200 - yEmb} fill="#0369a1" opacity="0.85" />
                  <line x1="300" y1={yEmb} x2="500" y2={yEmb} stroke="#38bdf8" strokeWidth="2" />
                  <text x="330" y={yEmb - 8} fill="#7dd3fc" fontSize="10" fontWeight="bold">
                    {site.tecnologia === 'Laguna de marea' ? 'Laguna' : 'Embalse'} ({nivelEmbalseM >= 0 ? `+${nivelEmbalseM.toFixed(1)}` : nivelEmbalseM.toFixed(1)} m)
                  </text>

                  {/* Dique central de hormigón */}
                  <polygon points="190,40 310,40 330,200 170,200" fill="#334155" stroke="#475569" strokeWidth="2" />
                  {/* Carretera sobre el dique */}
                  <rect x="190" y="36" width="120" height="6" fill="#64748b" />
                  <line x1="200" y1="39" x2="300" y2="39" stroke="#f8fafc" strokeWidth="1" strokeDasharray="6 4" />

                  {/* Conducto subacuático para turbina bulbo */}
                  <rect x="180" y="130" width="140" height="40" fill="#1e293b" rx="4" />

                  {/* Turbina Bulbo giratoria */}
                  <g transform="translate(250, 150)">
                    {/* Bulbo estator */}
                    <ellipse cx="0" cy="0" rx="16" ry="12" fill="#64748b" />
                    {/* Aspas con rotación continua (rotación SVG nativa sobre su propio eje) */}
                    <g>
                      {generandoPresa && (
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 0 0"
                          to="360 0 0"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      )}
                      <line x1="-14" y1="0" x2="14" y2="0" stroke="#facc15" strokeWidth="3" />
                      <line x1="0" y1="-14" x2="0" y2="14" stroke="#facc15" strokeWidth="3" />
                    </g>
                  </g>

                  {/* Flechas de flujo */}
                  {generandoPresa && (
                    <g fill="#38bdf8">
                      {flujoHaciaMar ? (
                        /* Flujo embalse -> mar (vaciado) */
                        <>
                          <path d="M 330 150 L 315 145 L 315 155 Z" />
                          <path d="M 180 150 L 165 145 L 165 155 Z" />
                          <text x="215" y="122" fill="#facc15" fontSize="9" fontWeight="bold">GENERANDO</text>
                        </>
                      ) : (
                        /* Flujo mar -> embalse (llenado) */
                        <>
                          <path d="M 165 150 L 180 145 L 180 155 Z" />
                          <path d="M 315 150 L 330 145 L 330 155 Z" />
                          <text x="215" y="122" fill="#facc15" fontSize="9" fontWeight="bold">GENERANDO</text>
                        </>
                      )}
                    </g>
                  )}

                  {!generandoPresa && (
                    <text x="215" y="122" fill="#94a3b8" fontSize="9" fontWeight="bold">EN ESPERA</text>
                  )}
                </>
              );
            })()}
          </svg>
        )}

        {/* CASO 2: CORRIENTES DE MAREA */}
        {isCorriente && (
          <svg viewBox="0 0 500 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
            <rect width="500" height="200" fill="#042f2e" />
            {/* Lecho marino rocoso */}
            <polygon points="0,175 500,175 500,200 0,200" fill="#134e4a" />

            {/* Estructura gravitacional trípode de fijación */}
            <polygon points="230,175 270,175 255,110 245,110" fill="#334155" stroke="#475569" strokeWidth="2" />
            {/* Góndola de la turbina */}
            <rect x="235" y="95" width="40" height="18" rx="4" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

            {/* Rotor giratorio: el grupo externo posiciona, el interno gira sobre su eje */}
            <g transform="translate(235, 104)">
            <g transform={`rotate(${rotorAngle.toFixed(1)})`}>
              {/* 3 palas simétricas */}
              <line x1="0" y1="0" x2="0" y2="-45" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="0" x2="39" y2="22" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="0" x2="-39" y2="22" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
              <circle cx="0" cy="0" r="5" fill="#facc15" />
            </g>
            </g>

            {/* Flechas de flujo de corriente reversibles */}
            <g opacity="0.7">
              {flujoFlujo ? (
                /* Flujo hacia la derecha (Flujo) */
                <>
                  <path d="M 60 70 L 140 70 M 130 65 L 140 70 L 130 75" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <path d="M 360 70 L 440 70 M 430 65 L 440 70 L 430 75" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <path d="M 100 135 L 180 135 M 170 130 L 180 135 L 170 140" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <text x="20" y="30" fill="#5eead4" fontSize="11" fontWeight="bold">
                    Corriente de marea: FLUJO (hacia el este) — {velCorriente.toFixed(1)} m/s
                  </text>
                </>
              ) : (
                /* Reflujo hacia la izquierda */
                <>
                  <path d="M 140 70 L 60 70 M 70 65 L 60 70 L 70 75" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <path d="M 440 70 L 360 70 M 370 65 L 360 70 L 370 75" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <path d="M 180 135 L 100 135 M 110 130 L 100 135 L 110 140" stroke="#5eead4" strokeWidth="2.5" fill="none" />
                  <text x="20" y="30" fill="#5eead4" fontSize="11" fontWeight="bold">
                    Corriente de marea: REFLUJO (hacia el oeste) — {velCorriente.toFixed(1)} m/s
                  </text>
                </>
              )}
            </g>
          </svg>
        )}

        {/* CASO 3: OLAS - COLUMNA DE AGUA OSCILANTE (OWC) */}
        {isOlas && site.tecnologia === 'Columna de agua oscilante' && (
          <svg viewBox="0 0 500 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
            <rect width="500" height="200" fill="#1c1917" />
            {/* Rompeolas / Acantilado de hormigón */}
            <polygon points="260,30 380,30 400,200 240,200" fill="#44403c" stroke="#57534e" strokeWidth="2" />
            {/* Pared frontal semi-sumergida de la cámara OWC */}
            <polygon points="170,80 200,80 200,155 170,155" fill="#44403c" stroke="#57534e" strokeWidth="1.5" />
            {/* Techo de la cámara */}
            <polygon points="170,30 260,30 260,45 170,45" fill="#44403c" />

            {/* Nivel de agua interior oscilante: varía con desplazamientoVertical */}
            {(() => {
              const yWaterInner = 135 - desplazamientoVertical * 22;
              return (
                <>
                  {/* Agua exterior con olas sinusoidales */}
                  <path
                    d={`M 0 135 Q 40 ${135 - desplazamientoVertical * 15} 80 135 T 170 ${yWaterInner} L 170 200 L 0 200 Z`}
                    fill="#0284c7"
                    opacity="0.8"
                  />
                  {/* Agua interior de la columna */}
                  <rect x="200" y={yWaterInner} width="40" height={200 - yWaterInner} fill="#0284c7" opacity="0.9" />

                  {/* Ducto de aire vertical superior */}
                  <rect x="220" y="15" width="22" height="30" fill="#292524" stroke="#78716c" strokeWidth="1" />

                  {/* Turbina Wells dentro del ducto: SIEMPRE gira en el mismo sentido */}
                  <g transform="translate(231, 30)">
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to="360 0 0"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                    <line x1="-9" y1="0" x2="9" y2="0" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                    <line x1="0" y1="-9" x2="0" y2="9" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  </g>
                  </g>

                  {/* Flechas de flujo de aire bidireccional */}
                  {aireExhalando ? (
                    <g fill="#fdba74">
                      {/* Aire saliendo hacia arriba */}
                      <path d="M 231 10 L 226 18 L 236 18 Z" />
                      <text x="248" y="24" fill="#fb923c" fontSize="10" fontWeight="bold">
                        Expulsión de aire ↑
                      </text>
                    </g>
                  ) : (
                    <g fill="#93c5fd">
                      {/* Aire entrando hacia abajo */}
                      <path d="M 231 18 L 226 10 L 236 10 Z" />
                      <text x="248" y="24" fill="#38bdf8" fontSize="10" fontWeight="bold">
                        Aspiración de aire ↓
                      </text>
                    </g>
                  )}

                  <text x="20" y="25" fill="#f97316" fontSize="10" fontWeight="bold">
                    Turbina Wells: Giro auto-rectificante unidireccional
                  </text>
                </>
              );
            })()}
          </svg>
        )}

        {/* CASO 4: OTROS DISPOSITIVOS DE OLAS (Absorbedor puntual / Atenuador) */}
        {isOlas && site.tecnologia !== 'Columna de agua oscilante' && (
          <svg viewBox="0 0 500 200" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
            <rect width="500" height="200" fill="#0c4a6e" />
            {/* Superficie del agua ondulante */}
            {(() => {
              const yCenter = 120;
              const yFloat = yCenter + desplazamientoVertical * 18;
              return (
                <>
                  {/* Agua de mar */}
                  <path
                    d={`M 0 ${yCenter} Q 80 ${yCenter + desplazamientoVertical * 20} 160 ${yCenter} T 320 ${yCenter} T 500 ${yCenter} L 500 200 L 0 200 Z`}
                    fill="#0284c7"
                    opacity="0.8"
                  />

                  {/* Boya flotante / Brazo articulado */}
                  <g transform={`translate(250, ${yFloat})`}>
                    {/* Cuerpo boya */}
                    <circle cx="0" cy="0" r="22" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                    <text x="-12" y="4" fill="white" fontSize="9" fontWeight="bold">PTO</text>
                    {/* Brazo anclado al fondo */}
                    <line x1="0" y1="0" x2="-60" y2={180 - yFloat} stroke="#cbd5e1" strokeWidth="4" />
                    {/* Cilindro hidráulico telescópico */}
                    <rect x="-35" y={40} width="8" height="24" fill="#facc15" rx="2" />
                  </g>

                  {/* Anclaje en el lecho marino */}
                  <rect x="180" y="180" width="30" height="15" fill="#475569" rx="2" />

                  <text x="20" y="25" fill="#fdba74" fontSize="11" fontWeight="bold">
                    Movimiento vertical del oleaje (H = {alturaOlaM.toFixed(1)} m) → Bombeo hidráulico
                  </text>
                </>
              );
            })()}
          </svg>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
