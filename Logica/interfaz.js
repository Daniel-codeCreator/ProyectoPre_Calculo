import * as Lineal from './LogicaOperaciones/funcionesLineales.js';
import * as Cuadratica from './LogicaOperaciones/funcionesCuadraticas.js';
import * as Polinomial from './LogicaOperaciones/funcionesPolinomiales.js';
import * as Trigonometrica from './LogicaOperaciones/funcionesTrigonometricas.js';
import { crearMotorGrafico } from './motorCanvas.js';
import { calcularVistaAutomatica } from './vistaAutomatica.js';
import { exportarPDF } from './generatePDF.js';  

const cuerpoEntrada = document.getElementById('inputBody');
const ecuacionSalida = document.getElementById('readoutEq');
const rejillaSalida = document.getElementById('readoutGrid');
const lienzo = document.getElementById('plotCanvas');
const botonGraficar = document.getElementById('graphBtn');
const botonAleatorio = document.getElementById('randomBtn');
const textoTutor = document.getElementById('tutorText');

const documentWord = document.getElementById('documentBtn');


//va al documento PDF 
if (documentWord) {
    documentWord.addEventListener('click', () => {
        window.open(
            'https://umgt-my.sharepoint.com/:w:/g/personal/ebocb_miumg_edu_gt/IQBgt5dIOwNdTK4-6m8HtaJuAbj0eHObjEwZ6DJjQNOtZPk?e=1JjMAP',
            '_blank',
            'noopener,noreferrer'
        );
    });
}

let tipoActual = 'lineal';
let gradoPolinomio = 2;
let ultimoResultado = null;

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
  ultimoResultado = resultado;
  actualizarResultado(resultado.eq, resultado.items, resultado.steps);
  document.querySelector('#legend span:last-child').textContent = `${configuracionPestanas[tipoActual].etiqueta} · vista automática`;
  textoTutor.textContent = {
    lineal: 'Revisá la pendiente: define si la recta sube, baja o se mantiene constante.',
    cuadratica: 'El discriminante identifica las raíces y el vértice marca el punto clave de la parábola.',
    polinomial: 'Localizá primero las intersecciones con el eje x y luego observá cómo se comportan los extremos.',
    trigonometrica: 'Mirá amplitud, período y desfase. En tangente, respetá siempre las asíntotas.'
  }[tipoActual];

  const dimensiones = motor.obtenerDimensiones();
  const vistaAuto = calcularVistaAutomatica(
    tipoActual,
    params,
    resultado.fn,
    dimensiones,
    resultado.traceRange,
    resultado.points
  );
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

function enteroAleatorio(minimo, maximo, excluirCero = false) {
  let valor;
  do {
    valor = Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
  } while (excluirCero && valor === 0);
  return valor;
}

function asignarCampo(id, valor) {
  document.getElementById(id).value = valor;
}

function generarEjercicioAleatorio() {
  if (tipoActual === 'lineal') {
    asignarCampo('in_m', enteroAleatorio(-6, 6, true));
    asignarCampo('in_b', enteroAleatorio(-10, 10));
  } else if (tipoActual === 'cuadratica') {
    asignarCampo('in_a', enteroAleatorio(-4, 4, true));
    asignarCampo('in_b', enteroAleatorio(-10, 10));
    asignarCampo('in_c', enteroAleatorio(-10, 10));
  } else if (tipoActual === 'polinomial') {
    gradoPolinomio = enteroAleatorio(2, 5);
    renderizarEntradas();
    for (let d = gradoPolinomio; d >= 0; d--) {
      asignarCampo(`in_c${d}`, d === gradoPolinomio
        ? enteroAleatorio(-3, 3, true)
        : enteroAleatorio(-8, 8));
    }
  } else {
    const funciones = ['sin', 'cos', 'tan'];
    asignarCampo('in_fn', funciones[enteroAleatorio(0, funciones.length - 1)]);
    asignarCampo('in_a', enteroAleatorio(-4, 4, true));
    asignarCampo('in_b', enteroAleatorio(-4, 4, true));
    asignarCampo('in_c', enteroAleatorio(-6, 6) / 2);
    asignarCampo('in_d', enteroAleatorio(-6, 6));
  }
  graficar();
}

botonAleatorio.addEventListener('click', generarEjercicioAleatorio);

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


//exporta la imgagen solo del la GRAFICA
document.getElementById('exportPngBtn').addEventListener('click', () => {
  motor.exportarPNG(`grafica-${tipoActual}.png`);
});

document.getElementById('exportPdfBtn').addEventListener('click', async () => {
  if (!ultimoResultado) return;
  const boton = document.getElementById('exportPdfBtn');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = '...';
  try {
    motor.prepararExportacion();
    await exportarPDF({
      tipo: tipoActual.toUpperCase(), // Se pasa el string directo
      eq: ultimoResultado.eq,
      items: ultimoResultado.items,
      pasos: ultimoResultado.steps,
      lienzo: document.getElementById('plotCanvas'),
      nombreArchivo: `precalculo-${tipoActual}.pdf`
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Ocurrió un error al generar el PDF. Revisa la consola.');
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});
/* ---------------- inicio ---------------- */

export function iniciarAplicacion() {
  renderizarEntradas();
  motor.ajustarTamano();
  graficar();
}
