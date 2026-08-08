/**
 * admin.js — panel donde el administrador sube certificados y edita anuncios
 */
(function () {
  window.pintarBadgeModo("badge-modo");

  let certificados = [];
  let editandoOriginal = null; // certificado completo que se está editando (o null)
  let archivoSeleccionado = null;

  const form = document.getElementById("form-certificado");
  const inputCedula = document.getElementById("f-cedula");
  const inputDescripcion = document.getElementById("f-descripcion");
  const inputArchivo = document.getElementById("f-archivo");
  const dropZone = document.getElementById("drop-zone");
  const fileText = document.getElementById("file-text");
  const btnGuardar = document.getElementById("btn-guardar");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
  const listaCerts = document.getElementById("lista-certs");
  const contadorCerts = document.getElementById("contador-certs");

  // ---------- Guardia de autenticación ----------
  window.cuandoDBListo(async () => {
    const user = window.DB.getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    document.getElementById("admin-email").textContent = user.email;
    await cargarCertificados();
    await cargarAnuncios();
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await window.DB.logout();
    window.location.href = "login.html";
  });

  document.getElementById("btn-ver-publico").addEventListener("click", () => {
    window.open("index.html", "_blank");
  });

  // ---------- Selección de archivo PDF ----------
  dropZone.addEventListener("click", () => inputArchivo.click());
  inputArchivo.addEventListener("change", () => {
    const archivo = inputArchivo.files[0];
    if (!archivo) return;
    if (archivo.type !== "application/pdf") {
      window.mostrarToast("Solo se permiten archivos PDF", "error");
      inputArchivo.value = "";
      return;
    }
    archivoSeleccionado = archivo;
    fileText.textContent = "📄 " + archivo.name;
    fileText.classList.add("chosen");
  });

  // ---------- Cargar y pintar certificados ----------
  async function cargarCertificados() {
    certificados = await window.DB.getTodosCertificados();
    pintarLista();
  }

  function pintarLista() {
    contadorCerts.textContent = certificados.length;
    if (certificados.length === 0) {
      listaCerts.innerHTML =
        '<p style="text-align:center; color:var(--ink-soft); font-weight:700; padding:20px 0;">Todavía no has subido ningún certificado 📄</p>';
      return;
    }
    listaCerts.innerHTML = certificados
      .map(
        (c) => `
      <div class="cert-row" data-id="${c.id}">
        <div class="pdf-icon">PDF</div>
        <div class="info">
          <div class="cedula">Cédula: ${c.cedula}</div>
          <div class="desc-row">${c.descripcion}</div>
        </div>
        <div class="row-actions">
          <a class="icon-btn" href="${c.pdfUrl}" target="_blank" rel="noopener" title="Ver PDF">👁️</a>
          <button class="icon-btn edit" title="Editar" data-accion="editar">✏️</button>
          <button class="icon-btn delete" title="Eliminar" data-accion="eliminar">🗑️</button>
        </div>
      </div>`
      )
      .join("");
  }

  listaCerts.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");
    if (!boton) return;
    const fila = evento.target.closest(".cert-row");
    const id = fila.dataset.id;
    if (boton.dataset.accion === "editar") iniciarEdicion(id);
    if (boton.dataset.accion === "eliminar") eliminar(id);
  });

  // ---------- Editar ----------
  function iniciarEdicion(id) {
    const c = certificados.find((x) => x.id === id);
    if (!c) return;
    editandoOriginal = c;
    inputCedula.value = c.cedula;
    inputDescripcion.value = c.descripcion;
    archivoSeleccionado = null;
    fileText.textContent = "Toca para reemplazar el PDF (opcional)";
    fileText.classList.remove("chosen");
    btnGuardar.textContent = "Actualizar certificado";
    btnCancelarEdicion.style.display = "inline-flex";
    document.getElementById("titulo-form").textContent = "✏️ Editar certificado";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicion() {
    editandoOriginal = null;
    form.reset();
    archivoSeleccionado = null;
    fileText.textContent = "Toca para elegir el PDF";
    fileText.classList.remove("chosen");
    btnGuardar.textContent = "Subir certificado";
    btnCancelarEdicion.style.display = "none";
    document.getElementById("titulo-form").textContent = "📄 Subir certificado";
  }
  btnCancelarEdicion.addEventListener("click", cancelarEdicion);

  // ---------- Eliminar ----------
  async function eliminar(id) {
    const c = certificados.find((x) => x.id === id);
    if (!confirm(`¿Eliminar el certificado "${c.descripcion}" de la cédula ${c.cedula}? Esta acción no se puede deshacer.`)) return;
    try {
      await window.DB.eliminarCertificado(c);
      window.mostrarToast("Certificado eliminado 🗑️");
      if (editandoOriginal && editandoOriginal.id === id) cancelarEdicion();
      await cargarCertificados();
    } catch (error) {
      window.mostrarToast(error.message || "No se pudo eliminar", "error");
    }
  }

  // ---------- Guardar (crear o actualizar) ----------
  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = {
      cedula: inputCedula.value.trim(),
      descripcion: inputDescripcion.value.trim(),
    };

    if (!datos.cedula || !datos.descripcion) {
      window.mostrarToast("Completa la cédula y la descripción", "error");
      return;
    }
    if (!editandoOriginal && !archivoSeleccionado) {
      window.mostrarToast("Selecciona el archivo PDF del certificado", "error");
      return;
    }
    if (window.normalizarCedula(datos.cedula).length < 5) {
      window.mostrarToast("Revisa la cédula, parece incompleta", "error");
      return;
    }

    const textoOriginal = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner"></span> Guardando...';

    try {
      if (editandoOriginal) {
        await window.DB.actualizarCertificado(editandoOriginal, datos, archivoSeleccionado);
        window.mostrarToast("Certificado actualizado ✏️");
      } else {
        await window.DB.agregarCertificado(datos, archivoSeleccionado);
        window.mostrarToast("Certificado subido 🎉");
      }
      cancelarEdicion();
      await cargarCertificados();
    } catch (error) {
      console.error(error);
      window.mostrarToast(error.message || "No se pudo guardar el certificado", "error");
      btnGuardar.textContent = textoOriginal;
    } finally {
      btnGuardar.disabled = false;
    }
  });

  // ---------- Anuncios ----------
  async function cargarAnuncios() {
    const anuncios = await window.DB.getAnuncios();
    document.getElementById("an-texto1").value = anuncios.texto1 || "";
    document.getElementById("an-texto2").value = anuncios.texto2 || "";
  }

  document.getElementById("btn-guardar-anuncios").addEventListener("click", async (evento) => {
    const boton = evento.currentTarget;
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.innerHTML = '<span class="spinner"></span> Guardando...';
    try {
      await window.DB.guardarAnuncios({
        texto1: document.getElementById("an-texto1").value,
        texto2: document.getElementById("an-texto2").value,
      });
      window.mostrarToast("Anuncios actualizados 📢");
    } catch (error) {
      window.mostrarToast(error.message || "No se pudieron guardar los anuncios", "error");
    } finally {
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  });
})();
