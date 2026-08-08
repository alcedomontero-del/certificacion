/**
 * firebase-real.js
 * ---------------------------------------------------------
 * Conexión REAL a Firebase (Authentication + Firestore) y a
 * Cloudinary (subida de PDFs). Se carga como módulo SOLO
 * cuando env.js detecta que la página ya no está en local.
 *
 * Antes de que esto funcione, edita js/config.js con tus
 * credenciales reales. Ver CONFIGURACION.md.
 * ---------------------------------------------------------
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

async function subirPdfCloudinary(archivo) {
  if (!archivo) return { url: "", nombre: "" };
  const { cloudName, uploadPreset } = window.CLOUDINARY_CONFIG;
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", uploadPreset);

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo subir el PDF a Cloudinary. Revisa tu cloudName y upload preset en config.js");
  }
  const datos = await respuesta.json();
  return { url: datos.secure_url, nombre: archivo.name };
}

window.FirebaseDB = {
  // ---------- Autenticación ----------
  async login(email, password) {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    return credencial.user;
  },
  async logout() {
    await signOut(auth);
  },
  getCurrentUser() {
    return auth.currentUser;
  },
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // ---------- Certificados ----------
  // Cada cédula vive en su propia subcolección: certificados/{cedula}/items/{id}
  // Esto es lo que hace la privacidad real: para leer, hay que saber la
  // cédula exacta de antemano (va en la ruta). No existe ninguna consulta
  // posible que devuelva "todas las cédulas" con estas reglas — a
  // diferencia de una sola colección plana con un campo "cedula", donde
  // las reglas de Firestore NO pueden revisar el contenido de una
  // consulta y por lo tanto no podrían impedir un listado completo.
  async getCertificadosPorCedula(cedula) {
    const q = query(collection(db, "certificados", cedula, "items"), orderBy("creadoEn", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, cedula, ...d.data() }));
  },

  // Solo se usa dentro del panel admin (usuario autenticado). Usa una
  // "collection group query" para juntar los items de TODAS las cédulas,
  // algo que las reglas solo permiten si hay sesión iniciada.
  async getTodosCertificados() {
    const q = query(collectionGroup(db, "items"), orderBy("creadoEn", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      cedula: d.ref.parent.parent.id,
      ...d.data(),
    }));
  },

  async agregarCertificado(datos, archivoPdf) {
    const cedula = window.normalizarCedula(datos.cedula);
    const { url, nombre } = await subirPdfCloudinary(archivoPdf);
    const nuevo = {
      descripcion: datos.descripcion,
      pdfUrl: url,
      nombreArchivo: nombre,
      creadoEn: Date.now(),
    };
    const ref = await addDoc(collection(db, "certificados", cedula, "items"), nuevo);
    return { id: ref.id, cedula, ...nuevo };
  },

  // Recibe el certificado ORIGINAL completo (no solo el id), porque en
  // Firestore la cédula es parte de la ruta del documento — si el admin
  // cambia la cédula, hay que "mover" el documento a la nueva ruta.
  async actualizarCertificado(original, datos, archivoPdf) {
    const cedulaNueva = window.normalizarCedula(datos.cedula);
    let pdfUrl = original.pdfUrl;
    let nombreArchivo = original.nombreArchivo;
    if (archivoPdf) {
      const subido = await subirPdfCloudinary(archivoPdf);
      pdfUrl = subido.url;
      nombreArchivo = subido.nombre;
    }
    const datosFinales = { descripcion: datos.descripcion, pdfUrl, nombreArchivo, creadoEn: original.creadoEn };

    if (cedulaNueva === original.cedula) {
      await updateDoc(doc(db, "certificados", original.cedula, "items", original.id), datosFinales);
      return { id: original.id, cedula: cedulaNueva, ...datosFinales };
    }
    // Cambió la cédula: crear en la ruta nueva y borrar la anterior.
    const ref = await addDoc(collection(db, "certificados", cedulaNueva, "items"), datosFinales);
    await deleteDoc(doc(db, "certificados", original.cedula, "items", original.id));
    return { id: ref.id, cedula: cedulaNueva, ...datosFinales };
  },

  async eliminarCertificado(certificado) {
    await deleteDoc(doc(db, "certificados", certificado.cedula, "items", certificado.id));
  },

  // ---------- Anuncios ----------
  // Se guardan en un único documento: configuracion/anuncios
  async getAnuncios() {
    const ref = doc(db, "configuracion", "anuncios");
    const snap = await getDoc(ref);
    if (!snap.exists()) return { texto1: "", texto2: "" };
    return snap.data();
  },

  async guardarAnuncios(datos) {
    const limpio = { texto1: (datos.texto1 || "").trim(), texto2: (datos.texto2 || "").trim() };
    await setDoc(doc(db, "configuracion", "anuncios"), limpio);
    return limpio;
  },
};
