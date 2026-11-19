import { RHO, DT, SIM_SECONDS, ANNUAL_FACTOR, T_M2, T_SN, BETZ_LIMIT } from './constants';
import { StreamParams, SimulationResults, SimulationTimeSeriesPoint } from './types';

export function validarCp(C_p: number): boolean {
  return C_p <= BETZ_LIMIT + 1e-6;
}

export function simularCorrienteMarea(params: StreamParams): SimulationResults {
  const {
    N,
    D,
    C_p,
    eta_tren,
    v_arranque,
    v_max,
    P_nom_MW,
    disponibilidad,
    k,
  } = params;

  const advertencias: string[] = [];
  if (!validarCp(C_p)) {
    throw new Error(`El coeficiente de potencia C_p (${C_p.toFixed(3)}) supera el límite teórico de Betz (16/27 ≈ 0,593). Ningún rotor en flujo libre puede superar este límite físico.`);
  }

  const A_r = (Math.PI * Math.pow(D, 2)) / 4; // Área de barrido [m²]
  const P_nom_W_unit = P_nom_MW * 1e6;
  const P_nom_total_MW = N * P_nom_MW;

  let energia_generada_J = 0;
  let segundos_generando = 0;
  const serie_temporal: SimulationTimeSeriesPoint[] = [];
  const samplingInterval = 15; // Muestra cada 15 min

  const totalSteps = Math.floor(SIM_SECONDS / DT);

  for (let step = 0; step < totalSteps; step++) {
    const t = step * DT;

    // Modulación de velocidad por vivas y muertas
    const v_max_t = v_max * (1 + k * Math.cos((2 * Math.PI * t) / T_SN));
    // Velocidad instantánea en función del ciclo semidiurno M2
    const v_inst = v_max_t * Math.abs(Math.sin((2 * Math.PI * t) / T_M2));

    let P_unit_W = 0;
    let estado = 'parado';

    if (v_inst >= v_arranque) {
      // Potencia hidrodinámica del rotor: 0.5 * rho * A_r * Cp * v^3 * eta_tren
      const P_hidro = 0.5 * RHO * A_r * C_p * Math.pow(v_inst, 3) * eta_tren;
      P_unit_W = Math.min(P_nom_W_unit, P_hidro);
      segundos_generando += DT;
      estado = P_unit_W >= P_nom_W_unit ? 'nominal' : 'generando';
    }

    const P_total_W = N * P_unit_W * Math.min(1, Math.max(0, disponibilidad));
    energia_generada_J += P_total_W * DT;

    if (step % samplingInterval === 0 && (step * DT <= 7 * 86400 || step % (samplingInterval * 4) === 0)) {
      serie_temporal.push({
        t_horas: Math.round((t / 3600) * 10) / 10,
        t_segundos: t,
        velocidad_corriente: Math.round(v_inst * 100) / 100,
        potencia_MW: Math.round((P_total_W / 1e6) * 100) / 100,
        estado_operacion: estado,
      });
    }
  }

  const energia_Wh = energia_generada_J / 3600;
  const energia_anual_MWh = (energia_Wh / 1e6) * ANNUAL_FACTOR;
  const energia_anual_GWh = energia_anual_MWh / 1000;

  const potencia_media_MW = (energia_generada_J / SIM_SECONDS) / 1e6;
  const factor_de_planta_pct = P_nom_total_MW > 0 ? (potencia_media_MW / P_nom_total_MW) * 100 : 0;
  const horas_generacion_dia = (segundos_generando / SIM_SECONDS) * 24;

  return {
    energia_anual_GWh: Math.round(energia_anual_GWh * 10) / 10,
    energia_anual_MWh: Math.round(energia_anual_MWh),
    potencia_media_MW: Math.round(potencia_media_MW * 100) / 100,
    potencia_nominal_total_MW: Math.round(P_nom_total_MW * 10) / 10,
    factor_de_planta_pct: Math.round(factor_de_planta_pct * 10) / 10,
    horas_generacion_dia: Math.round(horas_generacion_dia * 10) / 10,
    serie_temporal,
    advertencias,
  };
}
