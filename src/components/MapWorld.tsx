import React, { useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import countriesData from '../data/countries-110m.json';
import { useSimulatorStore, SitioData } from '../store/simulatorStore';
import { Compass, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const MapWorld: React.FC = () => {
  const { sitios, selectedSiteId, selectSite } = useSimulatorStore();
  const [zoomLevel, setZoomLevel] = useState<'world' | 'argentina'>('world');
  const [hoveredSite, setHoveredSite] = useState<SitioData | null>(null);

  const width = 800;
  const height = 480;

  // Proyección D3 configurada según vista mundo o vista costa argentina
  const projection = useMemo(() => {
    if (zoomLevel === 'argentina') {
      return geoNaturalEarth1()
        .scale(1200)
        .center([-65, -45])
        .translate([width / 2, height / 2]);
    }
    return geoNaturalEarth1()
      .scale(155)
      .translate([width / 2, height / 2 + 20]);
  }, [zoomLevel]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const geojson = useMemo(() => {
    const countries = (countriesData as any).objects.countries;
    return topojson.feature(countriesData as any, countries) as any;
  }, []);

  const getMarkerColor = (recurso: string, isSelected: boolean) => {
    if (isSelected) return '#facc15'; // Amarillo destacado de selección
    if (recurso === 'marea') return '#2563eb'; // Azul marea
    if (recurso === 'corriente') return '#0d9488'; // Teal corriente
    return '#ea580c'; // Naranja olas
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-900/5 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Barra superior de controles del mapa */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/90 border-b border-slate-200 z-10 backdrop-blur-sm gap-1">
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
            className={`px-2 py-1 text-[11px] sm:text-xs font-medium rounded transition-colors ${
              zoomLevel === 'world'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Ver mapa mundial completo"
          >
            Mundo
          </button>
          <button
            onClick={() => setZoomLevel('argentina')}
            className={`px-2 py-1 text-[11px] sm:text-xs font-medium rounded transition-colors ${
              zoomLevel === 'argentina'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Zoom a la costa argentina y patagónica"
          >
            <span className="sm:hidden">🇦🇷 Arg.</span>
            <span className="hidden sm:inline">🇦🇷 Zoom Argentina</span>
          </button>
        </div>
      </div>

      {/* Área interactiva del mapa SVG */}
      <div className="relative flex-1 bg-sky-50/50 min-h-[300px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Fondo oceánico */}
          <rect width={width} height={height} fill="#f0f9ff" />

          {/* Graticule o paralelos sutiles */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Tierras / Países */}
          <g className="countries">
            {geojson.features.map((feature: any, idx: number) => (
              <path
                key={idx}
                d={pathGenerator(feature) || ''}
                fill="#e2e8f0"
                stroke="#cbd5e1"
                strokeWidth={0.6}
                className="transition-colors hover:fill-slate-300"
              />
            ))}
          </g>

          {/* Marcadores de sitios */}
          <g className="markers">
            {sitios.map((site) => {
              const coords = projection([site.lon, site.lat]);
              if (!coords) return null;
              const [cx, cy] = coords;

              // Filtrar puntos fuera de vista si se hace zoom
              if (cx < -20 || cx > width + 20 || cy < -20 || cy > height + 20) return null;

              const isSelected = site.id === selectedSiteId;
              const color = getMarkerColor(site.recurso, isSelected);

              return (
                <g
                  key={site.id}
                  className="cursor-pointer transition-transform group"
                  onClick={() => selectSite(site.id)}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                >
                  {/* Halo animado si está seleccionado */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={zoomLevel === 'argentina' ? 14 : 9}
                      fill={color}
                      opacity={0.3}
                      className="animate-ping"
                    />
                  )}

                  {/* Círculo exterior blanco para contraste */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? (zoomLevel === 'argentina' ? 10 : 7) : (zoomLevel === 'argentina' ? 7 : 5)}
                    fill="white"
                    stroke="#334155"
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Punto de color de recurso */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? (zoomLevel === 'argentina' ? 7 : 4.5) : (zoomLevel === 'argentina' ? 5 : 3.5)}
                    fill={color}
                  />

                  {/* Etiqueta visible en zoom argentina o selección */}
                  {(zoomLevel === 'argentina' || isSelected) && (
                    <text
                      x={cx + (zoomLevel === 'argentina' ? 10 : 8)}
                      y={cy + 4}
                      className="text-[11px] font-semibold fill-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] pointer-events-none"
                    >
                      {site.nombre}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip flotante al pasar el mouse */}
        {hoveredSite && (
          <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs bg-slate-900/90 text-white text-xs rounded-lg p-2.5 shadow-lg backdrop-blur-md pointer-events-none border border-slate-700 z-20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-sky-300">{hoveredSite.nombre}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 border border-slate-700">
                {hoveredSite.recurso}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] line-clamp-2">{hoveredSite.descripcion}</p>
            <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
              <span>{hoveredSite.pais}</span>
              <span className="text-amber-400 font-medium">Click para cargar parámetros</span>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda al pie del mapa */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-slate-200 text-xs text-slate-600">
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
        <span className="text-[11px] text-slate-400 hidden sm:inline">Mapamundi TopoJSON 110m (100% offline)</span>
      </div>
    </div>
  );
};
