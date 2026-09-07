import { formatear } from '../utilidades.js'

export const etiqueta = 'Cuadrática';

export function renderizarCampos() {
  return `
    <div class="field-row">
      <div class="field"><label>a</label><input type="number" id="in_a" value="1" step="0.1"></div>
      <div class="field"><label>b</label><input type="number" id="in_b" value="0" step="0.1"></div>
      <div class="field"><label>c</label><input type="number" id="in_c" value="0" step="0.1"></div>
    </div>`;
}

export function leerParametros() {
  return {
    a: parseFloat(document.getElementById('in_a').value) || 0,
    b: parseFloat(document.getElementById('in_b').value) || 0,
    c: parseFloat(document.getElementById('in_c').value) || 0
  };
}

export function construir(params) {
  const { a, b, c } = params;

  if (a === 0) {
    const items = [{ k: 'Aviso', v: 'a no puede ser 0 (usá Lineal)', cls: 'bad' }];
    return {
      fn: x => b * x + c,
      eq: `y = ${formatear(b)}x + ${formatear(c)}`,
      items,
      steps: ['a debe ser distinto de 0 para que sea cuadrática'],
      points: [],
      discontinuous: false
    };
  }

  const fn = x => a * x * x + b * x + c;
  const discriminante = b * b - 4 * a * c;
  const EPSILON = 1e-10;

  const vx = -b / (2 * a);
  const vy = fn(vx);

  let raicesStr;
  let raicesCls = 'good';
  let pasoRaices;

  const puntos = [
    {
      x: vx,
      y: vy,
      label: `Vértice (${formatear(vx)}, ${formatear(vy)})`,
      kind: 'vertex'
    }
  ];

  if (discriminante > EPSILON) {
    const r1 = (-b + Math.sqrt(discriminante)) / (2 * a);
    const r2 = (-b - Math.sqrt(discriminante)) / (2 * a);

    raicesStr = `x₁=${formatear(r1)}  x₂=${formatear(r2)}`;
    pasoRaices = `Como D > 0, hay dos raíces reales: x = (-b ± √D) / 2a = (${formatear(-b)} ± √${formatear(discriminante)}) / ${formatear(2 * a)} → x₁=${formatear(r1)}, x₂=${formatear(r2)}`;

    puntos.push({ x: r1, y: 0, label: `(${formatear(r1)}, 0)`, kind: 'root' });
    puntos.push({ x: r2, y: 0, label: `(${formatear(r2)}, 0)`, kind: 'root' });
  } else if (Math.abs(discriminante) <= EPSILON) {
    const raizDoble = -b / (2 * a);

    raicesStr = `x=${formatear(raizDoble)} (doble)`;
    pasoRaices = `Como D = 0, hay una raíz doble: x = -b / 2a = ${formatear(raizDoble)}`;

    puntos.push({
      x: raizDoble,
      y: 0,
      label: `(${formatear(raizDoble)}, 0)`,
      kind: 'root'
    });
  } else {
    const re = formatear(-b / (2 * a));
    const im = formatear(Math.sqrt(-discriminante) / Math.abs(2 * a));

    raicesStr = `${re} ± ${im}i`;
    raicesCls = 'warn';
    pasoRaices = `Como D < 0, las raíces son complejas: x = -b/2a ± (√|D|/|2a|)i = ${re} ± ${im}i`;
  }

  const eq = `y = ${formatear(a)}x² ${b >= 0 ? '+' : '-'} ${formatear(Math.abs(b))}x ${c >= 0 ? '+' : '-'} ${formatear(Math.abs(c))}`;

  const items = [
    { k: 'Discriminante', v: formatear(discriminante) },
    { k: 'Raíces', v: raicesStr, cls: raicesCls },
    { k: 'Vértice', v: `(${formatear(vx)}, ${formatear(vy)})` },
    { k: 'Eje de simetría', v: `x = ${formatear(vx)}` },
    { k: 'Concavidad', v: a > 0 ? 'hacia arriba ∪' : 'hacia abajo ∩' }
  ];

  const pasos = [
    `Identificás a=${formatear(a)}, b=${formatear(b)}, c=${formatear(c)}`,
    `Calculás el discriminante: D = b² - 4ac = (${formatear(b)})² - 4(${formatear(a)})(${formatear(c)}) = ${formatear(discriminante)}`,
    pasoRaices,
    `Hallás el vértice: x = -b/2a = ${formatear(vx)}, y = f(${formatear(vx)}) = ${formatear(vy)}`
  ];

  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: false };
}
