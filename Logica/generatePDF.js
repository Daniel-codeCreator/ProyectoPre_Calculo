const ANCHO = 595.28;  // A4 en puntos
const ALTO = 841.89;
const MARGEN = 50;

// Reemplaza símbolos y flechas unicode no soportados por las fuentes PDF estándar (WinAnsi)
function limpiarTextoUnicode(str) {
  if (!str) return '';
  return String(str)
    // Flechas horizontales y diagonales
    .replace(/[→⇒]/g, '->')
    .replace(/[←⇐]/g, '<-')
    .replace(/[↘↗↙↖]/g, '\\')
    .replace(/[↑↓]/g, '|')
    // Operadores matemáticosx|
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/±/g, '+/-')
    .replace(/∞/g, 'inf')
    .replace(/·/g, '-')
    // Elimina cualquier otro carácter fuera del rango ASCII / Latin-1 seguro
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function envolverTexto(texto, fuente, tamano, anchoMax) {
  const textoLimpio = limpiarTextoUnicode(texto);
  const palabras = textoLimpio.split(' ');
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (fuente.widthOfTextAtSize(prueba, tamano) > anchoMax && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function dataUrlABytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function descargarArchivo(bytes, nombreArchivo) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export async function exportarPDF({ tipo, eq, items, pasos, lienzo, nombreArchivo = 'reporte-precalculo.pdf' }) {
  const libreria = window.PDFLib;
  if (!libreria) {
    alert('No se pudo cargar la librería de PDF (revisá tu conexión a internet e intentá de nuevo).');
    return;
  }
  const { PDFDocument, StandardFonts, rgb } = libreria;

  const pdfDoc = await PDFDocument.create();
  const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colorTitulo = rgb(0.11, 0.09, 0.35);
  const colorSubtitulo = rgb(0.35, 0.30, 0.75);
  const colorTexto = rgb(0.15, 0.15, 0.18);
  const colorMuted = rgb(0.45, 0.45, 0.52);

  let pagina = pdfDoc.addPage([ANCHO, ALTO]);
  let y = ALTO - 55;

  function nuevaPaginaSiNecesario(espacioNecesario) {
    if (y - espacioNecesario < 45) {
      pagina = pdfDoc.addPage([ANCHO, ALTO]);
      y = ALTO - 55;
    }
  }

  // ---------- ENCABEZADO ----------
  pagina.drawText('Pre-Cálculo · Reporte de Función', { x: MARGEN, y, size: 18, font: fuenteNegrita, color: colorTitulo });
  y -= 20;
  const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
  pagina.drawText(`Tipo de función: ${limpiarTextoUnicode(tipo)}   ·   ${fecha}`, { x: MARGEN, y, size: 10, font: fuente, color: colorMuted });
  y -= 28;

  // ---------- ECUACIÓN ----------
  if (eq) {
    nuevaPaginaSiNecesario(50);
    pagina.drawText('ECUACIÓN', { x: MARGEN, y, size: 11, font: fuenteNegrita, color: colorSubtitulo });
    y -= 18;
    pagina.drawText(limpiarTextoUnicode(eq), { x: MARGEN, y, size: 15, font: fuenteNegrita, color: colorTexto });
    y -= 30;
  }

  // ---------- PROCEDIMIENTO (PASOS 1, 2, 3...) ----------
  if (pasos && pasos.length > 0) {
    nuevaPaginaSiNecesario(40);
    pagina.drawText('PROCEDIMIENTO', { x: MARGEN, y, size: 11, font: fuenteNegrita, color: colorSubtitulo });
    y -= 18;
    pasos.forEach((paso, i) => {
      const lineas = envolverTexto(paso, fuente, 10, ANCHO - MARGEN * 2 - 20);
      nuevaPaginaSiNecesario(14 * lineas.length + 6);
      pagina.drawText(`${i + 1}.`, { x: MARGEN, y, size: 10, font: fuenteNegrita, color: colorTexto });
      lineas.forEach(linea => {
        pagina.drawText(linea, { x: MARGEN + 18, y, size: 10, font: fuente, color: colorTexto });
        y -= 13;
      });
      y -= 5;
    });
    y -= 10;
  }

  // ---------- ANÁLISIS DE RESULTADOS ----------
  if (items && items.length > 0) {
    nuevaPaginaSiNecesario(40);
    pagina.drawText('ANÁLISIS DE RESULTADOS', { x: MARGEN, y, size: 11, font: fuenteNegrita, color: colorSubtitulo });
    y -= 18;
    items.forEach(item => {
      nuevaPaginaSiNecesario(16);
      pagina.drawText(limpiarTextoUnicode(item.k), { x: MARGEN, y, size: 10.5, font: fuente, color: colorMuted });
      pagina.drawText(limpiarTextoUnicode(item.v), { x: MARGEN + 230, y, size: 10.5, font: fuenteNegrita, color: colorTexto });
      y -= 16;
    });
    y -= 14;
  }

  // ---------- GRÁFICA ----------
  if (lienzo && lienzo.width > 0 && lienzo.height > 0) {
    nuevaPaginaSiNecesario(60);
    pagina.drawText('GRÁFICA', { x: MARGEN, y, size: 11, font: fuenteNegrita, color: colorSubtitulo });
    y -= 16;

    try {
      const dataUrl = lienzo.toDataURL('image/png');
      const imagenPng = await pdfDoc.embedPng(dataUrlABytes(dataUrl));
      const anchoDisponible = ANCHO - MARGEN * 2;
      const escala = anchoDisponible / imagenPng.width;
      const altoImg = imagenPng.height * escala;

      nuevaPaginaSiNecesario(altoImg + 10);
      pagina.drawImage(imagenPng, { x: MARGEN, y: y - altoImg, width: anchoDisponible, height: altoImg });
    } catch (e) {
      console.warn('Error al adjuntar la imagen del canvas:', e);
    }
  }

  const bytesPdf = await pdfDoc.save();
  descargarArchivo(bytesPdf, nombreArchivo);
}