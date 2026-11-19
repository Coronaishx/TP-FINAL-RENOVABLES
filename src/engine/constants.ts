// Constantes físicas del simulador marino
export const RHO = 1025; // Densidad del agua de mar [kg/m³]
export const G = 9.81;    // Aceleración de la gravedad [m/s²]
export const T_M2 = 12.42 * 3600; // Período semidiurno lunar M2 [s] (12,42 h)
export const T_SN = 14.77 * 86400; // Ciclo de mareas vivas y muertas [s] (14,77 días)
export const DT = 60; // Paso temporal de simulación [s] (1 minuto)
export const SIM_DAYS = 29.5; // Ciclo sinódico simulado [días]
export const SIM_SECONDS = SIM_DAYS * 86400;
export const ANNUAL_FACTOR = 365 / SIM_DAYS; // Factor de anualización
export const BETZ_LIMIT = 16 / 27; // ~0.59259259...
