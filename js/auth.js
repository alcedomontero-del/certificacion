/**
 * auth.js — maneja el formulario de login del administrador
 */
(function () {
  window.pintarBadgeModo("badge-modo");

  window.cuandoDBListo(() => {
    if (window.DB.getCurrentUser()) {
      window.location.href = "admin.html";
    }
  });

  if (window.ES_LOCAL) {
    document.getElementById("pista-demo").style.display = "block";
  }

  const formulario = document.getElementById("form-login");
  const errorBox = document.getElementById("login-error");
  const boton = document.getElementById("btn-login");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorBox.classList.remove("show");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    boton.disabled = true;
    boton.innerHTML = '<span class="spinner"></span> Entrando...';

    try {
      await window.DB.login(email, password);
      window.location.href = "admin.html";
    } catch (error) {
      errorBox.textContent = error.message || "No se pudo iniciar sesión";
      errorBox.classList.add("show");
      boton.disabled = false;
      boton.textContent = "Iniciar sesión";
    }
  });
})();
