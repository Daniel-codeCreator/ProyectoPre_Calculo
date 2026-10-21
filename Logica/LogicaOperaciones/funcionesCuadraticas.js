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
      eq: `y = ${formatear(b)}x ${c >= 0 ? '+' : '-'} ${formatear(Math.abs(c))}`,
      items,
      steps: ['a debe ser distinto de 0 para que sea cuadrática'],
      points: [],
      discontinuous: false,
      traceRange: b === 0
        ? { xMin: -1, xMax: 1 }
        : c === 0
        ? { xMin: -1, xMax: 1 }
        : { xMin: Math.min(0, -c / b), xMax: Math.max(0, -c / b) }
    };
  }

  const fn = x => a * x * x + b * x + c;
  const discriminante = b * b - 4 * a * c;
  const EPSILON = Number.EPSILON * 32 * (b * b + Math.abs(4 * a * c) + 1);

  const vx = -b / (2 * a);
  const vy = fn(vx);

  let raicesStr;
  let raicesCls = 'good';
  let pasoRaices;
  let limiteTrazo;

  const puntos = [
    {
      x: vx,
      y: vy,
      label: `Vértice (${formatear(vx)}, ${formatear(vy)})`,
      kind: 'vertex'
    }
  ];

  if (discriminante > EPSILON) {
    const raizDiscriminante = Math.sqrt(discriminante);
    // Esta forma evita perder la raíz pequeña cuando |b| es muy grande.
    const q = -0.5 * (b + Math.sign(b || 1) * raizDiscriminante);
    const r1 = q / a;
    const r2 = c / q;

    raicesStr = `x₁=${formatear(r1)}  x₂=${formatear(r2)}`;
    pasoRaices = `Como D > 0, hay dos raíces reales: x = (-b ± √D) / 2a = (${formatear(-b)} ± √${formatear(discriminante)}) / ${formatear(2 * a)} → x₁=${formatear(r1)}, x₂=${formatear(r2)}`;

    puntos.push({ x: r1, y: 0, label: `(${formatear(r1)}, 0)`, kind: 'root' });
    puntos.push({ x: r2, y: 0, label: `(${formatear(r2)}, 0)`, kind: 'root' });
    limiteTrazo = { xMin: Math.min(r1, r2), xMax: Math.max(r1, r2) };
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
    limiteTrazo = { xMin: raizDoble - 1.5, xMax: raizDoble + 1.5 };
  } else {
    const re = formatear(-b / (2 * a));
    const im = formatear(Math.sqrt(-discriminante) / Math.abs(2 * a));

    raicesStr = `${re} ± ${im}i`;
    raicesCls = 'warn';
    pasoRaices = `Como D < 0, las raíces son complejas: x = -b/2a ± (√|D|/|2a|)i = ${re} ± ${im}i`;
    limiteTrazo = { xMin: vx - 2, xMax: vx + 2 };
  }

  const eq = `y = ${formatear(a)}x² ${b >= 0 ? '+' : '-'} ${formatear(Math.abs(b))}x ${c >= 0 ? '+' : '-'} ${formatear(Math.abs(c))}`;

  const items = [
    { k: 'Discriminante', v: formatear(discriminante) },
    { k: 'Raíces', v: raicesStr, cls: raicesCls },
    { k: 'Vértice', v: `(${formatear(vx)}, ${formatear(vy)})` },
    { k: 'Eje de simetría', v: `x = ${formatear(vx)}` },
    { k: 'Concavidad', v: a > 0 ? 'hacia arriba ∪' : 'hacia abajo ∩' },
    { k: 'Dominio', v: 'ℝ' },
    { k: 'Rango', v: a > 0 ? `[${formatear(vy)}, ∞)` : `(-∞, ${formatear(vy)}]` }
  ];

  const pasos = [
    `Partís de y = ax² + bx + c e identificás a=${formatear(a)}, b=${formatear(b)}, c=${formatear(c)}`,
    `Calculás el discriminante: D = b² - 4ac = (${formatear(b)})² - 4(${formatear(a)})(${formatear(c)}) = ${formatear(discriminante)}`,
    pasoRaices,
    `Hallás el vértice: x = -b/2a = ${formatear(vx)}, y = f(${formatear(vx)}) = ${formatear(vy)}; el vértice es (${formatear(vx)}, ${formatear(vy)})`,
    `Como a es ${a > 0 ? 'positiva, la parábola abre hacia arriba y el vértice es un mínimo' : 'negativa, la parábola abre hacia abajo y el vértice es un máximo'}`,
    `El dominio es ℝ y el rango es ${a > 0 ? `y ≥ ${formatear(vy)}` : `y ≤ ${formatear(vy)}`}`
  ];

  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: false, traceRange: limiteTrazo };
}
