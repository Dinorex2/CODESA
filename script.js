    const STORAGE_KEY = "informesSistema";
    const ORDER_KEY = "ultimoNumeroOrden";

    // ---------- INICIO ----------
    document.addEventListener("DOMContentLoaded", () => {
    inicializarNumeroOrden();
    ponerFechaHoraActual();
    inicializarCanvas("firma1");
    inicializarCanvas("firma2");
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
        firma1: firma1Canvas.toDataURL(),
        firma2: firma2Canvas.toDataURL(),
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
    limpiarCanvas(document.getElementById("firma1"));
    limpiarCanvas(document.getElementById("firma2"));
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
            <p><strong>Cliente:</strong> ${informe.cliente}</p>
            <p><strong>Lugar:</strong> ${informe.lugar}</p>
            <div class="history-meta">
            <span class="badge">${informe.fecha}</span>
            <span class="badge">${informe.hora}</span>
            <span class="badge">${informe.estado}</span>
            <span class="badge">${informe.telefono}</span>
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
            <p><strong>Número de Orden:</strong> ${informe.numeroOrden}</p>
        </div>

        <div class="preview-grid">
            <div class="preview-card"><strong>Fecha</strong><br>${informe.fecha}</div>
            <div class="preview-card"><strong>Hora</strong><br>${informe.hora}</div>
            <div class="preview-card"><strong>Teléfono</strong><br>${informe.telefono}</div>
            <div class="preview-card"><strong>Cliente / Contacto</strong><br>${informe.cliente}</div>
            <div class="preview-card"><strong>Lugar</strong><br>${informe.lugar}</div>
            <div class="preview-card"><strong>Estado</strong><br>${informe.estado}</div>
        </div>

        <div class="preview-grid">
            <div class="preview-card"><strong>Emitido por</strong><br>${informe.emitidoPor}</div>
            <div class="preview-card"><strong>Aprobado por</strong><br>${informe.aprobadoPor}</div>
            <div class="preview-card"><strong>Tipo de servicio</strong><br>${informe.tipoServicio}</div>
        </div>

        <div class="preview-block">
            <h4>Verificación de dispensadores o bombas</h4>
            <div class="preview-box">${informe.verificacion}</div>
        </div>

        <div class="preview-block">
            <h4>Diagnóstico</h4>
            <div class="preview-box">${informe.diagnostico}</div>
        </div>

        <div class="preview-block">
            <h4>Observaciones</h4>
            <div class="preview-box">${informe.observaciones || "Sin observaciones."}</div>
        </div>

        <div class="preview-block">
            <h4>Recomendaciones</h4>
            <div class="preview-box">${informe.recomendaciones || "Sin recomendaciones."}</div>
        </div>

        <div class="preview-signatures">
            <div class="signature-preview">
            <img src="${informe.firma1}" alt="Firma Emitido por">
            <div class="signature-line">${informe.emitidoPor}<br>Emitido por</div>
            </div>

            <div class="signature-preview">
            <img src="${informe.firma2}" alt="Firma Aprobado por">
            <div class="signature-line">${informe.aprobadoPor}<br>Aprobado por</div>
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

    // ---------- FIRMAS ----------
    function inicializarCanvas(id) {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext("2d");

    ajustarCanvas(canvas);
    limpiarCanvas(canvas);

    let dibujando = false;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function iniciarDibujo(e) {
        dibujando = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function dibujar(e) {
        if (!dibujando) return;
        e.preventDefault();

        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    function detenerDibujo() {
        dibujando = false;
        ctx.beginPath();
    }

    canvas.addEventListener("mousedown", iniciarDibujo);
    canvas.addEventListener("mousemove", dibujar);
    canvas.addEventListener("mouseup", detenerDibujo);
    canvas.addEventListener("mouseleave", detenerDibujo);

    canvas.addEventListener("touchstart", iniciarDibujo);
    canvas.addEventListener("touchmove", dibujar, { passive: false });
    canvas.addEventListener("touchend", detenerDibujo);

    window.addEventListener("resize", () => {
        const imagen = canvas.toDataURL();
        ajustarCanvas(canvas);
        limpiarCanvas(canvas);

        const img = new Image();
        img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = imagen;
    });
    }

    function ajustarCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = 190 * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    }

    function limpiarCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ratio = window.devicePixelRatio || 1;
    ctx.scale(ratio, ratio);
    }

    function limpiarFirma(id) {
    const canvas = document.getElementById(id);
    limpiarCanvas(canvas);
    }

    function canvasVacio(canvas) 
    {
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
    }