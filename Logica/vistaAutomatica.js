function muestrearRango(fn, xMin, xMax, n = 320) {
  const ys = [];
  const paso = (xMax - xMin) / n;

  for (let i = 0; i <= n; i++) {
    const x = xMin + i * paso;
    let y;

    try {
      y = fn(x);
    } catch (e) {
      y = NaN;
    }

    if (Number.isFinite(y)) {
      ys.push(y);
    }
  }

  return ys;
}

function percentil(ordenado, p) {
  if (!ordenado.length) return 0;

  const idx = (ordenado.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);

  if (lo === hi) return ordenado[lo];

  return ordenado[lo] + (ordenado[hi] - ordenado[lo]) * (idx - lo);
}

export function calcularVistaAutomatica(tipo, params, fn, dimensiones, traceRange = null, points = []) {
  let centroX = 0;
  let rangoMedioX = 8;

  if (tipo === 'lineal') {
    rangoMedioX = 10;
  } else if (tipo === 'cuadratica' && params.a) {
    centroX = -params.b / (2 * params.a);
    rangoMedioX = Math.min(
      20,
      Math.max(3, 6 / Math.sqrt(Math.abs(params.a)))
    );
  } else if (tipo === 'polinomial') {
    const grado = params.coeffs.length - 1;
    const raices = encontrarRaicesReales(params.coeffs);

    if (raices.length) {
      const primera = raices[0];
      const ultima = raices[raices.length - 1];
      centroX = (primera + ultima) / 2;
      // Encuadra las raíces y la curvatura cercana, no los extremos lejanos.
      rangoMedioX = Math.min(14, Math.max(2, (ultima - primera) / 2 + 0.75));
    } else {
      rangoMedioX = Math.min(12, Math.max(4, 3 + grado));
    }
  } else if (tipo === 'trigonometrica') {
    if (params.b === 0) {
      // Si b = 0, la función es constante respecto de x.
      rangoMedioX = 10;
    } else {
      const periodo = params.fn === 'tan'
        ? Math.PI / Math.abs(params.b)
        : 2 * Math.PI / Math.abs(params.b);

      rangoMedioX = Math.min(30, Math.max(4, periodo * 1.8));
    }
  }

  if (
    traceRange &&
    Number.isFinite(traceRange.xMin) &&
    Number.isFinite(traceRange.xMax) &&
    traceRange.xMax > traceRange.xMin
  ) {
    centroX = (traceRange.xMin + traceRange.xMax) / 2;
    rangoMedioX = (traceRange.xMax - traceRange.xMin) / 2 * 1.12;
  }

  const puntosFinitos = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (puntosFinitos.length) {
    const xMinPunto = Math.min(...puntosFinitos.map(p => p.x));
    const xMaxPunto = Math.max(...puntosFinitos.map(p => p.x));
    const xMinVista = Math.min(centroX - rangoMedioX, xMinPunto);
    const xMaxVista = Math.max(centroX + rangoMedioX, xMaxPunto);
    centroX = (xMinVista + xMaxVista) / 2;
    rangoMedioX = Math.max(1, (xMaxVista - xMinVista) / 2 * 1.08);
  }

  const ys = muestrearRango(
    fn,
    centroX - rangoMedioX,
    centroX + rangoMedioX
  ).sort((a, b) => a - b);

  let yBajo = percentil(ys, 0.04);
  let yAlto = percentil(ys, 0.96);

  if (puntosFinitos.length) {
    yBajo = Math.min(yBajo, ...puntosFinitos.map(p => p.y));
    yAlto = Math.max(yAlto, ...puntosFinitos.map(p => p.y));
  }

  if (
    !Number.isFinite(yBajo) ||
    !Number.isFinite(yAlto) ||
    yAlto - yBajo < 1e-6
  ) {
    yBajo = -5;
    yAlto = 5;
  }

  const relleno = Math.max((yAlto - yBajo) * 0.18, 0.5);
  yBajo -= relleno;
  yAlto += relleno;

  const centroY = (yBajo + yAlto) / 2;
  const rangoY = Math.max(yAlto - yBajo, rangoMedioX * 0.2);

  const w = dimensiones.ancho || 560;
  const h = dimensiones.alto || 380;

  const escalaX = (w * 0.88) / (2 * rangoMedioX);
  const escalaY = (h * 0.88) / rangoY;

  return {
    cx: centroX,
    cy: centroY,
    escala: Math.min(400, Math.max(6, Math.min(escalaX, escalaY)))
  };
}
import { encontrarRaicesReales } from './LogicaOperaciones/funcionesPolinomiales.js';
