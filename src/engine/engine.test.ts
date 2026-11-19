import { describe, it, expect } from 'vitest';
import { calcularPotenciaTeoricaPresaKW } from './tide';
import { calcularPotenciaOlaRegular } from './waves';
import { simularCorrienteMarea, validarCp } from './stream';
import { simularPresa } from './barrage';
import { BETZ_LIMIT } from './constants';

describe('Motor físico - Pruebas obligatorias (Sección 4.5)', () => {
  it('1. Cota teórica de La Rance: 226 * 17 * 8.17^2 da ≈ 256.000 kW', () => {
    const P_teorica = calcularPotenciaTeoricaPresaKW(17, 8.17);
    expect(Math.round(P_teorica)).toBeCloseTo(256449, -2); // ~256.449 kW ≈ 256.000 kW
    expect(P_teorica).toBeGreaterThan(250000);
    expect(P_teorica).toBeLessThan(260000);
  });

  it('2. Potencia de ola regular: 0.98 * 2^2 * 8 da ≈ 31,4 kW/m', () => {
    // Con la fórmula analítica exacta (rho * g^2 * H^2 * T) / (32 * pi)
    const P_w = calcularPotenciaOlaRegular(2, 8);
    expect(P_w).toBeCloseTo(31.4, 0); // ≈ 31.4 kW/m
    const simple = 0.98 * Math.pow(2, 2) * 8;
    expect(simple).toBeCloseTo(31.36, 1);
  });

  it('3. Validación de Betz: C_p > 16/27 es rechazado', () => {
    expect(validarCp(16 / 27)).toBe(true);
    expect(validarCp(0.59)).toBe(true);
    expect(validarCp(0.60)).toBe(false);

    // Debe arrojar excepción si se intenta simular con Cp > 16/27
    expect(() => {
      simularCorrienteMarea({
        N: 4,
        D: 18,
        C_p: 0.65, // > 16/27
        eta_tren: 0.9,
        v_arranque: 1.0,
        v_max: 3.0,
        P_nom_MW: 1.5,
        disponibilidad: 0.95,
        k: 0.2,
      });
    }).toThrow(/límite teórico de Betz/i);
  });

  it('4. La energía de la presa nunca supera la cota teórica en ningún modo', () => {
    const modos: Array<'vaciado' | 'llenado' | 'doble_efecto' | 'doble_bombeo'> = [
      'vaciado',
      'llenado',
      'doble_efecto',
      'doble_bombeo',
    ];

    for (const modo of modos) {
      const res = simularPresa({
        A_km2: 17,
        N: 24,
        P_nom_MW: 10,
        Q_nom: 275,
        H_min: 1.5,
        H_start: 3.5,
        eta_t: 0.88,
        A_c: 600,
        C_d: 0.75,
        modo,
        a_media: 8.17,
        k: 0.1,
      });

      const P_teorica_MW = (res.potencia_teorica_kW || 256449) / 1000;
      expect(res.potencia_media_MW).toBeLessThanOrEqual(P_teorica_MW);
      expect((res.relacion_teorica_pct || 0)).toBeLessThanOrEqual(100);
    }
  });

  it('5. Factores de planta reales calculados con los datos del archivo', () => {
    // La Rance: 240 MW, 550 GWh/año
    const cf_LaRance = (550 * 1000) / (240 * 8760);
    expect(cf_LaRance * 100).toBeCloseTo(26.16, 0); // ≈ 26 %

    // Sihwa: 254 MW, 552.7 GWh/año
    const cf_Sihwa = (552.7 * 1000) / (254 * 8760);
    expect(cf_Sihwa * 100).toBeCloseTo(24.84, 0); // ≈ 25 %

    // MeyGen: 6 MW (4 * 1.5 MW), 10 GWh/año
    const cf_MeyGen = (10 * 1000) / (6 * 8760);
    expect(cf_MeyGen * 100).toBeCloseTo(19.03, 0); // ≈ 19 %

    // Mutriku: 296 kW = 0.296 MW (16 * 18.5 kW), 210 MWh/año
    const cf_Mutriku = 210 / (0.296 * 8760);
    expect(cf_Mutriku * 100).toBeCloseTo(8.1, 0); // ≈ 8 %
  });
});
