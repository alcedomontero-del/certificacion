# Portal de Certificados — Guía de configuración

Igual que en el proyecto de la tienda, este portal tiene **dos modos** y cambia entre ellos solo:

- **Modo local (demostración):** al abrir los archivos en tu computadora, todo corre sobre una base de datos falsa en tu navegador (`localStorage`). Ya viene con 3 certificados de ejemplo para que pruebes la búsqueda sin configurar nada.
- **Modo producción (real):** en cuanto la página esté publicada en un dominio real, se activan las conexiones reales a Firebase y Cloudinary automáticamente.

---

## 1. Probar el modo local ahora mismo

1. Abre la carpeta en VS Code → clic derecho sobre `index.html` → "Open with Live Server".
2. Busca la cédula **00112345678** (tiene 2 certificados) o **00198765432** (tiene 1).
3. Para entrar al panel admin (`login.html`): correo `admin@demo.com`, contraseña `demo1234`.
4. Sube un PDF de prueba, cambia los anuncios, y ve cómo se reflejan en la página pública (botón "👀 Ver página pública").

Para reiniciar los datos de prueba, abre la consola del navegador (F12) y escribe:
```js
LocalDB.borrarDatosDeDemo()
```

---

## 2. Crear tu proyecto real de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto (plan **Spark**, gratis).
2. **Firestore Database** → "Crear base de datos" → modo producción → región cercana.
3. **Authentication** → pestaña "Sign-in method" → habilita **Correo electrónico/contraseña**.
4. En "Users", crea manualmente tu usuario administrador. No hay registro público a propósito.
5. general**Configuración del proyecto** (⚙️) → "Tus apps" → ícono `</>` (Web) → registra la app → copia el `firebaseConfig`.
6. Pega esos valores en `js/config.js`, en `window.FIREBASE_CONFIG`.

### Reglas de seguridad de Firestore — la parte más importante

Ve a **Firestore Database → Reglas** y reemplaza todo por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cada cédula es "su propia carpeta": certificados/{cedula}/items/{id}
    // Para leer, hay que saber la cédula EXACTA de antemano (va en la ruta).
    // No existe ninguna forma de "listar todas las cédulas" con esta regla.
    match /certificados/{cedula}/items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // El panel admin sí necesita ver TODOS los certificados juntos.
    // Esto solo aplica a consultas que juntan varias cédulas a la vez,
    // y solo funciona si hay una sesión de administrador iniciada.
    match /{path=**}/items/{itemId} {
      allow read: if request.auth != null;
    }

    match /configuracion/anuncios {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Por qué está armado así (para que lo entiendas, no solo lo copies):** Firestore no permite que una regla de seguridad revise el *contenido* de una consulta (no puede saber si pediste "cédula = 001..." o "todo sin filtro"). Por eso, en vez de confiar en que el código siempre pregunte con filtro, la cédula se volvió parte de la *ruta* del documento — así, sin saber la cédula exacta, es imposible construir una consulta que devuelva algo.

---

## 3. Crear tu cuenta de Cloudinary (para los PDFs)

1. Crea una cuenta gratis en [cloudinary.com](https://cloudinary.com).
2. Copia tu **Cloud Name** del Dashboard.
3. **Settings (⚙️) → Upload → Upload presets → Add upload preset**.
4. Cambia **Signing Mode** a **Unsigned**.
5. Guarda y copia el nombre del preset.
6. Pega ambos valores en `js/config.js`, en `window.CLOUDINARY_CONFIG`.

No necesitas configurar nada especial para que acepte PDFs — el proyecto sube los archivos usando el endpoint `/auto/upload` de Cloudinary, que detecta el tipo de archivo solo.

### Sobre la descarga de los PDFs

Los enlaces de Cloudinary, por defecto, a veces abren el PDF en una pestaña nueva en vez de descargarlo directo — depende del navegador. El código ya incluye un ajuste (`fl_attachment`) que le pide a Cloudinary forzar la descarga real en vez de solo mostrarlo. No tienes que hacer nada extra para esto, ya viene resuelto en `js/ui.js`.

---

## 4. Cambiar el nombre de tu escuela

Edita una sola línea en `js/config.js`:
```js
window.NOMBRE_ESCUELA = "Tu Escuela o Instituto";
```
Se actualiza solo en el encabezado y en el título de la pestaña del navegador.

---

## 5. Subir la página a Netlify, conectado a GitHub

1. Sube esta carpeta completa a un repositorio de GitHub.
2. En [netlify.com](https://netlify.com), crea una cuenta y conecta tu cuenta de GitHub.
3. "Add new site" → "Import an existing project" → elige tu repositorio.
4. Como es HTML/CSS/JS puro (sin build), deja "Build command" vacío y "Publish directory" apuntando a la carpeta raíz del proyecto (donde está `index.html`).
5. "Deploy" — Netlify te da una URL como `https://tu-portal.netlify.app`.
6. A partir de aquí, cada `git push` despliega solo.
7. Abre esa URL y confirma que el aviso ahora dice **"🟢 Conectado en vivo"**.

---

## 6. Checklist final

- [ ] `js/config.js` tiene tus valores reales de Firebase y Cloudinary.
- [ ] Creaste tu usuario administrador manualmente en Firebase Authentication.
- [ ] Publicaste las reglas de seguridad de Firestore (paso 2), con la estructura de subcolecciones.
- [ ] El upload preset de Cloudinary está en modo Unsigned.
- [ ] Probaste subir un certificado real y buscarlo por cédula desde la URL de producción (no solo en local).
- [ ] Probaste que un estudiante con varios certificados los vea todos juntos, y que "Descargar todos" funcione.
- [ ] Revisaste que los anuncios vacíos realmente no se muestren en la página pública.
