/**
 * config.js
 * ---------------------------------------------------------
 * ÚNICO archivo que debes editar para conectar el portal a
 * tus cuentas REALES de Firebase y Cloudinary.
 *
 * Mientras la página corre en local (localhost o archivo),
 * estos valores se ignoran por completo y se usa la base de
 * datos de demostración (local-db.js).
 *
 * Instrucciones completas en CONFIGURACION.md.
 * ---------------------------------------------------------
 */

// Nombre de la escuela — cámbialo aquí y se actualiza en toda la página
window.NOMBRE_ESCUELA = "Tu Escuela o Instituto";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrTDO98qgkbNXhXg0I8zkDiQuhSnGcJlc",
    authDomain: "certificaniones.firebaseapp.com",
    projectId: "certificaniones",
    storageBucket: "certificaniones.firebasestorage.app",
    messagingSenderId: "216617850421",
    appId: "1:216617850421:web:12aac6cebe520bc6c8437c"
}; 
const app = initializeApp(firebaseConfig);

window.CLOUDINARY_CONFIG = {
  // Lo encuentras en el Dashboard de Cloudinary, arriba a la izquierda
  cloudName: "kv4gbmx0",
  // Lo creas en Settings → Upload → Upload presets → Add upload preset
  // Debe estar en modo "Unsigned", y con Resource type = "Raw" (o "Auto")
  // para que acepte archivos PDF y no solo imágenes.
  uploadPreset: "certificacionamm",
};
