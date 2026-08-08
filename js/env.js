/**
 * env.js
 * ---------------------------------------------------------
 * Detecta automáticamente si la página está corriendo:
 *   - LOCAL: abierta desde VS Code (Live Server), doble clic
 *     en el archivo, o cualquier localhost/127.0.0.1.
 *     -> Se usa la base de datos falsa (local-db.js), sin
 *        tocar Firebase ni Cloudinary. Ideal para mostrarle
 *        la tienda a un cliente sin que nada esté "en vivo".
 *
 *   - PRODUCCIÓN: la página fue desplegada de verdad (Firebase
 *     Hosting, Netlify, un dominio propio, etc.)
 *     -> Se activan las conexiones reales a Firebase y
 *        Cloudinary. Aquí los datos SÍ son reales y deben
 *        estar protegidos con las reglas de seguridad.
 *
 * No hay que tocar este archivo para desplegar: la detección
 * es automática según el dominio donde el navegador cargó
 * la página.
 * ---------------------------------------------------------
 */
(function () {
  const host = location.hostname;
  const esLocal =
    host === "" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    location.protocol === "file:";

  window.ES_LOCAL = esLocal;

  // Normaliza una cédula/ID: deja solo dígitos, sin guiones ni espacios
  window.normalizarCedula = function (texto) {
    return (texto || "").replace(/\D/g, "");
  };
})();
