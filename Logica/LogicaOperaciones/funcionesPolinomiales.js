import { formatear, terminoConSigno } from '../utilidades.js';

export const etiqueta = 'Polinomial';

export function evaluarPolinomio(coeficientes, x) {
  // coeficientes[0] = coeficiente de mayor grado
  let resultado = 0;
  for (const c of coeficientes) resultado = resultado * x + c;
  return resultado;
}

export function biseccion(coeficientes, a, b, tolerancia = 1e-8, maxIteraciones = 100) {
  let fa = evaluarPolinomio(coeficientes, a);
  for (let i = 0; i < maxIteraciones; i++) {
    const m = (a + b) / 2;
    const fm = evaluarPolinomio(coeficientes, m);
    if (Math.abs(fm) < tolerancia || (b - a) / 2 < tolerancia) return m;
    if ((fa < 0) !== (fm < 0)) { b = m; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

export function encontrarRaicesReales(coeficientes, xMin = -60, xMax = 60, pasos = 12000) {
  const raices = [];
  const paso = (xMax - xMin) / pasos;
  let xAnterior = xMin, yAnterior = evaluarPolinomio(coeficientes, xMin);
  for (let i = 1; i <= pasos; i++) {
    const x = xMin + i * paso;
    const y = evaluarPolinomio(coeficientes, x);
    if (Number.isFinite(yAnterior) && Math.abs(yAnterior) < 1e-9) {
      raices.push(xAnterior);
    } else if (Number.isFinite(yAnterior) && Number.isFinite(y) && ((yAnterior < 0) !== (y < 0))) {
      raices.push(biseccion(coeficientes, xAnterior, x));
    }
    xAnterior = x; yAnterior = y;
  }
  const sinDuplicados = [];
  for (const r of raices) {
    if (!sinDuplicados.some(d => Math.abs(d - r) < 1e-4)) sinDuplicados.push(r);
  }
  return sinDuplicados.sort((a, b) => a - b);
}

export function renderizarCampos(grado) {
  let filas = '';
  for (let d = grado; d >= 0; d--) {
    filas += `
      <div class="poly-term-row">
        <span class="term-label">x^${d}</span>
        <input type="number" id="in_c${d}" value="${d === grado ? 1 : 0}" step="0.1">
      </div>`;
  }
  return `
    <div class="degree-stepper">
      <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim)">Grado</span>
      <div style="display:flex;align-items:center;gap:10px;">
        <button id="degDown" type="button">−</button>
        <span class="degree-val" id="degVal">${grado}</span>
        <button id="degUp" type="button">+</button>
      </div>
    </div>
    <div class="poly-terms">${filas}</div>`;
}

export function leerParametros(grado) {
  const coeficientes = [];
  for (let d = grado; d >= 0; d--) {
    coeficientes.push(parseFloat(document.getElementById(`in_c${d}`).value) || 0);
  }
  return { coeffs: coeficientes };
}

export function construir(params) {
  const { coeffs: coeficientes } = params;
  const grado = coeficientes.length - 1;
  const fn = x => evaluarPolinomio(coeficientes, x);

  let eq = 'y = ';
  let primero = true;
  for (let i = 0; i < coeficientes.length; i++) {
    const d = grado - i;
    const simbolo = d === 0 ? '' : (d === 1 ? 'x' : `x^${d}`);
    const termino = terminoConSigno(coeficientes[i], simbolo, primero);
    if (termino) { eq += termino; primero = false; }
  }
  if (eq === 'y = ') eq = 'y = 0';

  const raices = encontrarRaicesReales(coeficientes);
  const raicesStr = raices.length
    ? raices.map(r => formatear(r, 2)).join(', ')
    : 'ninguna en el rango visible';

  const items = [
    { k: 'Grado', v: String(grado) },
    { k: 'Raíces reales aprox.', v: raicesStr, cls: 'good' },
    { k: 'y-intersección', v: `(0, ${formatear(coeficientes[coeficientes.length - 1])})` },
    { k: 'Extremo dominante', v: grado % 2 === 0
        ? (coeficientes[0] > 0 ? 'ambos extremos ↑' : 'ambos extremos ↓')
        : (coeficientes[0] > 0 ? '↙ a ↗' : '↖ a ↘') }
  ];
  const pasos = [
    `Armás el polinomio de grado ${grado} con los coeficientes ingresados`,
    `Evaluás P(0) usando el término independiente → y-intersección = ${formatear(coeficientes[coeficientes.length - 1])}`,
    `Barrés valores de x buscando cambios de signo en P(x) y afinás cada uno por bisección`,
    `Raíces reales aproximadas encontradas: ${raicesStr}`
  ];
  const puntos = raices.map(r => ({ x: r, y: 0, label: `(${formatear(r, 2)}, 0)`, kind: 'root' }));
  puntos.push({ x: 0, y: coeficientes[coeficientes.length - 1], label: `(0, ${formatear(coeficientes[coeficientes.length - 1])})`, kind: 'intercept' });

  return { fn, eq, items, steps: pasos, points: puntos, discontinuous: false };
}