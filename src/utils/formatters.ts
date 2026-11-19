/**
 * Formateo de números en estilo argentino: coma decimal y punto de miles
 */
export function formatoNumero(val: number | string | null | undefined, decimales: number = 1): string {
  if (val === null || val === undefined || val === 'sin dato') {
    return 'sin dato';
  }
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return String(val);

  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function formatoEntero(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === 'sin dato') {
    return 'sin dato';
  }
  const num = typeof val === 'string' ? parseInt(val, 10) : val;
  if (isNaN(num)) return String(val);

  return num.toLocaleString('es-AR', {
    maximumFractionDigits: 0,
  });
}
