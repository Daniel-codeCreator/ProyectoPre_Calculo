export function formatear(n, digitos = 3) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  const r = Math.round(n * 10 ** digitos) / 10 ** digitos;
  return Object.is(r, -0) ? '0' : r.toString();
}

export function terminoConSigno(coef, simbolo, primero = false) {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const signo = coef < 0 ? '-' : (primero ? '' : '+');
  const espacio = primero ? '' : ' ';
  const coefStr = (abs === 1 && simbolo !== '') ? '' : formatear(abs);
  return `${espacio}${signo} ${coefStr}${simbolo}`.trim() + ' ';
}