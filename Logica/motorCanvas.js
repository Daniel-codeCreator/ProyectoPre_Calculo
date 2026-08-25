import { formatear } from './utilidades.js';

const COLORES_PUNTO = {
  vertex: '#ffb454',
  root: '#29e7cd',
  intercept: '#7c5cff',
  manual: '#ff5d7a'
};

export function crearMotorGrafico(lienzo) {
  const contexto = lienzo.getContext('2d');
  const vista = { cx: 0, cy: 0, escala: 60 };
  let graficaActiva = null;
  let puntosAutomaticos = [];
  let puntosManuales = [];
  let progresoDibujo = 1;
  let cuadroAnimacion = null;
  let escalaPixeles = window.devicePixelRatio || 1;

  /* ---------------- transformaciones de coordenadas ---------------- */

  function aPixeles(xm, ym, w, h) {
    return [
      w / 2 + (xm - vista.cx) * vista.escala,
      h / 2 - (ym - vista.cy) * vista.escala
    ];
  }
  function aMatematico(xp, yp, w, h) {
    return [
      (xp - w / 2) / vista.escala + vista.cx,
      -(yp - h / 2) / vista.escala + vista.cy
    ];
  }

  /* ---------------- tamaño del lienzo ---------------- */

  function ajustarTamano() {
    const rect = lienzo.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    escalaPixeles = window.devicePixelRatio || 1;
    lienzo.width = rect.width * escalaPixeles;
    lienzo.height = rect.height * escalaPixeles;
    contexto.setTransform(escalaPixeles, 0, 0, escalaPixeles, 0, 0);
    dibujar();
  }

  const observadorTamano = new ResizeObserver(() => ajustarTamano());
  observadorTamano.observe(lienzo.parentElement);
  window.addEventListener('resize', ajustarTamano);

  /* ---------------- cuadrícula ---------------- */

  function pasoAgradable(pxObjetivo, escala) {
    const unidadCruda = pxObjetivo / escala;
    const magnitud = Math.pow(10, Math.floor(Math.log10(unidadCruda)));
    const candidatos = [1, 2, 5, 10];
    let mejor = magnitud;
    for (const c of candidatos) {
      if (magnitud * c >= unidadCruda) { mejor = magnitud * c; break; }
      mejor = magnitud * c;
    }
    return mejor;
  }

  function dibujarCuadricula(w, h) {
    const paso = pasoAgradable(60, vista.escala);
    const menor = paso / 5;

    contexto.lineWidth = 1;

    contexto.strokeStyle = 'rgba(35,45,66,0.55)';
    contexto.beginPath();
    const [xMinM] = aMatematico(0, 0, w, h);
    const [xMaxM] = aMatematico(w, 0, w, h);
    const [, yMinM] = aMatematico(0, h, w, h);
    const [, yMaxM] = aMatematico(0, 0, w, h);
    for (let x = Math.floor(xMinM / menor) * menor; x <= xMaxM; x += menor) {
      const [px] = aPixeles(x, 0, w, h);
      contexto.moveTo(px, 0); contexto.lineTo(px, h);
    }
    for (let y = Math.floor(yMinM / menor) * menor; y <= yMaxM; y += menor) {
      const [, py] = aPixeles(0, y, w, h);
      contexto.moveTo(0, py); contexto.lineTo(w, py);
    }
    contexto.stroke();

    contexto.strokeStyle = 'rgba(58,72,102,0.7)';
    contexto.beginPath();
    for (let x = Math.floor(xMinM / paso) * paso; x <= xMaxM; x += paso) {
      const [px] = aPixeles(x, 0, w, h);
      contexto.moveTo(px, 0); contexto.lineTo(px, h);
    }
    for (let y = Math.floor(yMinM / paso) * paso; y <= yMaxM; y += paso) {
      const [, py] = aPixeles(0, y, w, h);
      contexto.moveTo(0, py); contexto.lineTo(w, py);
    }
    contexto.stroke();

    contexto.fillStyle = '#6b7690';
    contexto.font = '11px JetBrains Mono, monospace';
    contexto.textBaseline = 'top';
    for (let x = Math.floor(xMinM / paso) * paso; x <= xMaxM; x += paso) {
      if (Math.abs(x) < paso / 100) continue;
      const [px] = aPixeles(x, 0, w, h);
      const [, py0] = aPixeles(0, 0, w, h);
      contexto.fillText(formatear(x, 2), px + 3, Math.min(Math.max(py0 + 3, 3), h - 14));
    }
    contexto.textBaseline = 'bottom';
    for (let y = Math.floor(yMinM / paso) * paso; y <= yMaxM; y += paso) {
      if (Math.abs(y) < paso / 100) continue;
      const [px0] = aPixeles(0, 0, w, h);
      const [, py] = aPixeles(0, y, w, h);
      contexto.fillText(formatear(y, 2), Math.min(Math.max(px0 + 4, 3), w - 30), py - 2);
    }

    contexto.strokeStyle = '#4a5b82';
    contexto.lineWidth = 1.5;
    contexto.beginPath();
    const [ox] = aPixeles(0, 0, w, h);
    const [, oy] = aPixeles(0, 0, w, h);
    contexto.moveTo(ox, 0); contexto.lineTo(ox, h);
    contexto.moveTo(0, oy); contexto.lineTo(w, oy);
    contexto.stroke();
  }

  /* ---------------- curva ---------------- */

  function dibujarCurva(w, h) {
    if (!graficaActiva) return;
    const { fn, discontinuous } = graficaActiva;
    const segmentos = [];
    let actual = [];
    const muestras = Math.floor(w);
    const saltoMaximo = h * 3;
    let pyAnterior = null;

    for (let px = 0; px <= muestras; px++) {
      const [xm] = aMatematico(px, 0, w, h);
      let y;
      try { y = fn(xm); } catch (e) { y = NaN; }
      if (!Number.isFinite(y)) {
        if (actual.length > 1) segmentos.push(actual);
        actual = [];
        pyAnterior = null;
        continue;
      }
      const [, py] = aPixeles(xm, y, w, h);
      if (discontinuous && pyAnterior !== null && Math.abs(py - pyAnterior) > saltoMaximo) {
        if (actual.length > 1) segmentos.push(actual);
        actual = [];
      }
      actual.push([px, py]);
      pyAnterior = py;
    }
    if (actual.length > 1) segmentos.push(actual);

    const totalPuntos = segmentos.reduce((s, seg) => s + seg.length, 0);
    const puntosVisibles = Math.floor(totalPuntos * progresoDibujo);

    contexto.save();
    contexto.lineJoin = 'round';
    contexto.lineCap = 'round';
    contexto.shadowColor = 'rgba(124,92,255,0.9)';
    contexto.shadowBlur = 12;
    contexto.strokeStyle = '#7c5cff';
    contexto.lineWidth = 2.6;

    let dibujados = 0;
    for (const seg of segmentos) {
      if (dibujados >= puntosVisibles) break;
      const restantes = puntosVisibles - dibujados;
      const pts = seg.slice(0, Math.max(2, restantes));
      contexto.beginPath();
      contexto.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) contexto.lineTo(pts[i][0], pts[i][1]);
      contexto.stroke();
      dibujados += seg.length;
    }

    contexto.shadowBlur = 0;
    contexto.strokeStyle = 'rgba(220,215,255,0.85)';
    contexto.lineWidth = 1;
    dibujados = 0;
    for (const seg of segmentos) {
      if (dibujados >= puntosVisibles) break;
      const restantes = puntosVisibles - dibujados;
      const pts = seg.slice(0, Math.max(2, restantes));
      contexto.beginPath();
      contexto.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) contexto.lineTo(pts[i][0], pts[i][1]);
      contexto.stroke();
      dibujados += seg.length;
    }
    contexto.restore();
  }

  /* ---------------- puntos marcados ---------------- */

  function trazarRectanguloRedondeado(x, y, w, h, r) {
    contexto.beginPath();
    contexto.moveTo(x + r, y);
    contexto.arcTo(x + w, y, x + w, y + h, r);
    contexto.arcTo(x + w, y + h, x, y + h, r);
    contexto.arcTo(x, y + h, x, y, r);
    contexto.arcTo(x, y, x + w, y, r);
    contexto.closePath();
  }

  function dibujarPunto(px, py, color, etiquetaTexto, w, h) {
    contexto.save();
    contexto.beginPath();
    contexto.arc(px, py, 5, 0, Math.PI * 2);
    contexto.shadowColor = color;
    contexto.shadowBlur = 12;
    contexto.fillStyle = color;
    contexto.fill();
    contexto.shadowBlur = 0;
    contexto.lineWidth = 2;
    contexto.strokeStyle = '#0a0e17';
    contexto.stroke();
    contexto.restore();

    if (!etiquetaTexto) return;
    contexto.font = '11px "JetBrains Mono", monospace';
    const anchoTexto = contexto.measureText(etiquetaTexto).width;
    const padX = 7, altoCaja = 19;
    let lx = px - anchoTexto / 2 - padX;
    let ly = py - altoCaja - 12;
    lx = Math.max(4, Math.min(w - anchoTexto - padX * 2 - 4, lx));
    ly = Math.max(4, Math.min(h - altoCaja - 4, ly));
    trazarRectanguloRedondeado(lx, ly, anchoTexto + padX * 2, altoCaja, 5);
    contexto.fillStyle = 'rgba(15,20,32,0.94)';
    contexto.fill();
    contexto.lineWidth = 1;
    contexto.strokeStyle = color;
    contexto.stroke();
    contexto.fillStyle = color;
    contexto.textBaseline = 'middle';
    contexto.fillText(etiquetaTexto, lx + padX, ly + altoCaja / 2 + 1);
  }

  function dibujarMarcadores(w, h) {
    for (const p of puntosAutomaticos) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      const [px, py] = aPixeles(p.x, p.y, w, h);
      if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
      dibujarPunto(px, py, COLORES_PUNTO[p.kind] || COLORES_PUNTO.intercept, p.label, w, h);
    }
    for (const p of puntosManuales) {
      const [px, py] = aPixeles(p.x, p.y, w, h);
      if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
      dibujarPunto(px, py, COLORES_PUNTO.manual, p.label, w, h);
    }
  }

  /* ---------------- ciclo de dibujo ---------------- */

  function dibujar() {
    const w = lienzo.width / escalaPixeles;
    const h = lienzo.height / escalaPixeles;
    contexto.clearRect(0, 0, w, h);
    dibujarCuadricula(w, h);
    dibujarCurva(w, h);
    dibujarMarcadores(w, h);
  }

  function animarDibujo() {
    progresoDibujo = 0;
    const duracion = 650;
    const inicio = performance.now();
    if (cuadroAnimacion) cancelAnimationFrame(cuadroAnimacion);
    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      progresoDibujo = 1 - Math.pow(1 - t, 3);
      dibujar();
      if (t < 1) cuadroAnimacion = requestAnimationFrame(paso);
    }
    cuadroAnimacion = requestAnimationFrame(paso);
  }

  /* ---------------- puntos manuales ---------------- */

  function agregarPuntoManual(valorX) {
    if (!graficaActiva || !Number.isFinite(valorX)) return;
    let y;
    try { y = graficaActiva.fn(valorX); } catch (e) { y = NaN; }
    if (!Number.isFinite(y)) return;
    puntosManuales.push({ x: valorX, y, label: `(${formatear(valorX, 2)}, ${formatear(y, 2)})` });
    if (puntosManuales.length > 6) puntosManuales.shift();
    dibujar();
  }

  function alternarPuntoEnPixel(clicX, clicY, w, h) {
    const indiceCercano = puntosManuales.findIndex(p => {
      const [ppx, ppy] = aPixeles(p.x, p.y, w, h);
      return Math.hypot(ppx - clicX, ppy - clicY) < 14;
    });
    if (indiceCercano >= 0) { puntosManuales.splice(indiceCercano, 1); dibujar(); return true; }
    const [xm] = aMatematico(clicX, clicY, w, h);
    agregarPuntoManual(xm);
    return false;
  }

  /* ---------------- zoom con anclaje en un punto de pantalla ---------------- */

  function zoomEnPunto(factor, pixelX, pixelY, w, h) {
    const [mx, my] = aMatematico(pixelX, pixelY, w, h);
    vista.escala = Math.min(400, Math.max(6, vista.escala * factor));
    vista.cx = mx - (pixelX - w / 2) / vista.escala;
    vista.cy = my - (h / 2 - pixelY) / vista.escala;
  }

  /* ---------------- interacción: mouse ---------------- */

  let arrastrando = false;
  let arrastreMovido = false;
  let inicioArrastre = null;

  lienzo.addEventListener('mousedown', e => {
    arrastrando = true;
    arrastreMovido = false;
    inicioArrastre = { x: e.clientX, y: e.clientY, cx: vista.cx, cy: vista.cy };
    lienzo.classList.add('grabbing');
  });

  window.addEventListener('mouseup', e => {
    if (arrastrando && !arrastreMovido) {
      const rect = lienzo.getBoundingClientRect();
      const clicX = e.clientX - rect.left;
      const clicY = e.clientY - rect.top;
      if (clicX >= 0 && clicY >= 0 && clicX <= rect.width && clicY <= rect.height && graficaActiva) {
        alternarPuntoEnPixel(clicX, clicY, rect.width, rect.height);
      }
    }
    arrastrando = false;
    lienzo.classList.remove('grabbing');
  });

  window.addEventListener('mousemove', e => {
    if (!arrastrando) return;
    const ddx = e.clientX - inicioArrastre.x;
    const ddy = e.clientY - inicioArrastre.y;
    if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) arrastreMovido = true;
    vista.cx = inicioArrastre.cx - ddx / vista.escala;
    vista.cy = inicioArrastre.cy + ddy / vista.escala;
    dibujar();
  });

  lienzo.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = lienzo.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomEnPunto(factor, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    dibujar();
  }, { passive: false });

  /* ---------------- interacción: touch (pan + pinch + tap) ---------------- */

  let touchModo = null; // 'pan' | 'pinch'
  let touchInicioArrastre = null;
  let touchMovido = false;
  let pinchDistanciaInicial = 0;
  let pinchEscalaInicial = 60;

  function distanciaEntreToques(t0, t1) {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }
  function puntoMedioToques(t0, t1, rect) {
    return {
      x: (t0.clientX + t1.clientX) / 2 - rect.left,
      y: (t0.clientY + t1.clientY) / 2 - rect.top
    };
  }

  lienzo.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      touchModo = 'pan';
      touchMovido = false;
      touchInicioArrastre = { x: e.touches[0].clientX, y: e.touches[0].clientY, cx: vista.cx, cy: vista.cy };
    } else if (e.touches.length === 2) {
      touchModo = 'pinch';
      pinchDistanciaInicial = distanciaEntreToques(e.touches[0], e.touches[1]);
      pinchEscalaInicial = vista.escala;
    }
  }, { passive: false });

  lienzo.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = lienzo.getBoundingClientRect();

    if (touchModo === 'pan' && e.touches.length === 1) {
      const ddx = e.touches[0].clientX - touchInicioArrastre.x;
      const ddy = e.touches[0].clientY - touchInicioArrastre.y;
      if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) touchMovido = true;
      vista.cx = touchInicioArrastre.cx - ddx / vista.escala;
      vista.cy = touchInicioArrastre.cy + ddy / vista.escala;
      dibujar();
    } else if (touchModo === 'pinch' && e.touches.length === 2) {
      touchMovido = true;
      const distanciaActual = distanciaEntreToques(e.touches[0], e.touches[1]);
      const medio = puntoMedioToques(e.touches[0], e.touches[1], rect);
      const [mx, my] = aMatematico(medio.x, medio.y, rect.width, rect.height);
      const factor = distanciaActual / (pinchDistanciaInicial || 1);
      vista.escala = Math.min(400, Math.max(6, pinchEscalaInicial * factor));
      vista.cx = mx - (medio.x - rect.width / 2) / vista.escala;
      vista.cy = my - (rect.height / 2 - medio.y) / vista.escala;
      dibujar();
    }
  }, { passive: false });

  lienzo.addEventListener('touchend', e => {
    if (touchModo === 'pan' && !touchMovido && graficaActiva) {
      const rect = lienzo.getBoundingClientRect();
      const t = touchInicioArrastre;
      alternarPuntoEnPixel(t.x - rect.left, t.y - rect.top, rect.width, rect.height);
    }
    if (e.touches.length === 0) touchModo = null;
  });

  /* ---------------- API pública ---------------- */

  return {
    graficar(resultado) {
      graficaActiva = { fn: resultado.fn, discontinuous: resultado.discontinuous };
      puntosAutomaticos = resultado.points || [];
      puntosManuales = [];
      animarDibujo();
    },
    marcarPuntoEnX(valorX) { agregarPuntoManual(valorX); },
    limpiarPuntosManuales() { puntosManuales = []; dibujar(); },
    ajustarVista({ cx, cy, escala }) {
      vista.cx = cx; vista.cy = cy; vista.escala = escala;
    },
    zoomIn() {
      const rect = lienzo.getBoundingClientRect();
      zoomEnPunto(1.25, rect.width / 2, rect.height / 2, rect.width, rect.height);
      dibujar();
    },
    zoomOut() {
      const rect = lienzo.getBoundingClientRect();
      zoomEnPunto(1 / 1.25, rect.width / 2, rect.height / 2, rect.width, rect.height);
      dibujar();
    },
    resetearVista() {
      vista.cx = 0; vista.cy = 0; vista.escala = 60;
      dibujar();
    },
    obtenerDimensiones() {
      const rect = lienzo.getBoundingClientRect();
      return { ancho: rect.width, alto: rect.height };
    },
    ajustarTamano,
    dibujar,
    exportarPNG(nombreArchivo = 'grafica.png') {
      lienzo.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
      }, 'image/png');
    }
  };
}