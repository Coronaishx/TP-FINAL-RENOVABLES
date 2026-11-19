import { T_M2, T_SN } from './constants';

/**
 * Calcula la amplitud de marea instantánea modulada por vivas y muertas.
 * a(t) = a_media * (1 + k * cos(2π * t / T_sn))
 */
export function calcularAmplitudMarea(a_media: number, k: number, t_segundos: number): number {
  return a_media * (1 + k * Math.cos((2 * Math.PI * t_segundos) / T_SN));
}

/**
 * Calcula el nivel del mar η(t) en metros respecto al nivel medio.
 * η(t) = (a(t)/2) * cos(2π * t / T_M2)
 */
export function calcularNivelMar(a_media: number, k: number, t_segundos: number): number {
  const a_t = calcularAmplitudMarea(a_media, k, t_segundos);
  return (a_t / 2) * Math.cos((2 * Math.PI * t_segundos) / T_M2);
}

/**
 * Cota teórica de potencia media disponible en una cuenca de marea [kW]
 * P_teorica [kW] = 226 * A [km²] * a² [m]
 * (Fórmula estándar de Bernshtein / Fernández Díez)
 */
export function calcularPotenciaTeoricaPresaKW(A_km2: number, a_media: number): number {
  return 226 * A_km2 * Math.pow(a_media, 2);
}
