import { create } from 'zustand';
import sitiosData from '../data/sitios.json';
import { simularPresa } from '../engine/barrage';
import { simularCorrienteMarea } from '../engine/stream';
import { simularOlas, parsearTablaEstadosMarCSV } from '../engine/waves';
import { SimulationResults, BarrageParams, StreamParams, WaveParams } from '../engine/types';

export interface SitioData {
  id: string;
  nombre: string;
  pais: string;
  lat: number;
  lon: number;
  fuente_coord: string;
  recurso: 'marea' | 'corriente' | 'olas';
  tecnologia: string;
  año_inicio?: number;
  descripcion: string;
  parametros: Record<string, {
    valor: any;
    unidad: string;
    fuente?: string;
    supuesto?: boolean;
    explicacion?: string;
  }>;
  produccion_real?: {
    valor_anual_GWh?: number;
    valor_anual_MWh?: number;
    unidad?: string;
    acumulado_GWh?: number;
    factor_de_planta_calculado_pct?: number;
    fuente?: string;
  } | null;
  ficha_regulatoria: string;
  ficha_ambiental: string;
}

interface SimulatorState {
  sitios: SitioData[];
  selectedSiteId: string;
  activeTab: 'simulador' | 'comparar' | 'argentina';
  modoExposicion: boolean;
  currentParams: Record<string, any>;
  simulationResults: SimulationResults | null;
  isPaused: boolean;
  animSpeed: number; // 1, 6, 24
  simTimeSeconds: number; // 0 a 86400 * 3
  modalFichaOpen: boolean;
  modalAcercaDeOpen: boolean;
  tablaEstadosCSV: string;

  // Actions
  selectSite: (siteId: string) => void;
  updateParam: (key: string, value: any) => void;
  resetCurrentSiteParams: () => void;
  setTab: (tab: 'simulador' | 'comparar' | 'argentina') => void;
  toggleModoExposicion: () => void;
  togglePause: () => void;
  setAnimSpeed: (speed: number) => void;
  setSimTimeSeconds: (time: number) => void;
  advanceSimTime: (deltaSeconds: number) => void;
  setModalFichaOpen: (open: boolean) => void;
  setModalAcercaDeOpen: (open: boolean) => void;
  setTablaEstadosCSV: (csv: string) => void;
  recomputeSimulation: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => {
  const allSites = sitiosData as unknown as SitioData[];
  const initialSite = allSites[0];
  const initialParams: Record<string, any> = {};
  Object.entries(initialSite.parametros).forEach(([k, v]) => {
    initialParams[k] = v.valor;
  });

  return {
    sitios: allSites,
    selectedSiteId: initialSite.id,
    activeTab: 'simulador',
    modoExposicion: false,
    currentParams: initialParams,
    simulationResults: null,
    isPaused: false,
    animSpeed: 6,
    simTimeSeconds: 0,
    modalFichaOpen: false,
    modalAcercaDeOpen: false,
    tablaEstadosCSV: '',

    selectSite: (siteId: string) => {
      const site = allSites.find((s) => s.id === siteId);
      if (!site) return;
      const params: Record<string, any> = {};
      Object.entries(site.parametros).forEach(([k, v]) => {
        params[k] = v.valor;
      });
      set({
        selectedSiteId: siteId,
        currentParams: params,
        simTimeSeconds: 0,
        activeTab: 'simulador',
      });
      get().recomputeSimulation();
    },

    updateParam: (key: string, value: any) => {
      set((state) => ({
        currentParams: {
          ...state.currentParams,
          [key]: value,
        },
      }));
      get().recomputeSimulation();
    },

    resetCurrentSiteParams: () => {
      const site = get().sitios.find((s) => s.id === get().selectedSiteId);
      if (!site) return;
      const params: Record<string, any> = {};
      Object.entries(site.parametros).forEach(([k, v]) => {
        params[k] = v.valor;
      });
      set({ currentParams: params });
      get().recomputeSimulation();
    },

    setTab: (tab) => set({ activeTab: tab }),

    toggleModoExposicion: () => set((state) => ({ modoExposicion: !state.modoExposicion })),

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    setAnimSpeed: (speed) => set({ animSpeed: speed }),

    setSimTimeSeconds: (time) => set({ simTimeSeconds: time }),

    advanceSimTime: (deltaSeconds) => {
      set((state) => {
        const nextTime = (state.simTimeSeconds + deltaSeconds) % (14.77 * 86400);
        return { simTimeSeconds: nextTime };
      });
    },

    setModalFichaOpen: (open) => set({ modalFichaOpen: open }),

    setModalAcercaDeOpen: (open) => set({ modalAcercaDeOpen: open }),

    setTablaEstadosCSV: (csv) => {
      set({ tablaEstadosCSV: csv });
      get().recomputeSimulation();
    },

    recomputeSimulation: () => {
      const { selectedSiteId, sitios, currentParams, tablaEstadosCSV } = get();
      const site = sitios.find((s) => s.id === selectedSiteId);
      if (!site) return;

      try {
        let results: SimulationResults;

        if (site.recurso === 'marea') {
          const barrageParams: BarrageParams = {
            A_km2: Number(currentParams.A_km2) || 17,
            N: Number(currentParams.N) || 24,
            P_nom_MW: Number(currentParams.P_nom_MW) || 10,
            Q_nom: Number(currentParams.Q_nom) || 275,
            H_min: Number(currentParams.H_min) || 1.5,
            H_start: Number(currentParams.H_start) || 3.5,
            eta_t: Number(currentParams.eta_t) || 0.88,
            A_c: Number(currentParams.A_c) || 600,
            C_d: Number(currentParams.C_d) || 0.75,
            modo: currentParams.modo || 'doble_bombeo',
            deltaZ_bombeo: Number(currentParams.deltaZ_bombeo) || 1.0,
            eta_b: Number(currentParams.eta_b) || 0.70,
            a_media: Number(currentParams.a_media) || 8.17,
            k: Number(currentParams.k) || 0,
          };
          results = simularPresa(barrageParams);
        } else if (site.recurso === 'corriente') {
          const streamParams: StreamParams = {
            N: Number(currentParams.N) || 4,
            D: Number(currentParams.D) || 18,
            C_p: Math.min(16 / 27, Number(currentParams.C_p) || 0.42),
            eta_tren: Number(currentParams.eta_tren) || 0.88,
            v_arranque: Number(currentParams.v_arranque) || 1.0,
            v_max: Number(currentParams.v_max) || 3.25,
            P_nom_MW: Number(currentParams.P_nom_MW) || 1.5,
            disponibilidad: Number(currentParams.disponibilidad) || 0.92,
            k: Number(currentParams.k) || 0.15,
          };
          results = simularCorrienteMarea(streamParams);
        } else {
          // Olas
          const parsedStates = tablaEstadosCSV ? parsearTablaEstadosMarCSV(tablaEstadosCSV) : undefined;
          const waveParams: WaveParams = {
            tipo_recurso: currentParams.tipo_recurso === 'tabla' ? 'tabla' : 'medio',
            tipo_ola: currentParams.tipo_ola || 'irregular',
            potencia_recurso_kW_m: Number(currentParams.potencia_recurso_kW_m) || 20,
            H_medio: Number(currentParams.H_medio) || 2.0,
            T_medio: Number(currentParams.T_medio) || 8.0,
            tabla_estados: parsedStates,
            N: Number(currentParams.N) || 1,
            B: Number(currentParams.B) || 5.0,
            CWR: Number(currentParams.CWR) || 0.35,
            eta_PTO: Number(currentParams.eta_PTO) || 0.50,
            P_nom_kW: Number(currentParams.P_nom_kW) || 300,
          };
          results = simularOlas(waveParams);
        }

        set({ simulationResults: results });
      } catch (err: any) {
        console.error('Error en simulación:', err);
      }
    },
  };
});
