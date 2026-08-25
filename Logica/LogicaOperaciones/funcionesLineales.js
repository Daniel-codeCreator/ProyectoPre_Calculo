import { formatear } from '../utilidades.js'

export const etiqueta = 'Lineal';

export function renderizarCampos() {
  return `
    <div class="field-row">
      <div class="field"><label>m (pendiente)</label><input type="number" id="in_m" value="1" step="0.1"></div>
      <div class="field"><label>b (intersección)</label><input type="number" id="in_b" value="0" step="0.1"></div>
    </div>`;
}

export function leerParametros() {
  return {
    m: parseFloat(document.getElementById('in_m').value) || 0,
    b: parseFloat(document.getElementById('in_b').value) || 0
  };
}

export function construir(params) {
  const { m, b } = params;
  const fn = x => m * x + b;
  const eq = `y = ${formatear(m)}x ${b >= 0 ? '+' : '-'} ${formatear(Math.abs(b))}`;
  const items = [
    { k: 'Pendiente (m)', v: formatear(m) },
    { k: 'Intersección con y', v: `(0, ${formatear(b)})` },
    { k: 'Intersección con x', v: m !== 0 ? `(${formatear(-b / m)}, 0)` : 'no existe', cls: m === 0 ? 'warn' : '' },
    { k: 'Comportamiento', v: m > 0 ? 'creciente ↗' : (m < 0 ? 'decreciente ↘' : 'constante →'), cls: 'good' }
  ];
  const pasos = [
    `Identificás la pendiente m = ${formatear(m)} y la ordenada b = ${formatear(b)}`,
    `La intersección con el eje y siempre es (0, b) → (0, ${formatear(b)})`,
    m !== 0
      ? `Para la raíz igualás 0 = ${formatear(m)}x + ${formatear(b)} → x = -b/m = ${formatear(-b / m)}`
      : `Como m = 0, la recta es horizontal y no cruza el eje x`
  ];
  const puntos = [{ x: 0, y: b, label: `(0, ${formatear(b)})`, kind: 'intercept' }];
  if (m !== 0) puntos.push({ x: -b / m, y: 0, label: `(${formatear(-b / m)}, 0)`, kind: 'root' });
  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: false };
}