export type ModoOperacionPresa =
  | 'vaciado' // Simple efecto, generación en vaciado
  | 'llenado' // Simple efecto, generación en llenado
  | 'doble_efecto' // Doble efecto
  | 'doble_bombeo'; // Doble efecto con bombeo

export interface BarrageParams {
  A_km2: number; // Superficie del embalse [km²]
  N: number; // Número de turbinas
  P_nom_MW: number; // Potencia nominal por turbina [MW]
  Q_nom: number; // Caudal nominal por turbina [m³/s] (supuesto)
  H_min: number; // Salto mínimo de operación [m] (supuesto)
  H_start: number; // Salto de arranque [m] (supuesto)
  eta_t: number; // Rendimiento turbina-generador (supuesto)
  A_c: number; // Área efectiva de compuertas [m²] (supuesto)
  C_d: number; // Coeficiente de descarga compuertas (supuesto)
  modo: ModoOperacionPresa;
  deltaZ_bombeo?: number; // Sobre-elevación / depresión por bombeo [m] (supuesto, default 1 m)
  eta_b?: number; // Rendimiento de bombeo (supuesto, default 0.70)
  a_media: number; // Amplitud media de marea [m]
  k: number; // Factor modulación vivas/muertas [0 - 0.5]
}

export interface StreamParams {
  N: number; // Número de turbinas
  D: number; // Diámetro del rotor [m] (supuesto)
  C_p: number; // Coeficiente de potencia <= 16/27 (supuesto)
  eta_tren: number; // Rendimiento tren de potencia (supuesto)
  v_arranque: number; // Velocidad de arranque [m/s] (supuesto)
  v_max: number; // Velocidad máxima media de corriente [m/s] (supuesto o fuente)
  P_nom_MW: number; // Potencia nominal por turbina [MW]
  disponibilidad: number; // Disponibilidad [0 - 1] (supuesto)
  k: number; // Factor modulación vivas/muertas [0 - 0.5]
}

export interface WaveState {
  H: number; // Altura de ola [m]
  T: number; // Período [s]
  frecuencia_pct: number; // Frecuencia de ocurrencia [%]
}

export interface WaveParams {
  tipo_recurso: 'medio' | 'tabla';
  tipo_ola: 'regular' | 'irregular';
  potencia_recurso_kW_m?: number; // Flujo medio anual [kW/m]
  H_medio?: number; // Altura media de ola [m] (si tipo regular/irregular con parámetros)
  T_medio?: number; // Período medio [s]
  tabla_estados?: WaveState[];
  N: number; // Número de dispositivos
  B: number; // Ancho característico [m] (supuesto)
  CWR: number; // Relación de ancho de captura (supuesto)
  eta_PTO: number; // Rendimiento toma de fuerza (PTO) (supuesto)
  P_nom_kW: number; // Potencia nominal por unidad [kW]
}

export interface SimulationTimeSeriesPoint {
  t_horas: number;
  t_segundos: number;
  nivel_mar?: number; // [m]
  nivel_embalse?: number; // [m]
  salto_H?: number; // [m]
  velocidad_corriente?: number; // [m/s]
  altura_ola?: number; // [m]
  potencia_MW: number; // [MW] total parque
  estado_operacion?: string; // 'espera', 'turbinado', 'llenado_compuertas', 'vaciado_compuertas', 'bombeo', etc.
  flujo_m3_s?: number; // Flujo a través de turbinas / compuertas (+ mar->emb, - emb->mar)
}

export interface SimulationResults {
  energia_anual_GWh: number;
  energia_anual_MWh: number;
  potencia_media_MW: number;
  potencia_nominal_total_MW: number;
  factor_de_planta_pct: number;
  horas_generacion_dia: number;
  potencia_teorica_kW?: number; // Para presas: 226 * A * a^2
  potencia_teorica_MW?: number;
  relacion_teorica_pct?: number; // P_media / P_teorica * 100
  serie_temporal: SimulationTimeSeriesPoint[];
  advertencias?: string[];
}
