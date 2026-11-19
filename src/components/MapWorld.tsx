import React, { useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import countriesData from '../data/countries-110m.json';
import { useSimulatorStore, SitioData } from '../store/simulatorStore';
import { Compass, MapPin } from 'lucide-react';

const RECURSO_LABEL: Record<string, string> = {
  marea: 'Marea',
  corriente: 'Corriente',
  olas: 'Olas',
};

export const MapWorld: React.FC = () => {
  const { sitios, selectedSiteId, selectSite } = useSimulatorStore();
  const [zoomLevel, setZoomLevel] = useState<'world' | 'argentina'>('world');
  const [hoveredSite, setHoveredSite] = useState<SitioData | null>(null);

  // Proporción ajustada al mapamundi sin Antártida: elimina las franjas vacías
  const width = 800;
  const height = 400;

  // Países sin la Antártida (ocupa mucho espacio y no tiene sitios)
  const geojson = useMemo(() => {
    const countries = (countriesData as any).objects.countries;
    const fc = topojson.feature(countriesData as any, countries) as any;
    return {
      ...fc,
      features: fc.features.filter((f: any) => f.properties?.name !== 'Antarctica'),
    };
  }, []);

  // Proyección D3: el mundo se ajusta exactamente al recuadro
  const projection = useMemo(() => {
    if (zoomLevel === 'argentina') {
      return geoNaturalEarth1()
        .scale(1100)
        .center([-63, -44])
        .translate([width / 2, height / 2]);
    }
    return geoNaturalEarth1().fitExtent(
      [
        [6, 6],
        [width - 6, height - 6],
      ],
      geojson
    );
  }, [zoomLevel, geojson]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const getMarkerColor = (recurso: string, isSelected: boolean) => {
    if (isSelected) return '#facc15'; // Amarillo destacado de selección
    if (recurso === 'marea') return '#2563eb'; // Azul marea
    if (recurso === 'corriente') return '#0d9488'; // Teal corriente
    return '#ea580c'; // Naranja olas
  };

  const dotClass = (recurso: string) =>
    recurso === 'marea' ? 'bg-blue-600' : recurso === 'corriente' ? 'bg-teal-600' : 'bg-orange-600';

  const sitiosVisibles =
    zoomLevel === 'argentina' ? sitios.filter((s) => s.pais.includes('Argentina')) : sitios;

  return (
    <div className="panel-mar relative flex flex-col h-full overflow-hidden">
      {/* Barra superior de controles del mapa */}
      <div className="panel-mar-header flex items-center justify-between px-3 py-2 z-10 gap-1">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Compass className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider truncate">
            {zoomLevel === 'world' ? (
              <>
                <span className="sm:hidden">Mapa Global</span>
                <span className="hidden sm:inline">Mapa Global de Emplazamientos</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Costa Argentina</span>
                <span className="hidden sm:inline">Costa Patagónica y Mar Argentino</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setZoomLevel('world')}
            className={`px-2 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              zoomLevel === 'world'
                ? 'bg-cyan-700 text-white'
                : 'bg-white/70 text-slate-700 hover:bg-white border border-cyan-200'
            }`}
            title="Ver mapa mundial completo"
          >
            Mundo
          </button>
          <button
            onClick={() => setZoomLevel('argentina')}
            className={`px-2 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              zoomLevel === 'argentina'
                ? 'bg-cyan-700 text-white'
                : 'bg-white/70 text-slate-700 hover:bg-white border border-cyan-200'
            }`}
            title="Zoom a la costa argentina y patagónica"
          >
            <span className="sm:hidden">🇦🇷 Arg.</span>
            <span className="hidden sm:inline">🇦🇷 Zoom Argentina</span>
          </button>
        </div>
      </div>

      {/* Área interactiva del mapa SVG: altura proporcional, sin espacio vacío */}
      <div className="relative w-full shrink-0" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="oceano" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f7fa" />
              <stop offset="100%" stopColor="#b2ebf2" />
            </linearGradient>
          </defs>

          {/* Fondo oceánico */}
          <rect width={width} height={height} fill="url(#oceano)" />

          {/* Ecuador sutil */}
          <line
            x1="0"
            y1={projection([0, 0])?.[1] ?? height / 2}
            x2={width}
            y2={projection([0, 0])?.[1] ?? height / 2}
            stroke="#80deea"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />

          {/* Tierras / Países en tono arena */}
          <g className="countries">
            {geojson.features.map((feature: any, idx: number) => (
              <path
                key={idx}
                d={pathGenerator(feature) || ''}
                fill="#efe2c4"
                stroke="#d6c296"
                strokeWidth={0.6}
                className="transition-colors hover:fill-[#e6d3a8]"
              />
            ))}
          </g>

          {/* Marcadores de sitios */}
          <g className="markers">
            {sitios.map((site) => {
              const coords = projection([site.lon, site.lat]);
              if (!coords) return null;
              const [cx, cy] = coords;

              if (cx < -20 || cx > width + 20 || cy < -20 || cy > height + 20) return null;

              const isSelected = site.id === selectedSiteId;
              const color = getMarkerColor(site.recurso, isSelected);
              const zoomArg = zoomLevel === 'argentina';

              return (
                <g
                  key={site.id}
                  className="cursor-pointer group"
                  onClick={() => selectSite(site.id)}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                >
                  {/* Área táctil ampliada para celulares */}
                  <circle cx={cx} cy={cy} r={14} fill="transparent" />

                  {isSelected && (
                    // Halo pulsante centrado en el propio punto (animación SVG nativa)
                    <circle cx={cx} cy={cy} r={zoomArg ? 10 : 7.5} fill={color} opacity={0.5} pointerEvents="none">
                      <animate
                        attributeName="r"
                        values={zoomArg ? '10;22' : '7.5;16'}
                        dur="1.4s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.55;0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? (zoomArg ? 10 : 7.5) : zoomArg ? 7 : 5.5}
                    fill="white"
                    stroke="#0f3d4a"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <circle cx={cx} cy={cy} r={isSelected ? (zoomArg ? 7 : 5) : zoomArg ? 5 : 3.8} fill={color} />

                  {(zoomArg || isSelected) && (
                    <text
                      x={cx + (zoomArg ? 12 : 10)}
                      y={cy + 4}
                      className="text-[13px] font-semibold fill-slate-800 pointer-events-none"
                      style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 3 }}
                    >
                      {site.nombre}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip flotante al pasar el mouse (solo escritorio) */}
        {hoveredSite && (
          <div className="hidden sm:block absolute bottom-2 left-2 max-w-xs bg-[#0f3d4a]/90 text-white text-xs p-2.5 shadow-lg backdrop-blur-md pointer-events-none border border-cyan-700 z-20">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="font-bold text-sm text-cyan-200">{hoveredSite.nombre}</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-cyan-900 border border-cyan-700">
                {hoveredSite.recurso}
              </span>
            </div>
            <p className="text-cyan-50/80 text-[11px] line-clamp-2">{hoveredSite.descripcion}</p>
            <div className="mt-1.5 text-[10px] text-cyan-100/70 flex items-center justify-between">
              <span>{hoveredSite.pais}</span>
              <span className="text-amber-300 font-medium">Click para cargar parámetros</span>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-between px-3 py-1.5 border-y border-cyan-100 bg-white/60 text-xs text-slate-600 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span>Marea</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
            <span>Corrientes</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span>
            <span>Olas</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">{sitiosVisibles.length} sitios</span>
      </div>

      {/* Listado de emplazamientos: carrusel horizontal en celular, lista vertical en escritorio */}
      {/* En escritorio la lista se posiciona absoluta: llena el alto disponible sin estirar la fila */}
      <div className="lg:flex-1 lg:relative lg:min-h-[180px]">
      <div className="flex lg:flex-col gap-1.5 p-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:absolute lg:inset-0">
        {sitiosVisibles.map((site) => {
          const isSelected = site.id === selectedSiteId;
          return (
            <button
              key={site.id}
              onClick={() => selectSite(site.id)}
              className={`shrink-0 lg:shrink flex items-center gap-2 px-2.5 py-1.5 text-left text-xs border transition-colors w-[170px] lg:w-full ${
                isSelected
                  ? 'bg-cyan-50 border-cyan-500 border-l-4'
                  : 'bg-white/70 border-[#eadcbc] hover:bg-white hover:border-cyan-300'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass(site.recurso)}`}></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-800 truncate">{site.nombre}</span>
                <span className="block text-[10px] text-slate-500 truncate">
                  {site.pais} · {RECURSO_LABEL[site.recurso]}
                </span>
              </span>
              {isSelected && <MapPin className="w-3.5 h-3.5 text-cyan-700 shrink-0" />}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};
