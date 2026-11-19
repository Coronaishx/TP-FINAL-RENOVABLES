import { RHO, G } from './constants';
import { WaveParams, SimulationResults, SimulationTimeSeriesPoint, WaveState } from './types';

/**
 * Potencia de ola regular por metro de frente [kW/m]
 * P_w = (rho * g^2 * H^2 * T) / (32 * pi * 1000) ≈ 0.98 * H^2 * T
 */
export function calcularPotenciaOlaRegular(H: number, T: number): number {
  return (RHO * Math.pow(G, 2) * Math.pow(H, 2) * T) / (32 * Math.PI * 1000);
}

/**
 * Potencia de ola irregular por metro de frente en aguas profundas [kW/m]
 * P_w ≈ 0.49 * Hs^2 * Te
 */
export function calcularPotenciaOlaIrregular(Hs: number, Te: number): number {
  return 0.49 * Math.pow(Hs, 2) * Te;
}

export function parsearTablaEstadosMarCSV(csvText: string): WaveState[] {
  const lineas = csvText.trim().split('\n');
  const estados: WaveState[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea || linea.toLowerCase().startsWith('h') || linea.toLowerCase().startsWith('altura')) continue;
    const partes = linea.split(/[,;\t]/).map((p) => parseFloat(p.trim()));
    if (partes.length >= 3 && !isNaN(partes[0]) && !isNaN(partes[1]) && !isNaN(partes[2])) {
      estados.push({
        H: partes[0],
        T: partes[1],
        frecuencia_pct: partes[2],
      });
    }
  }
  return estados;
}

export function simularOlas(params: WaveParams): SimulationResults {
  const {
    tipo_recurso,
    tipo_ola,
    potencia_recurso_kW_m,
    H_medio = 2.0,
    T_medio = 8.0,
    tabla_estados,
    N,
    B,
    CWR,
    eta_PTO,
    P_nom_kW,
  } = params;

  const P_nom_total_MW = (N * P_nom_kW) / 1000;
  const advertencias: string[] = [];

  let potencia_media_unidad_kW = 0;
  let flujo_medio_kW_m = 0;

  if (tipo_recurso === 'tabla' && tabla_estados && tabla_estados.length > 0) {
    // Integración sobre matriz de dispersión de estados de mar
    let suma_frecuencia = 0;
    for (const estado of tabla_estados) {
      const P_w = tipo_ola === 'irregular'
        ? calcularPotenciaOlaIrregular(estado.H, estado.T)
        : calcularPotenciaOlaRegular(estado.H, estado.T);

      const P_captada = CWR * P_w * B * eta_PTO;
      const P_util = Math.min(P_nom_kW, P_captada);

      potencia_media_unidad_kW += (P_util * estado.frecuencia_pct) / 100;
      flujo_medio_kW_m += (P_w * estado.frecuencia_pct) / 100;
      suma_frecuencia += estado.frecuencia_pct;
    }

    if (Math.abs(suma_frecuencia - 100) > 1) {
      advertencias.push(`La suma de frecuencias de la tabla es ${suma_frecuencia.toFixed(1)}% (se recomienda que sume 100%).`);
    }
  } else {
    // Modo valor medio
    advertencias.push('Aviso metodológico: El uso de un valor medio anual simplifica la respuesta real del dispositivo, al no considerar la dispersión espectral ni la saturación a potencia nominal.');

    if (potencia_recurso_kW_m !== undefined && potencia_recurso_kW_m > 0) {
      flujo_medio_kW_m = potencia_recurso_kW_m;
    } else {
      flujo_medio_kW_m = tipo_ola === 'irregular'
        ? calcularPotenciaOlaIrregular(H_medio, T_medio)
        : calcularPotenciaOlaRegular(H_medio, T_medio);
    }

    const P_captada = CWR * flujo_medio_kW_m * B * eta_PTO;
    potencia_media_unidad_kW = Math.min(P_nom_kW, P_captada);
  }

  const potencia_media_total_kW = N * potencia_media_unidad_kW;
  const potencia_media_MW = potencia_media_total_kW / 1000;

  // Anualización a 8760 horas
  const energia_anual_MWh = potencia_media_MW * 8760;
  const energia_anual_GWh = energia_anual_MWh / 1000;

  const factor_de_planta_pct = P_nom_total_MW > 0 ? (potencia_media_MW / P_nom_total_MW) * 100 : 0;
  const horas_generacion_dia = factor_de_planta_pct > 0 ? 24 : 0;

  // Generamos una serie temporal sintética de 48 horas representativa para la animación y gráficos
  const serie_temporal: SimulationTimeSeriesPoint[] = [];
  const periodo_ola = T_medio || 8.0;
  const altura_ola = H_medio || (flujo_medio_kW_m > 0 ? Math.sqrt(flujo_medio_kW_m / (0.98 * periodo_ola)) : 2.0);

  // 48 horas simuladas a intervalos de 30 minutos
  for (let m = 0; m <= 48 * 2; m++) {
    const t_horas = m * 0.5;
    // Variación suave de la altura de ola a lo largo de los días
    const factor_oleaje = 1 + 0.25 * Math.sin((2 * Math.PI * t_horas) / 24);
    const H_inst = altura_ola * factor_oleaje;
    const P_w_inst = tipo_ola === 'irregular'
      ? calcularPotenciaOlaIrregular(H_inst, periodo_ola)
      : calcularPotenciaOlaRegular(H_inst, periodo_ola);

    const P_unit_inst = Math.min(P_nom_kW, CWR * P_w_inst * B * eta_PTO);
    const P_inst_MW = (N * P_unit_inst) / 1000;

    serie_temporal.push({
      t_horas: Math.round(t_horas * 10) / 10,
      t_segundos: t_horas * 3600,
      altura_ola: Math.round(H_inst * 100) / 100,
      potencia_MW: Math.round(P_inst_MW * 100) / 100,
      estado_operacion: P_unit_inst >= P_nom_kW ? 'nominal' : 'generando',
    });
  }

  return {
    energia_anual_GWh: Math.round(energia_anual_GWh * 100) / 100,
    energia_anual_MWh: Math.round(energia_anual_MWh),
    potencia_media_MW: Math.round(potencia_media_MW * 100) / 100,
    potencia_nominal_total_MW: Math.round(P_nom_total_MW * 10) / 10,
    factor_de_planta_pct: Math.round(factor_de_planta_pct * 10) / 10,
    horas_generacion_dia,
    serie_temporal,
    advertencias,
  };
}
