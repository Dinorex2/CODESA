const STORAGE_KEY = "informesSistema";
const ORDER_KEY = "ultimoNumeroOrden";

let firmaObjetivoActual = null;
let firmaGrandeInicializada = false;

// ---------- INICIO ----------
document.addEventListener("DOMContentLoaded", () => {
  inicializarNumeroOrden();
  ponerFechaHoraActual();

  inicializarCanvasMini("firma1");
  inicializarCanvasMini("firma2");

  actualizarEstadoFirma("firma1", false);
  actualizarEstadoFirma("firma2", false);

  renderHistorial();

  document.getElementById("informeForm").addEventListener("submit", guardarInforme);
});

// ---------- NÚMERO DE ORDEN ----------
function inicializarNumeroOrden() {
  const ultimo = parseInt(localStorage.getItem(ORDER_KEY)) || 0;
  const siguiente = ultimo + 1;
  const numeroFormateado = formatearOrden(siguiente);

  document.getElementById("numeroOrden").value = numeroFormateado;
  document.getElementById("numeroOrdenTexto").textContent = numeroFormateado;
}

function formatearOrden(numero) {
  return `ORD-${String(numero).padStart(4, "0")}`;
}

// ---------- FECHA Y HORA ----------
function ponerFechaHoraActual() {
  const hoy = new Date();
  const fecha = hoy.toISOString().split("T")[0];
  const hora = hoy.toTimeString().slice(0, 5);

  document.getElementById("fecha").value = fecha;
  document.getElementById("hora").value = hora;
}

// ---------- LOCALSTORAGE ----------
function obtenerInformes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function guardarInformes(informes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(informes));
}

// ---------- GUARDAR ----------
function guardarInforme(e) {
  e.preventDefault();

  const firma1Canvas = document.getElementById("firma1");
  const firma2Canvas = document.getElementById("firma2");

  if (canvasVacio(firma1Canvas)) {
    alert("La Firma 1 (Emitido por) es obligatoria.");
    return;
  }

  if (canvasVacio(firma2Canvas)) {
    alert("La Firma 2 (Aprobado por) es obligatoria.");
    return;
  }

  const numeroOrden = document.getElementById("numeroOrden").value;

  const nuevoInforme = {
    numeroOrden,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    cliente: document.getElementById("cliente").value.trim(),
    lugar: document.getElementById("lugar").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    emitidoPor: document.getElementById("emitidoPor").value.trim(),
    aprobadoPor: document.getElementById("aprobadoPor").value.trim(),
    tipoServicio: document.getElementById("tipoServicio").value.trim(),
    verificacion: document.getElementById("verificacion").value.trim(),
    diagnostico: document.getElementById("diagnostico").value.trim(),
    observaciones: document.getElementById("observaciones").value.trim(),
    recomendaciones: document.getElementById("recomendaciones").value.trim(),
    estado: document.getElementById("estado").value,
    firma1: firma1Canvas.toDataURL("image/png"),
    firma2: firma2Canvas.toDataURL("image/png"),
    creadoEn: new Date().toISOString()
  };

  const informes = obtenerInformes();
  informes.unshift(nuevoInforme);
  guardarInformes(informes);

  const ultimo = parseInt(localStorage.getItem(ORDER_KEY)) || 0;
  localStorage.setItem(ORDER_KEY, ultimo + 1);

  alert(`Informe ${numeroOrden} guardado correctamente.`);

  limpiarFormulario();
  inicializarNumeroOrden();
  ponerFechaHoraActual();
  renderHistorial();
  mostrarHistorial();
}

// ---------- LIMPIAR ----------
function limpiarFormulario() {
  document.getElementById("informeForm").reset();
  ponerFechaHoraActual();

  limpiarCanvasMini(document.getElementById("firma1"));
  limpiarCanvasMini(document.getElementById("firma2"));

  actualizarEstadoFirma("firma1", false);
  actualizarEstadoFirma("firma2", false);
}

// ---------- HISTORIAL ----------
function renderHistorial() {
  const contenedor = document.getElementById("historialLista");
  const resumen = document.getElementById("resumenStats");
  const inputBusqueda = document.getElementById("buscarInforme");

  const busqueda = inputBusqueda ? inputBusqueda.value.toLowerCase() : "";
  const informes = obtenerInformes();

  const filtrados = informes.filter(informe =>
    informe.numeroOrden.toLowerCase().includes(busqueda) ||
    informe.cliente.toLowerCase().includes(busqueda) ||
    informe.telefono.toLowerCase().includes(busqueda)
  );

  const pendientes = informes.filter(i => i.estado === "Pendiente").length;
  const finalizados = informes.filter(i => i.estado === "Finalizado").length;
  const entregados = informes.filter(i => i.estado === "Entregado").length;

  resumen.innerHTML = `
    <div class="stat-card">
      <p>Total de informes</p>
      <h3>${informes.length}</h3>
    </div>
    <div class="stat-card">
      <p>Pendientes</p>
      <h3>${pendientes}</h3>
    </div>
    <div class="stat-card">
      <p>Finalizados</p>
      <h3>${finalizados}</h3>
    </div>
    <div class="stat-card">
      <p>Entregados</p>
      <h3>${entregados}</h3>
    </div>
  `;

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="history-item">
        <div class="history-info">
          <h4>Sin resultados</h4>
          <p>No hay informes guardados o no coinciden con la búsqueda.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = filtrados.map((informe) => `
    <div class="history-item">
      <div class="history-info">
        <h4>${informe.numeroOrden}</h4>
        <p><strong>Cliente:</strong> ${escapeHTML(informe.cliente)}</p>
        <p><strong>Lugar:</strong> ${escapeHTML(informe.lugar)}</p>
        <div class="history-meta">
          <span class="badge">${escapeHTML(informe.fecha)}</span>
          <span class="badge">${escapeHTML(informe.hora)}</span>
          <span class="badge">${escapeHTML(informe.estado)}</span>
          <span class="badge">${escapeHTML(informe.telefono)}</span>
        </div>
      </div>

      <div class="history-actions">
        <button class="view-btn" onclick="verInforme('${informe.numeroOrden}')">Ver Informe</button>
      </div>
    </div>
  `).join("");
}

// ---------- VER INFORME ----------
function verInforme(numeroOrden) {
  const informes = obtenerInformes();
  const informe = informes.find(i => i.numeroOrden === numeroOrden);

  if (!informe) return;

  document.getElementById("contenidoVista").innerHTML = `
    <div class="preview-document" id="areaImpresion">
      <div class="preview-title">
        <p class="tag">DOCUMENTO OFICIAL</p>
        <h2>Informe de Servicio</h2>
        <p><strong>Número de Orden:</strong> ${escapeHTML(informe.numeroOrden)}</p>
      </div>

      <div class="preview-grid">
        <div class="preview-card"><strong>Fecha</strong><br>${escapeHTML(informe.fecha)}</div>
        <div class="preview-card"><strong>Hora</strong><br>${escapeHTML(informe.hora)}</div>
        <div class="preview-card"><strong>Teléfono</strong><br>${escapeHTML(informe.telefono)}</div>
        <div class="preview-card"><strong>Cliente / Contacto</strong><br>${escapeHTML(informe.cliente)}</div>
        <div class="preview-card"><strong>Lugar</strong><br>${escapeHTML(informe.lugar)}</div>
        <div class="preview-card"><strong>Estado</strong><br>${escapeHTML(informe.estado)}</div>
      </div>

      <div class="preview-grid">
        <div class="preview-card"><strong>Emitido por</strong><br>${escapeHTML(informe.emitidoPor)}</div>
        <div class="preview-card"><strong>Aprobado por</strong><br>${escapeHTML(informe.aprobadoPor)}</div>
        <div class="preview-card"><strong>Tipo de servicio</strong><br>${escapeHTML(informe.tipoServicio)}</div>
      </div>

      <div class="preview-block">
        <h4>Verificación de dispensadores o bombas</h4>
        <div class="preview-box">${escapeHTML(informe.verificacion)}</div>
      </div>

      <div class="preview-block">
        <h4>Diagnóstico</h4>
        <div class="preview-box">${escapeHTML(informe.diagnostico)}</div>
      </div>

      <div class="preview-block">
        <h4>Observaciones</h4>
        <div class="preview-box">${escapeHTML(informe.observaciones || "Sin observaciones.")}</div>
      </div>

      <div class="preview-block">
        <h4>Recomendaciones</h4>
        <div class="preview-box">${escapeHTML(informe.recomendaciones || "Sin recomendaciones.")}</div>
      </div>

      <div class="preview-signatures">
        <div class="signature-preview">
          <img src="${informe.firma1}" alt="Firma Emitido por">
          <div class="signature-line">${escapeHTML(informe.emitidoPor)}<br>Emitido por</div>
        </div>

        <div class="signature-preview">
          <img src="${informe.firma2}" alt="Firma Aprobado por">
          <div class="signature-line">${escapeHTML(informe.aprobadoPor)}<br>Aprobado por</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modalVista").classList.remove("hidden");
}

// ---------- CERRAR ----------
function cerrarVista() {
  document.getElementById("modalVista").classList.add("hidden");
}

// ---------- PDF ----------
function imprimirInforme() {
  window.print();
}

// ---------- NAVEGACIÓN ----------
function mostrarFormulario() {
  document.getElementById("formSection").classList.remove("hidden");
  document.getElementById("historySection").classList.add("hidden");
  activarBoton("btnFormulario");
}

function mostrarHistorial() {
  document.getElementById("historySection").classList.remove("hidden");
  document.getElementById("formSection").classList.add("hidden");
  activarBoton("btnHistorial");
  renderHistorial();
}

function activarBoton(idActivo) {
  const botones = document.querySelectorAll(".nav-btn");
  botones.forEach(btn => btn.classList.remove("active"));

  const activo = document.getElementById(idActivo);
  if (activo) activo.classList.add("active");
}

// ======================================================
// CANVAS MINI (SOLO VISTA PREVIA EN FORMULARIO)
// ======================================================
function inicializarCanvasMini(id) {
  const canvas = document.getElementById(id);
  prepararCanvasMini(canvas);
}

function prepararCanvasMini(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const ctx = canvas.getContext("2d");

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function limpiarCanvasMini(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const ratio = window.devicePixelRatio || 1;
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, rect.width, rect.height);
}

// ======================================================
// FIRMA PRO EN PANTALLA COMPLETA
// ======================================================
function abrirFirmaModal(idCanvasDestino) {
  firmaObjetivoActual = idCanvasDestino;

  const modal = document.getElementById("firmaModal");
  const canvasGrande = document.getElementById("firmaCanvasGrande");
  const titulo = document.getElementById("tituloFirmaModal");

  titulo.textContent =
    idCanvasDestino === "firma1"
      ? "Firma 1 - Emitido por"
      : "Firma 2 - Aprobado por";

  modal.classList.remove("hidden");

  setTimeout(() => {
    prepararCanvasGrande(canvasGrande);

    if (!firmaGrandeInicializada) {
      inicializarCanvasGrande(canvasGrande);
      firmaGrandeInicializada = true;
    } else {
      limpiarCanvasGrande();
    }

    const canvasPequeno = document.getElementById(idCanvasDestino);

    if (!canvasVacio(canvasPequeno)) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasGrande.getContext("2d");
        const rect = canvasGrande.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = canvasPequeno.toDataURL("image/png");
    }
  }, 100);
}

function cerrarFirmaModal() {
  document.getElementById("firmaModal").classList.add("hidden");
  firmaObjetivoActual = null;
}

function prepararCanvasGrande(canvas) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function inicializarCanvasGrande(canvas) {
  const ctx = canvas.getContext("2d");
  let dibujando = false;

  function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function iniciarDibujo(e) {
    e.preventDefault();
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function dibujar(e) {
    if (!dibujando) return;
    e.preventDefault();

    const pos = obtenerPosicion(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function detenerDibujo(e) {
    if (e) e.preventDefault();
    dibujando = false;
    ctx.beginPath();
  }

  canvas.addEventListener("mousedown", iniciarDibujo);
  canvas.addEventListener("mousemove", dibujar);
  canvas.addEventListener("mouseup", detenerDibujo);
  canvas.addEventListener("mouseleave", detenerDibujo);

  canvas.addEventListener("touchstart", iniciarDibujo, { passive: false });
  canvas.addEventListener("touchmove", dibujar, { passive: false });
  canvas.addEventListener("touchend", detenerDibujo, { passive: false });

  window.addEventListener("resize", () => {
    if (!document.getElementById("firmaModal").classList.contains("hidden")) {
      guardarYRestaurarCanvasGrande();
    }
  });
}

function limpiarCanvasGrande() {
  const canvas = document.getElementById("firmaCanvasGrande");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const ratio = window.devicePixelRatio || 1;
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function limpiarFirmaGrande() {
  limpiarCanvasGrande();
}

function guardarYRestaurarCanvasGrande() {
  const canvas = document.getElementById("firmaCanvasGrande");
  const imagen = canvas.toDataURL("image/png");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  prepararCanvasGrande(canvas);

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
  };
  img.src = imagen;
}

function guardarFirmaGrande() {
  if (!firmaObjetivoActual) return;

  const canvasGrande = document.getElementById("firmaCanvasGrande");
  const canvasDestino = document.getElementById(firmaObjetivoActual);
  const ctxDestino = canvasDestino.getContext("2d");
  const rectDestino = canvasDestino.getBoundingClientRect();

  if (canvasVacio(canvasGrande)) {
    alert("Debes realizar la firma antes de guardarla.");
    return;
  }

  limpiarCanvasMini(canvasDestino);

  const img = new Image();
  img.onload = () => {
    ctxDestino.drawImage(img, 0, 0, rectDestino.width, rectDestino.height);
    actualizarEstadoFirma(firmaObjetivoActual, true);
    cerrarFirmaModal();
  };
  img.src = canvasGrande.toDataURL("image/png");
}

function actualizarEstadoFirma(idCanvas, firmada) {
  const estado = document.getElementById(
    idCanvas === "firma1" ? "estadoFirma1" : "estadoFirma2"
  );

  if (!estado) return;

  if (firmada) {
    estado.textContent = "✅ Firma registrada";
    estado.classList.add("ok");
  } else {
    estado.textContent = "⚠️ Firma pendiente";
    estado.classList.remove("ok");
  }
}

// ---------- UTILIDADES ----------
function canvasVacio(canvas) {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;

  const bctx = blank.getContext("2d");
  bctx.fillStyle = "#fff";
  bctx.fillRect(0, 0, blank.width, blank.height);

  return canvas.toDataURL("image/png") === blank.toDataURL("image/png");
}

function escapeHTML(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
