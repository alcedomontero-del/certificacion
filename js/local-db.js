/**
 * local-db.js
 * ---------------------------------------------------------
 * Simula Firebase Authentication + Firestore + Cloudinary
 * usando SOLO localStorage. No hace ninguna llamada de red.
 * Se carga ÚNICAMENTE cuando env.js detecta ES_LOCAL = true.
 *
 * Credenciales de la cuenta de administrador de demostración:
 *   correo:    admin@demo.com
 *   contraseña: demo1234
 *
 * Cédulas de ejemplo para probar la búsqueda pública:
 *   00112345678  → tiene 2 certificados
 *   00198765432  → tiene 1 certificado
 * ---------------------------------------------------------
 */
window.LocalDB = (function () {
  const CLAVE_CERTS = "cert_demo_certificados";
  const CLAVE_SESION = "cert_demo_sesion";
  const CLAVE_ANUNCIOS = "cert_demo_anuncios";
  const ADMIN_DEMO = { email: "admin@demo.com", password: "demo1234" };

  // PDF mínimo válido (generado con reportlab) para que la demo
  // siempre tenga algo real y descargable, no un enlace roto.
  const PDF_DEMO_BASE64 =
    "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCAzMDAgMTUwIF0gL1BhcmVudCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwODA0MjAxNjAyKzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwODA0MjAxNjAyKzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKNyAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxNjkKPj4Kc3RyZWFtCkdhczJAMGFraVAnU1E1W01Bb2IpYnByczs8U1BYM2lKaCxQUlIvOmFQOWctVzZaaXFDXGA4RXNtaiJiRD4xV284YU9ncSlDO0ReKWdOTUtfSEVSOEZvTU10JiM2YlU5Okd1ZkQ0LzQxPkE0cVFOKjQ5ZGwxdUxIP284RSVvQlYyVExvZlUjOixrM0RiTGVpQkgpIWA7NWtmJTQiMklAWS0wMUcoW1Umfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxOTkgMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAowMDAwMDAwNDYwIDAwMDAwIG4gCjAwMDAwMDA3MjEgMDAwMDAgbiAKMDAwMDAwMDc4MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzw5OGM5YTIxZTQwN2ZjZDVhMDUwNWY1NzYyN2NhMDY2Mz48OThjOWEyMWU0MDdmY2Q1YTA1MDVmNTc2MjdjYTA2NjM+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDUgMCBSCi9Sb290IDQgMCBSCi9TaXplIDgKPj4Kc3RhcnR4cmVmCjEwMzkKJSVFT0YK";
  const PDF_DEMO_DATAURI = "data:application/pdf;base64," + PDF_DEMO_BASE64;

  function leerCerts() {
    try {
      const crudo = localStorage.getItem(CLAVE_CERTS);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }
  function guardarCerts(lista) {
    localStorage.setItem(CLAVE_CERTS, JSON.stringify(lista));
  }

  function sembrarDatosDeEjemplo() {
    const ejemplo = [
      {
        id: "demo-1",
        cedula: "00112345678",
        descripcion: "Técnico en Desarrollo Web — 120 horas",
        pdfUrl: PDF_DEMO_DATAURI,
        nombreArchivo: "certificado-desarrollo-web.pdf",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
      {
        id: "demo-2",
        cedula: "00112345678",
        descripcion: "Diplomado en Atención al Cliente — 40 horas",
        pdfUrl: PDF_DEMO_DATAURI,
        nombreArchivo: "certificado-atencion-cliente.pdf",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "demo-3",
        cedula: "00198765432",
        descripcion: "Curso de Excel Intermedio — 30 horas",
        pdfUrl: PDF_DEMO_DATAURI,
        nombreArchivo: "certificado-excel.pdf",
        creadoEn: Date.now() - 1000 * 60 * 60 * 24,
      },
    ];
    guardarCerts(ejemplo);
    return ejemplo;
  }

  function leerAnuncios() {
    try {
      const crudo = localStorage.getItem(CLAVE_ANUNCIOS);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }
  function guardarAnunciosLS(datos) {
    localStorage.setItem(CLAVE_ANUNCIOS, JSON.stringify(datos));
  }
  function sembrarAnuncios() {
    const inicial = {
      texto1: "📅 Las inscripciones para el próximo trimestre abren el 1 de septiembre.",
      texto2: "",
    };
    guardarAnunciosLS(inicial);
    return inicial;
  }

  function generarId() {
    return "cert-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function leerArchivoComoBase64(archivo) {
    return new Promise((resolve, reject) => {
      if (!archivo) return resolve("");
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
      lector.readAsDataURL(archivo);
    });
  }

  function retrasoFalso(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return {
    // ---------- Autenticación ----------
    async login(email, password) {
      await retrasoFalso(400);
      if (email.trim().toLowerCase() === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
        const user = { email: ADMIN_DEMO.email, uid: "demo-admin" };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(user));
        return user;
      }
      throw new Error("Correo o contraseña incorrectos (demo: admin@demo.com / demo1234)");
    },

    async logout() {
      await retrasoFalso(150);
      localStorage.removeItem(CLAVE_SESION);
    },

    getCurrentUser() {
      try {
        const crudo = localStorage.getItem(CLAVE_SESION);
        return crudo ? JSON.parse(crudo) : null;
      } catch (e) {
        return null;
      }
    },

    onAuthChange(callback) {
      callback(this.getCurrentUser());
      return () => {};
    },

    // ---------- Certificados ----------
    async getCertificadosPorCedula(cedula) {
      await retrasoFalso(400);
      let lista = leerCerts();
      if (!lista) lista = sembrarDatosDeEjemplo();
      return lista
        .filter((c) => c.cedula === cedula)
        .sort((a, b) => b.creadoEn - a.creadoEn);
    },

    async getTodosCertificados() {
      await retrasoFalso(250);
      let lista = leerCerts();
      if (!lista) lista = sembrarDatosDeEjemplo();
      return lista.sort((a, b) => b.creadoEn - a.creadoEn);
    },

    async agregarCertificado(datos, archivoPdf) {
      await retrasoFalso(600);
      const lista = leerCerts() || [];
      const pdfUrl = archivoPdf ? await leerArchivoComoBase64(archivoPdf) : PDF_DEMO_DATAURI;
      const nuevo = {
        id: generarId(),
        cedula: window.normalizarCedula(datos.cedula),
        descripcion: datos.descripcion,
        pdfUrl,
        nombreArchivo: archivoPdf ? archivoPdf.name : "certificado.pdf",
        creadoEn: Date.now(),
      };
      lista.push(nuevo);
      guardarCerts(lista);
      return nuevo;
    },

    async actualizarCertificado(original, datos, archivoPdf) {
      await retrasoFalso(500);
      const lista = leerCerts() || [];
      const idx = lista.findIndex((c) => c.id === original.id);
      if (idx === -1) throw new Error("Certificado no encontrado");
      const pdfUrl = archivoPdf ? await leerArchivoComoBase64(archivoPdf) : lista[idx].pdfUrl;
      lista[idx] = {
        ...lista[idx],
        cedula: window.normalizarCedula(datos.cedula),
        descripcion: datos.descripcion,
        pdfUrl,
        nombreArchivo: archivoPdf ? archivoPdf.name : lista[idx].nombreArchivo,
      };
      guardarCerts(lista);
      return lista[idx];
    },

    async eliminarCertificado(certificado) {
      await retrasoFalso(300);
      const lista = leerCerts() || [];
      guardarCerts(lista.filter((c) => c.id !== certificado.id));
    },

    // ---------- Anuncios ----------
    async getAnuncios() {
      await retrasoFalso(200);
      let datos = leerAnuncios();
      if (!datos) datos = sembrarAnuncios();
      return datos;
    },

    async guardarAnuncios(datos) {
      await retrasoFalso(300);
      const limpio = { texto1: (datos.texto1 || "").trim(), texto2: (datos.texto2 || "").trim() };
      guardarAnunciosLS(limpio);
      return limpio;
    },

    // Reiniciar la demo desde la consola: LocalDB.borrarDatosDeDemo()
    borrarDatosDeDemo() {
      localStorage.removeItem(CLAVE_CERTS);
      localStorage.removeItem(CLAVE_SESION);
      localStorage.removeItem(CLAVE_ANUNCIOS);
      console.log("Datos de demostración borrados. Recarga la página.");
    },
  };
})();
