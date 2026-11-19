import { RHO, G, DT, SIM_SECONDS, ANNUAL_FACTOR } from './constants';
import { BarrageParams, SimulationResults, SimulationTimeSeriesPoint } from './types';
import { calcularNivelMar, calcularPotenciaTeoricaPresaKW } from './tide';

export function simularPresa(params: BarrageParams): SimulationResults {
  const {
    A_km2,
    N,
    P_nom_MW,
    Q_nom,
    H_min,
    H_start,
    eta_t,
    A_c,
    C_d,
    modo,
    deltaZ_bombeo = 1.0,
    eta_b = 0.70,
    a_media,
    k,
  } = params;

  const A_m2 = A_km2 * 1e6;
  const P_nom_W_unit = P_nom_MW * 1e6;
  const P_nom_total_W = N * P_nom_W_unit;
  const P_nom_total_MW = N * P_nom_MW;

  // Salto nominal para la turbina dada la potencia y caudal nominal
  const H_nom = Math.max(0.1, P_nom_W_unit / (RHO * G * Math.max(0.1, Q_nom) * Math.max(0.1, eta_t)));

  let z_emb = 0; // Nivel inicial del embalse [m]
  let estado: 'espera' | 'turbinado_vaciado' | 'turbinado_llenado' | 'compuertas_llenando' | 'compuertas_vaciando' | 'bombeo_llenado' | 'bombeo_vaciado' = 'espera';

  let energia_generada_J = 0;
  let energia_bombeo_J = 0;
  let segundos_generando = 0;

  // Guardamos una muestra de la serie temporal (p.ej. cada 15 min = 15 pasos para rendimiento en UI)
  const serie_temporal: SimulationTimeSeriesPoint[] = [];
  const samplingInterval = 15; // cada 15 minutos en UI

  const totalSteps = Math.floor(SIM_SECONDS / DT);

  // Variables auxiliares para bombeo
  let bombeo_realizado_marea_alta = false;
  let bombeo_realizado_marea_baja = false;

  for (let step = 0; step < totalSteps; step++) {
    const t = step * DT;
    const eta_mar = calcularNivelMar(a_media, k, t);
    const eta_mar_next = calcularNivelMar(a_media, k, t + DT);
    const marea_subiendo = eta_mar_next >= eta_mar;

    const H = Math.abs(eta_mar - z_emb);
    let Q_t = 0; // Caudal turbinado (+ mar->embalse, - embalse->mar)
    let Q_c = 0; // Caudal compuertas (+ mar->embalse, - embalse->mar)
    let P_inst_W = 0;

    // LÓGICA DE ESTADOS SEGÚN EL MODO
    if (modo === 'vaciado') {
      // Simple efecto en vaciado (ebb)
      if (estado === 'compuertas_llenando') {
        if (marea_subiendo && eta_mar > z_emb) {
          // Llenado con compuertas abiertas
          const flow = C_d * A_c * Math.sqrt(2 * G * Math.max(0, eta_mar - z_emb));
          Q_c = flow;
        } else {
          // La marea empieza a bajar o el embalse igualó al mar
          estado = 'espera';
        }
      } else if (estado === 'espera') {
        if (!marea_subiendo && (z_emb - eta_mar) >= H_start) {
          // Salto suficiente para arrancar vaciado
          estado = 'turbinado_vaciado';
        } else if (marea_subiendo && eta_mar > z_emb) {
          // Llega nueva pleamar: abrir compuertas para rellenar
          estado = 'compuertas_llenando';
          const flow = C_d * A_c * Math.sqrt(2 * G * Math.max(0, eta_mar - z_emb));
          Q_c = flow;
        }
      } else if (estado === 'turbinado_vaciado') {
        const salto = z_emb - eta_mar;
        if (salto >= H_min) {
          // Turbinado
          const q_unit = Q_nom * Math.sqrt(Math.max(0, salto) / H_nom);
          Q_t = -N * q_unit;
          const p_unit = Math.min(P_nom_W_unit, RHO * G * q_unit * salto * eta_t);
          P_inst_W = N * p_unit;
          segundos_generando += DT;
        } else {
          // Se agotó el salto mínimo
          estado = 'espera';
        }
      }
    } else if (modo === 'llenado') {
      // Simple efecto en llenado (flood)
      if (estado === 'compuertas_vaciando') {
        if (!marea_subiendo && z_emb > eta_mar) {
          // Vaciado con compuertas abiertas
          const flow = C_d * A_c * Math.sqrt(2 * G * Math.max(0, z_emb - eta_mar));
          Q_c = -flow;
        } else {
          estado = 'espera';
        }
      } else if (estado === 'espera') {
        if (marea_subiendo && (eta_mar - z_emb) >= H_start) {
          estado = 'turbinado_llenado';
        } else if (!marea_subiendo && z_emb > eta_mar) {
          estado = 'compuertas_vaciando';
          const flow = C_d * A_c * Math.sqrt(2 * G * Math.max(0, z_emb - eta_mar));
          Q_c = -flow;
        }
      } else if (estado === 'turbinado_llenado') {
        const salto = eta_mar - z_emb;
        if (salto >= H_min) {
          const q_unit = Q_nom * Math.sqrt(Math.max(0, salto) / H_nom);
          Q_t = N * q_unit;
          const p_unit = Math.min(P_nom_W_unit, RHO * G * q_unit * salto * eta_t);
          P_inst_W = N * p_unit;
          segundos_generando += DT;
        } else {
          estado = 'espera';
        }
      }
    } else if (modo === 'doble_efecto') {
      // Generación en ambos sentidos
      if (estado === 'espera') {
        if (z_emb - eta_mar >= H_start) {
          estado = 'turbinado_vaciado';
        } else if (eta_mar - z_emb >= H_start) {
          estado = 'turbinado_llenado';
        } else if (H < 0.2) {
          // Breve apertura de compuertas cerca del equilibrio
          if (marea_subiendo && eta_mar > z_emb) {
            Q_c = C_d * A_c * Math.sqrt(2 * G * Math.max(0, eta_mar - z_emb));
          } else if (!marea_subiendo && z_emb > eta_mar) {
            Q_c = -C_d * A_c * Math.sqrt(2 * G * Math.max(0, z_emb - eta_mar));
          }
        }
      } else if (estado === 'turbinado_vaciado') {
        const salto = z_emb - eta_mar;
        if (salto >= H_min) {
          const q_unit = Q_nom * Math.sqrt(salto / H_nom);
          Q_t = -N * q_unit;
          P_inst_W = Math.min(P_nom_total_W, N * RHO * G * q_unit * salto * eta_t);
          segundos_generando += DT;
        } else {
          estado = 'espera';
        }
      } else if (estado === 'turbinado_llenado') {
        const salto = eta_mar - z_emb;
        if (salto >= H_min) {
          const q_unit = Q_nom * Math.sqrt(salto / H_nom);
          Q_t = N * q_unit;
          P_inst_W = Math.min(P_nom_total_W, N * RHO * G * q_unit * salto * eta_t);
          segundos_generando += DT;
        } else {
          estado = 'espera';
        }
      }
    } else if (modo === 'doble_bombeo') {
      // Doble efecto con bombeo en pleamar y bajamar
      if (estado === 'espera') {
        // Chequear si cerca de pleamar bombeamos para sobre-elevar
        if (!bombeo_realizado_marea_alta && !marea_subiendo && H < 0.3 && eta_mar > 0) {
          estado = 'bombeo_llenado';
          bombeo_realizado_marea_alta = true;
          bombeo_realizado_marea_baja = false;
        } else if (!bombeo_realizado_marea_baja && marea_subiendo && H < 0.3 && eta_mar < 0) {
          estado = 'bombeo_vaciado';
          bombeo_realizado_marea_baja = true;
          bombeo_realizado_marea_alta = false;
        } else if (z_emb - eta_mar >= H_start) {
          estado = 'turbinado_vaciado';
        } else if (eta_mar - z_emb >= H_start) {
          estado = 'turbinado_llenado';
        }
      } else if (estado === 'bombeo_llenado') {
        // Bombear agua del mar al embalse para ganar deltaZ
        const Q_pump = N * Q_nom;
        Q_t = Q_pump;
        const H_pump = Math.max(0.2, z_emb - eta_mar + 0.1);
        const P_pump = (RHO * G * Q_pump * H_pump) / Math.max(0.1, eta_b);
        energia_bombeo_J += P_pump * DT;
        if (z_emb >= eta_mar + deltaZ_bombeo) {
          estado = 'espera';
        }
      } else if (estado === 'bombeo_vaciado') {
        // Bombear agua del embalse al mar para deprimirlo deltaZ
        const Q_pump = N * Q_nom;
        Q_t = -Q_pump;
        const H_pump = Math.max(0.2, eta_mar - z_emb + 0.1);
        const P_pump = (RHO * G * Q_pump * H_pump) / Math.max(0.1, eta_b);
        energia_bombeo_J += P_pump * DT;
        if (z_emb <= eta_mar - deltaZ_bombeo) {
          estado = 'espera';
        }
      } else if (estado === 'turbinado_vaciado') {
        const salto = z_emb - eta_mar;
        if (salto >= H_min) {
          const q_unit = Q_nom * Math.sqrt(salto / H_nom);
          Q_t = -N * q_unit;
          P_inst_W = Math.min(P_nom_total_W, N * RHO * G * q_unit * salto * eta_t);
          segundos_generando += DT;
        } else {
          estado = 'espera';
        }
      } else if (estado === 'turbinado_llenado') {
        const salto = eta_mar - z_emb;
        if (salto >= H_min) {
          const q_unit = Q_nom * Math.sqrt(salto / H_nom);
          Q_t = N * q_unit;
          P_inst_W = Math.min(P_nom_total_W, N * RHO * G * q_unit * salto * eta_t);
          segundos_generando += DT;
        } else {
          estado = 'espera';
        }
      }
    }

    // Balance de masa en el embalse: dz_emb / dt = (Q_t + Q_c) / A_m2
    const dz = ((Q_t + Q_c) * DT) / A_m2;
    z_emb += dz;

    energia_generada_J += P_inst_W * DT;

    // Muestreo para visualización (cada samplingInterval pasos, y asegurar los primeros 3 días para gráficos detallados)
    if (step % samplingInterval === 0 && (step * DT <= 7 * 86400 || step % (samplingInterval * 4) === 0)) {
      serie_temporal.push({
        t_horas: Math.round((t / 3600) * 10) / 10,
        t_segundos: t,
        nivel_mar: Math.round(eta_mar * 100) / 100,
        nivel_embalse: Math.round(z_emb * 100) / 100,
        salto_H: Math.round(H * 100) / 100,
        potencia_MW: Math.round((P_inst_W / 1e6) * 100) / 100,
        estado_operacion: estado,
        flujo_m3_s: Math.round(Q_t + Q_c),
      });
    }
  }

  const energia_neta_J = Math.max(0, energia_generada_J - energia_bombeo_J);
  const energia_neta_Wh = energia_neta_J / 3600;
  const energia_anual_MWh = (energia_neta_Wh / 1e6) * ANNUAL_FACTOR;
  const energia_anual_GWh = energia_anual_MWh / 1000;

  const potencia_media_W = energia_neta_J / SIM_SECONDS;
  const potencia_media_MW = potencia_media_W / 1e6;

  const factor_de_planta_pct = P_nom_total_MW > 0 ? (potencia_media_MW / P_nom_total_MW) * 100 : 0;
  const horas_generacion_dia = (segundos_generando / SIM_SECONDS) * 24;

  const potencia_teorica_kW = calcularPotenciaTeoricaPresaKW(A_km2, a_media);
  const potencia_teorica_MW = potencia_teorica_kW / 1000;
  const relacion_teorica_pct = potencia_teorica_MW > 0 ? (potencia_media_MW / potencia_teorica_MW) * 100 : 0;

  return {
    energia_anual_GWh: Math.round(energia_anual_GWh * 10) / 10,
    energia_anual_MWh: Math.round(energia_anual_MWh),
    potencia_media_MW: Math.round(potencia_media_MW * 100) / 100,
    potencia_nominal_total_MW: Math.round(P_nom_total_MW * 10) / 10,
    factor_de_planta_pct: Math.round(factor_de_planta_pct * 10) / 10,
    horas_generacion_dia: Math.round(horas_generacion_dia * 10) / 10,
    potencia_teorica_kW: Math.round(potencia_teorica_kW),
    potencia_teorica_MW: Math.round(potencia_teorica_MW * 10) / 10,
    relacion_teorica_pct: Math.round(relacion_teorica_pct * 10) / 10,
    serie_temporal,
  };
}
