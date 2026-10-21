import { formatear } from '../utilidades.js'

export const etiqueta = 'Trigonométrica';

export function renderizarCampos() {
  return `
    <div class="field">
      <label>función</label>
      <select id="in_fn">
        <option value="sin">seno — sin(x)</option>
        <option value="cos">coseno — cos(x)</option>
        <option value="tan">tangente — tan(x)</option>
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>a (amplitud)</label><input type="number" id="in_a" value="1" step="0.1"></div>
      <div class="field"><label>b (frecuencia)</label><input type="number" id="in_b" value="1" step="0.1"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>c (fase)</label><input type="number" id="in_c" value="0" step="0.1"></div>
      <div class="field"><label>d (desplaz. vert.)</label><input type="number" id="in_d" value="0" step="0.1"></div>
    </div>`;
}

export function leerParametros() {
  return {
    fn: document.getElementById('in_fn').value,
    a: parseFloat(document.getElementById('in_a').value) || 0,
    b: parseFloat(document.getElementById('in_b').value) || 0,
    c: parseFloat(document.getElementById('in_c').value) || 0,
    d: parseFloat(document.getElementById('in_d').value) || 0
  };
}

export function construir(params) {
  const { fn: nombreFn, a, b, c, d } = params;
  const base = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[nombreFn];
  const esTangente = nombreFn === 'tan';
  const EPSILON_ASINTOTA = 1e-10;
  const argumentoEsAsintota = argumento =>
    esTangente && Math.abs(Math.cos(argumento)) < EPSILON_ASINTOTA;

  const fn = x => {
    const argumento = b * x + c;
    return argumentoEsAsintota(argumento) ? NaN : a * base(argumento) + d;
  };
  const esIndefinida = b === 0 && argumentoEsAsintota(c);
  const esConstante = b === 0 && !argumentoEsAsintota(c);
  const senoCosenoConstante = !esTangente && a === 0;

  let periodo;
  let periodoStr;
  let desfase;
  let rango;

  if (esIndefinida) {
    periodo = null;
    periodoStr = 'no definido';
    desfase = 'no aplica';
    rango = 'no definido';
  } else if (esConstante || senoCosenoConstante) {
    periodo = null;
    periodoStr = 'no definido (función constante)';
    desfase = 'no aplica';

    const valorConstante = senoCosenoConstante ? d : fn(0);
    rango = Number.isFinite(valorConstante)
      ? `{${formatear(valorConstante)}}`
      : 'no definido';
  } else {
    periodo = esTangente
      ? Math.PI / Math.abs(b)
      : 2 * Math.PI / Math.abs(b);

    periodoStr = `${formatear(periodo)} (${formatear(periodo / Math.PI)}π)`;
    desfase = formatear(-c / b);

    rango = esTangente
      ? 'ℝ (con asíntotas)'
      : `[${formatear(d - Math.abs(a))}, ${formatear(d + Math.abs(a))}]`;
  }

  const amplitud = esTangente
    ? 'no definida'
    : formatear(Math.abs(a));

  const eq = `y = ${formatear(a)}·${nombreFn}(${formatear(b)}x ${c >= 0 ? '+' : '-'} ${formatear(Math.abs(c))}) ${d >= 0 ? '+' : '-'} ${formatear(Math.abs(d))}`;

  const items = [
    { k: 'Amplitud', v: amplitud },
    { k: 'Periodo', v: periodoStr },
    { k: 'Desfase horizontal', v: desfase },
    { k: 'Desplaz. vertical', v: formatear(d) },
    { k: 'Rango', v: rango },
    { k: 'Dominio', v: esIndefinida ? '∅' : (esTangente ? 'ℝ excepto las asíntotas verticales' : 'ℝ') }
  ];

  const pasos = [
    `Identificás la forma y = a·${nombreFn}(bx + c) + d con a=${formatear(a)}, b=${formatear(b)}, c=${formatear(c)}, d=${formatear(d)}`,
    esTangente
      ? 'Como es tangente, la amplitud no está definida'
      : `Amplitud = |a| = ${formatear(Math.abs(a))}`,
    esIndefinida
      ? 'La tangente no está definida porque el argumento constante coincide con una asíntota vertical'
      : esConstante || senoCosenoConstante
      ? 'La expresión es constante; por eso no tiene período fundamental ni desfase relevante'
      : `Periodo = ${esTangente ? 'π' : '2π'}/|b| = ${formatear(periodo)}`,
    esIndefinida || esConstante || senoCosenoConstante
      ? 'El desfase horizontal no aplica en este caso'
      : `Desfase horizontal = -c/b = ${desfase}`,
    `Desplazamiento vertical = d = ${formatear(d)}`,
    esIndefinida
      ? 'El dominio es vacío porque la expresión es indefinida para todo x'
      : esTangente
      ? 'El dominio excluye los valores que hacen bx + c = π/2 + kπ; en esos puntos hay asíntotas verticales'
      : `El rango se obtiene desplazando la amplitud: ${rango}`
  ];

  let y0;

  try {
    y0 = fn(0);
  } catch (e) {
    y0 = NaN;
  }

  const puntos = Number.isFinite(y0)
    ? [{ x: 0, y: y0, label: `(0, ${formatear(y0)})`, kind: 'intercept' }]
    : [];

  const centroTrazo = b === 0 ? 0 : -c / b;
  const medioTrazo = periodo ? periodo : 4;

  return {
    fn,
    eq,
    items,
    steps: pasos,
    points: puntos,
    discontinuous: esTangente && !esConstante && !esIndefinida,
    traceRange: { xMin: centroTrazo - medioTrazo, xMax: centroTrazo + medioTrazo },
    breakBetween: esTangente && !esConstante && !esIndefinida
      ? (x1, x2) => {
          const minimo = Math.min(b * x1 + c, b * x2 + c);
          const maximo = Math.max(b * x1 + c, b * x2 + c);
          const k = Math.ceil((minimo - Math.PI / 2) / Math.PI);
          const asintota = Math.PI / 2 + k * Math.PI;
          return asintota >= minimo && asintota <= maximo;
        }
      : null
  };
}
