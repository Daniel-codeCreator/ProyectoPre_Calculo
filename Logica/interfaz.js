import * as Lineal from './LogicaOperaciones/funcionesLineales.js';
import * as Cuadratica from './LogicaOperaciones/funcionesCuadraticas.js';
import * as Polinomial from './LogicaOperaciones/funcionesPolinomiales.js';
import * as Trigonometrica from './LogicaOperaciones/funcionesTrigonometricas.js';
import { crearMotorGrafico } from './motorCanvas.js';
import { calcularVistaAutomatica } from './vistaAutomatica.js';

const cuerpoEntrada = document.getElementById('inputBody');
const ecuacionSalida = document.getElementById('readoutEq');
const rejillaSalida = document.getElementById('readoutGrid');
const lienzo = document.getElementById('plotCanvas');
const botonGraficar = document.getElementById('graphBtn');

let tipoActual = 'lineal';
let gradoPolinomio = 2;

const configuracionPestanas = {
  lineal: Lineal,
  cuadratica: Cuadratica,
  polinomial: Polinomial,
  trigonometrica: Trigonometrica
};

function renderizarEntradas() {
  const modulo = configuracionPestanas[tipoActual];
  cuerpoEntrada.innerHTML = tipoActual === 'polinomial'
    ? modulo.renderizarCampos(gradoPolinomio)
    : modulo.renderizarCampos();

  if (tipoActual === 'polinomial') {
    document.getElementById('degUp').addEventListener('click', () => {
      if (gradoPolinomio < 8) { gradoPolinomio++; renderizarEntradas(); }
    });
    document.getElementById('degDown').addEventListener('click', () => {
      if (gradoPolinomio > 1) { gradoPolinomio--; renderizarEntradas(); }
    });
  }
}

function leerParametrosActuales() {
  const modulo = configuracionPestanas[tipoActual];
  return tipoActual === 'polinomial'
    ? modulo.leerParametros(gradoPolinomio)
    : modulo.leerParametros();
}

function actualizarResultado(eq, items, pasos) {
  ecuacionSalida.textContent = eq;
  const pasosHtml = (pasos || []).map((s, i) => `
    <div class="step-item">
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${s}</span>
    </div>`).join('');
  const gridHtml = items.map(it => `
    <div class="readout-item">
      <span class="k">${it.k}</span>
      <span class="v ${it.cls || ''}">${it.v}</span>
    </div>`).join('');
  rejillaSalida.innerHTML = `
    <div class="steps-list">${pasosHtml}</div>
    <div class="readout-divider"></div>
    ${gridHtml}`;
}

/* ---------------- motor de gráfico ---------------- */

const motor = crearMotorGrafico(lienzo);

function graficar() {
  const params = leerParametrosActuales();
  const resultado = configuracionPestanas[tipoActual].construir(params);
  actualizarResultado(resultado.eq, resultado.items, resultado.steps);

  const dimensiones = motor.obtenerDimensiones();
  const vistaAuto = calcularVistaAutomatica(tipoActual, params, resultado.fn, dimensiones);
  motor.ajustarVista(vistaAuto);
  motor.graficar(resultado);
}

/* ---------------- eventos: pestañas ---------------- */

document.querySelectorAll('.fn-tab').forEach(pestana => {
  pestana.addEventListener('click', () => {
    document.querySelectorAll('.fn-tab').forEach(t => t.classList.remove('active'));
    pestana.classList.add('active');
    tipoActual = pestana.dataset.type;
    renderizarEntradas();
    graficar();
  });
});

botonGraficar.addEventListener('click', graficar);

/* ---------------- atajo de teclado: Enter para graficar ---------------- */

cuerpoEntrada.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    graficar();
  }
});

/* ---------------- eventos: zoom, marcado, exportar ---------------- */

document.getElementById('zoomIn').addEventListener('click', () => motor.zoomIn());
document.getElementById('zoomOut').addEventListener('click', () => motor.zoomOut());
document.getElementById('zoomReset').addEventListener('click', () => motor.resetearVista());

document.getElementById('markBtn').addEventListener('click', () => {
  const valor = parseFloat(document.getElementById('markX').value);
  motor.marcarPuntoEnX(valor);
});
document.getElementById('markX').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    motor.marcarPuntoEnX(parseFloat(e.target.value));
  }
});
document.getElementById('clearMarksBtn').addEventListener('click', () => {
  motor.limpiarPuntosManuales();
});

document.getElementById('exportPngBtn').addEventListener('click', () => {
  motor.exportarPNG(`grafica-${tipoActual}.png`);
});

/* ---------------- inicio ---------------- */

export function iniciarAplicacion() {
  renderizarEntradas();
  motor.ajustarTamano();
  graficar();
}