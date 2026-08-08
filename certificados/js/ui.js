/**
 * ui.js — pequeñas utilidades visuales compartidas por las 3 páginas
 */
window.pintarBadgeModo = function (contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;
  if (window.ES_LOCAL) {
    contenedor.innerHTML =
      '<span class="mode-badge local"><span class="dot"></span>🧪 Modo demostración local — nada de esto está en internet</span>';
  } else {
    contenedor.innerHTML =
      '<span class="mode-badge live"><span class="dot"></span>🟢 Conectado en vivo (Firebase + Cloudinary)</span>';
  }
};

window.mostrarToast = function (mensaje, tipo) {
  let toast = document.getElementById("toast-global");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-global";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.className = "toast show" + (tipo === "error" ? " error" : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
};

// Convierte una URL normal de Cloudinary en una que fuerza la descarga
// del archivo (en vez de abrirlo en una pestaña nueva del navegador).
// No toca los data: URI del modo local, esos ya descargan bien solos.
window.urlDescargaForzada = function (url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
};

// Dispara la descarga de un archivo sin abrir pestañas nuevas visibles
window.descargarArchivo = function (url, nombreArchivo) {
  const a = document.createElement("a");
  a.href = window.urlDescargaForzada(url);
  a.download = nombreArchivo || "certificado.pdf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
};
