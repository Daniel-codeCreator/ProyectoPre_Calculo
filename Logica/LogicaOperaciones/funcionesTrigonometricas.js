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
  const fn = x => a * base(b * x + c) + d;
  const periodo = nombreFn === 'tan' ? Math.PI / Math.abs(b || 1) : 2 * Math.PI / Math.abs(b || 1);
  const amplitud = nombreFn === 'tan' ? 'no definida' : formatear(Math.abs(a));
  const desfase = b !== 0 ? formatear(-c / b) : '—';
  const eq = `y = ${formatear(a)}·${nombreFn}(${formatear(b)}x ${c >= 0 ? '+' : '-'} ${formatear(Math.abs(c))}) ${d >= 0 ? '+' : '-'} ${formatear(Math.abs(d))}`;
  const items = [
    { k: 'Amplitud', v: amplitud },
    { k: 'Periodo', v: `${formatear(periodo)} (${formatear(periodo / Math.PI)}π)` },
    { k: 'Desfase horizontal', v: desfase },
    { k: 'Desplaz. vertical', v: formatear(d) },
    { k: 'Rango', v: nombreFn === 'tan' ? 'ℝ (con asíntotas)' : `[${formatear(d - Math.abs(a))}, ${formatear(d + Math.abs(a))}]` }
  ];
  const pasos = [
    `Identificás la forma y = a·${nombreFn}(bx + c) + d con a=${formatear(a)}, b=${formatear(b)}, c=${formatear(c)}, d=${formatear(d)}`,
    nombreFn === 'tan' ? `Como es tangente, la amplitud no está definida` : `Amplitud = |a| = ${formatear(Math.abs(a))}`,
    `Periodo = ${nombreFn === 'tan' ? 'π' : '2π'}/|b| = ${formatear(periodo)}`,
    `Desfase horizontal = -c/b = ${desfase}`,
    `Desplazamiento vertical = d = ${formatear(d)}`
  ];
  let y0;
  try { y0 = fn(0); } catch (e) { y0 = NaN; }
  const puntos = Number.isFinite(y0) ? [{ x: 0, y: y0, label: `(0, ${formatear(y0)})`, kind: 'intercept' }] : [];

  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: nombreFn === 'tan' };
}