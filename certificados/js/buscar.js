/**
 * buscar.js — página pública: anuncios + búsqueda de certificados por cédula
 */
(function () {
  window.pintarBadgeModo("badge-modo");

  // Nombre de la escuela, tomado de config.js
  const tituloEscuela = document.getElementById("nombre-escuela");
  if (tituloEscuela && window.NOMBRE_ESCUELA) {
    tituloEscuela.textContent = window.NOMBRE_ESCUELA;
    document.title = window.NOMBRE_ESCUELA + " — Certificaciones";
  }

  async function cargarAnuncios() {
    try {
      const anuncios = await window.DB.getAnuncios();
      const a1 = document.getElementById("anuncio-1");
      const a2 = document.getElementById("anuncio-2");
      if (anuncios.texto1) {
        a1.querySelector(".texto").textContent = anuncios.texto1;
        a1.classList.add("show");
      }
      if (anuncios.texto2) {
        a2.querySelector(".texto").textContent = anuncios.texto2;
        a2.classList.add("show");
      }
    } catch (error) {
      console.error("No se pudieron cargar los anuncios:", error);
    }
  }

  function tarjetaCertificado(c) {
    return `
      <div class="cert-card">
        <svg class="seal-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="24" cy="20" r="14" fill="#C9A227"/>
          <circle cx="24" cy="20" r="14" fill="none" stroke="#FFFDF6" stroke-width="2" stroke-dasharray="2.5 3"/>
          <path d="M16 30 L13 44 L24 38 L35 44 L32 30" fill="#A23B4E"/>
          <text x="24" y="24" font-size="13" text-anchor="middle" fill="#FFFDF6" font-family="serif">✓</text>
        </svg>
        <div class="info">
          <div class="desc">${c.descripcion}</div>
          <div class="meta">${c.nombreArchivo || "certificado.pdf"}</div>
        </div>
        <button type="button" class="btn btn-navy" data-url="${c.pdfUrl}" data-nombre="${c.nombreArchivo || "certificado.pdf"}">⬇️ Descargar</button>
      </div>`;
  }

  function pintarResultados(lista, cedulaBuscada) {
    const contenedor = document.getElementById("resultados");
    if (lista.length === 0) {
      contenedor.innerHTML = `
        <div class="no-resultados">
          <div class="big-icon">🔎</div>
          <h3>No encontramos certificaciones</h3>
          <p>Verifica que la cédula "${cedulaBuscada}" esté escrita correctamente.</p>
        </div>`;
      return;
    }

    const encabezado = `
      <div class="resultados-header">
        <h2>🎓 Certificaciones encontradas</h2>
        <span class="conteo">${lista.length} resultado${lista.length > 1 ? "s" : ""}</span>
      </div>
      ${lista.length > 1 ? `<button type="button" class="btn btn-gold" id="btn-descargar-todos" style="margin-bottom:16px;">⬇️ Descargar todas (${lista.length})</button>` : ""}
    `;

    contenedor.innerHTML = encabezado + lista.map(tarjetaCertificado).join("");

    const btnTodos = document.getElementById("btn-descargar-todos");
    if (btnTodos) {
      btnTodos.addEventListener("click", () => {
        lista.forEach((c, i) => {
          setTimeout(() => {
            window.descargarArchivo(c.pdfUrl, c.nombreArchivo);
          }, i * 500);
        });
        window.mostrarToast(`Descargando ${lista.length} certificados…`);
      });
    }
  }

  document.getElementById("resultados").addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-url]");
    if (!boton) return;
    window.descargarArchivo(boton.dataset.url, boton.dataset.nombre);
  });

  const form = document.getElementById("form-busqueda");
  const inputCedula = document.getElementById("input-cedula");
  const btnBuscar = document.getElementById("btn-buscar");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const cedula = window.normalizarCedula(inputCedula.value);
    const contenedor = document.getElementById("resultados");

    if (!cedula) {
      window.mostrarToast("Escribe tu número de cédula o ID", "error");
      return;
    }

    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="spinner"></span> Buscando...';
    contenedor.innerHTML = "";

    try {
      const lista = await window.DB.getCertificadosPorCedula(cedula);
      pintarResultados(lista, cedula);
    } catch (error) {
      console.error(error);
      contenedor.innerHTML = `<div class="no-resultados"><div class="big-icon">⚠️</div><h3>Ocurrió un problema al buscar</h3><p>Intenta de nuevo en unos segundos.</p></div>`;
    } finally {
      btnBuscar.disabled = false;
      btnBuscar.textContent = "Buscar";
    }
  });

  window.cuandoDBListo(cargarAnuncios);
})();
