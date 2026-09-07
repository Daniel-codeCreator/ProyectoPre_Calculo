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

    if (Math.abs(fm) < tolerancia || (b - a) / 2 < tolerancia) {
      return m;
    }

    if ((fa < 0) !== (fm < 0)) {
      b = m;
    } else {
      a = m;
      fa = fm;
    }
  }

  return (a + b) / 2;
}

function eliminarCerosIniciales(coeficientes, tolerancia = 1e-12) {
  let indice = 0;

  while (
    indice < coeficientes.length - 1 &&
    Math.abs(coeficientes[indice]) <= tolerancia
  ) {
    indice++;
  }

  return coeficientes.slice(indice);
}

function derivarPolinomio(coeficientes) {
  const grado = coeficientes.length - 1;

  if (grado <= 0) {
    return [0];
  }

  return coeficientes
    .slice(0, -1)
    .map((coeficiente, indice) => coeficiente * (grado - indice));
}

function agregarRaizSinDuplicar(raices, raiz, tolerancia = 1e-5) {
  if (!Number.isFinite(raiz)) return;

  if (!raices.some(r => Math.abs(r - raiz) < tolerancia)) {
    raices.push(raiz);
  }
}

export function encontrarRaicesReales(
  coeficientes,
  xMin = -60,
  xMax = 60,
  tolerancia = 1e-8
) {
  const coef = eliminarCerosIniciales(coeficientes);
  const grado = coef.length - 1;
  const raices = [];

  // Polinomio constante: no hay una raíz aislada que buscar.
  if (grado <= 0) {
    return raices;
  }

  // Caso lineal exacto.
  if (grado === 1) {
    const [a, b] = coef;

    if (Math.abs(a) <= tolerancia) {
      return raices;
    }

    const raiz = -b / a;

    if (raiz >= xMin - tolerancia && raiz <= xMax + tolerancia) {
      agregarRaizSinDuplicar(raices, raiz);
    }

    return raices;
  }

  /*
    Las raíces de la derivada dividen el eje x en intervalos donde
    el polinomio es monótono. Esto permite:
    1. detectar raíces que cruzan el eje x mediante bisección;
    2. detectar raíces pares cuando un punto crítico toca el eje x.
  */
  const coefDerivada = derivarPolinomio(coef);
  const puntosCriticos = encontrarRaicesReales(
    coefDerivada,
    xMin,
    xMax,
    tolerancia
  );

  const puntosDivision = [xMin, ...puntosCriticos, xMax]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  // Una raíz múltiple par suele coincidir con una raíz de la derivada.
  for (const x of puntosCriticos) {
    const y = evaluarPolinomio(coef, x);

    if (Number.isFinite(y) && Math.abs(y) <= 1e-6) {
      agregarRaizSinDuplicar(raices, x);
    }
  }

  // También comprobamos los extremos del intervalo.
  const yMin = evaluarPolinomio(coef, xMin);
  const yMax = evaluarPolinomio(coef, xMax);

  if (Number.isFinite(yMin) && Math.abs(yMin) <= 1e-6) {
    agregarRaizSinDuplicar(raices, xMin);
  }

  if (Number.isFinite(yMax) && Math.abs(yMax) <= 1e-6) {
    agregarRaizSinDuplicar(raices, xMax);
  }

  // En cada intervalo monótono puede existir como máximo una raíz simple.
  for (let i = 0; i < puntosDivision.length - 1; i++) {
    const a = puntosDivision[i];
    const b = puntosDivision[i + 1];

    if (Math.abs(b - a) <= tolerancia) continue;

    const fa = evaluarPolinomio(coef, a);
    const fb = evaluarPolinomio(coef, b);

    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;

    if ((fa < 0) !== (fb < 0)) {
      const raiz = biseccion(coef, a, b, tolerancia);
      agregarRaizSinDuplicar(raices, raiz);
    }
  }

  return raices.sort((a, b) => a - b);
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
    coeficientes.push(
      parseFloat(document.getElementById(`in_c${d}`).value) || 0
    );
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

    if (termino) {
      eq += termino;
      primero = false;
    }
  }

  if (eq === 'y = ') {
    eq = 'y = 0';
  }

  const raices = encontrarRaicesReales(coeficientes);
  const raicesStr = raices.length
    ? raices.map(r => formatear(r, 2)).join(', ')
    : 'ninguna encontrada en [-60, 60]';

  const items = [
    { k: 'Grado', v: String(grado) },
    { k: 'Raíces reales aprox.', v: raicesStr, cls: 'good' },
    {
      k: 'y-intersección',
      v: `(0, ${formatear(coeficientes[coeficientes.length - 1])})`
    },
    {
      k: 'Extremo dominante',
      v: grado % 2 === 0
        ? (coeficientes[0] > 0 ? 'ambos extremos ↑' : 'ambos extremos ↓')
        : (coeficientes[0] > 0 ? '↙ a ↗' : '↖ a ↘')
    }
  ];

  const pasos = [
    `Armás el polinomio de grado ${grado} con los coeficientes ingresados`,
    `Evaluás P(0) usando el término independiente → y-intersección = ${formatear(coeficientes[coeficientes.length - 1])}`,
    `Buscás puntos críticos con la derivada y revisás los intervalos entre ellos para detectar raíces simples y raíces múltiples`,
    `Raíces reales aproximadas encontradas en [-60, 60]: ${raicesStr}`
  ];

  const puntos = raices.map(r => ({
    x: r,
    y: 0,
    label: `(${formatear(r, 2)}, 0)`,
    kind: 'root'
  }));

  puntos.push({
    x: 0,
    y: coeficientes[coeficientes.length - 1],
    label: `(0, ${formatear(coeficientes[coeficientes.length - 1])})`,
    kind: 'intercept'
  });

  return {
    fn,
    eq,
    items,
    steps: pasos,
    points: puntos,
    discontinuous: false
  };
}
