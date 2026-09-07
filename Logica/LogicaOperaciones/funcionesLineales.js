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

  let interseccionX;
  let claseInterseccionX = '';
  let pasoRaiz;

  if (m !== 0) {
    interseccionX = `(${formatear(-b / m)}, 0)`;
    pasoRaiz = `Para la raíz igualás 0 = ${formatear(m)}x + ${formatear(b)} → x = -b/m = ${formatear(-b / m)}`;
  } else if (b === 0) {
    interseccionX = 'todos los números reales';
    claseInterseccionX = 'good';
    pasoRaiz = 'Como m = 0 y b = 0, la función es y = 0; por lo tanto, todos los números reales son raíces';
  } else {
    interseccionX = 'no existe';
    claseInterseccionX = 'warn';
    pasoRaiz = `Como m = 0 y b = ${formatear(b)}, la recta es horizontal y no cruza el eje x`;
  }

  const items = [
    { k: 'Pendiente (m)', v: formatear(m) },
    { k: 'Intersección con y', v: `(0, ${formatear(b)})` },
    { k: 'Intersección con x', v: interseccionX, cls: claseInterseccionX },
    { k: 'Comportamiento', v: m > 0 ? 'creciente ↗' : (m < 0 ? 'decreciente ↘' : 'constante →'), cls: 'good' }
  ];

  const pasos = [
    `Identificás la pendiente m = ${formatear(m)} y la ordenada b = ${formatear(b)}`,
    `La intersección con el eje y siempre es (0, b) → (0, ${formatear(b)})`,
    pasoRaiz
  ];

  const puntos = [{ x: 0, y: b, label: `(0, ${formatear(b)})`, kind: 'intercept' }];

  if (m !== 0) {
    puntos.push({
      x: -b / m,
      y: 0,
      label: `(${formatear(-b / m)}, 0)`,
      kind: 'root'
    });
  }

  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: false };
}
