import { 
  verificarSesion, 
  registrarUsuario, 
  iniciarSesion, 
  cerrarSesion, 
  usuarioActual 
} from './auth.js';

import { 
  obtenerSeriesBD, 
  obtenerComentariosBD, 
  subirImagenStorage, 
  crearSerieBD, 
  eliminarSerieBD, 
  editarSerieBD, 
  agregarComentarioBD 
} from './series.js';

// Referencias DOM
const secAuth = document.getElementById('sec-auth');
const secFormulario = document.getElementById('sec-formulario');
const userInfo = document.getElementById('user-info');
const btnLogout = document.getElementById('btn-logout');

const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const formSerie = document.getElementById('form-serie');
const contenedorCards = document.getElementById('contenedor-cards');

// 1. INICIALIZACIÓN Y SESIÓN
verificarSesion((usuario) => {
  actualizarUI(usuario);
  cargarCatalogo();
});

function actualizarUI(usuario) {
  if (usuario) {
    secAuth.style.display = 'none';
    secFormulario.style.display = 'block';
    btnLogout.style.display = 'inline-block';
    userInfo.textContent = `Hola, ${usuario.email}`;
  } else {
    secAuth.style.display = 'block';
    secFormulario.style.display = 'none';
    btnLogout.style.display = 'none';
    userInfo.textContent = '';
    document.getElementById('form-auth')?.reset();
  }
}

// Eventos de Autenticación
btnRegister.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) return alert('Completá email y contraseña.');

  const { error } = await registrarUsuario(email, password);
  if (error) alert('Error: ' + error.message);
  else alert('¡Registro exitoso! Ya podés ingresar.');
});

btnLogin.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) return alert('Ingresá email y contraseña.');

  const { data, error } = await iniciarSesion(email, password);
  if (error) alert('Error: ' + error.message);
  else actualizarUI(data.user);
});

btnLogout.addEventListener('click', async () => {
  await cerrarSesion();
  actualizarUI(null);
});

// 2. CREAR SERIE
formSerie.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!usuarioActual) return alert('Debés iniciar sesión.');

  const titulo = document.getElementById('titulo').value;
  const genero = document.getElementById('genero').value;
  const puntuacion = parseFloat(document.getElementById('puntuacion').value);
  const resena = document.getElementById('resena').value;
  const archivoInput = document.getElementById('imagen-file');
  const archivo = archivoInput.files[0];

  let imagenUrl = 'https://via.placeholder.com/300x400?text=Sin+Portada';

  if (archivo) {
    try {
      imagenUrl = await subirImagenStorage(archivo);
    } catch (err) {
      return alert('Error al subir la imagen: ' + err.message);
    }
  }

  const { error } = await crearSerieBD({
    titulo,
    genero,
    puntuacion,
    resena,
    imagen_url: imagenUrl,
    user_email: usuarioActual.email
  });

  if (error) alert('Error al guardar: ' + error.message);
  else {
    alert('¡Serie recomendada!');
    formSerie.reset();
    cargarCatalogo();
  }
});

// 3. RENDERIZAR CATÁLOGO
async function cargarCatalogo() {
  contenedorCards.innerHTML = '<p>Cargando recomendaciones...</p>';

  const { data: series, error: errSeries } = await obtenerSeriesBD();
  if (errSeries) {
    contenedorCards.innerHTML = '<p>Error al cargar el catálogo.</p>';
    return;
  }

  if (!series || series.length === 0) {
    contenedorCards.innerHTML = '<p>Aún no hay recomendaciones.</p>';
    return;
  }

  const { data: comentarios } = await obtenerComentariosBD();
  contenedorCards.innerHTML = '';

  series.forEach(serie => {
    const esPropietario = usuarioActual && usuarioActual.email === serie.user_email;
    const comentariosSerie = comentarios ? comentarios.filter(c => c.serie_id === serie.id) : [];

    let listaComentariosHTML = '';
    comentariosSerie.forEach(c => {
      listaComentariosHTML += `
        <div class="comentario-item">
          <strong>${c.user_email.split('@')[0]}:</strong> ${c.texto}
        </div>
      `;
    });

    const cardHTML = `
      <article class="card-serie">
        <img src="${serie.imagen_url}" alt="Portada de ${serie.titulo}" onerror="this.src='https://via.placeholder.com/300x400?text=Sin+Imagen'">
        <div class="card-body">
          <div class="card-header-info">
            <span class="badge-genero">${serie.genero}</span>
            <span class="score">★ ${serie.puntuacion}</span>
          </div>
          <h3 class="card-title">${serie.titulo}</h3>
          <p class="card-resena">${serie.resena}</p>
          <div class="card-footer-author">Recomendado por: <strong>${serie.user_email}</strong></div>

          ${esPropietario ? `
            <div class="card-actions">
              <button onclick="editarSerie(${serie.id}, '${serie.resena.replace(/'/g, "\\'")}', ${serie.puntuacion})" class="btn-action btn-edit">Editar</button>
              <button onclick="eliminarSerie(${serie.id})" class="btn-action btn-delete">Eliminar</button>
            </div>
          ` : ''}

          <div class="seccion-comentarios">
            <h4>Comentarios (${comentariosSerie.length})</h4>
            <div class="lista-comentarios">
              ${listaComentariosHTML || '<p class="sin-comentarios">Sin comentarios aún.</p>'}
            </div>

            ${usuarioActual ? `
              <div class="form-comentario">
                <input type="text" id="input-comentario-${serie.id}" placeholder="Escribí un comentario..." />
                <button onclick="agregarComentario(${serie.id})" class="btn-comentar">Enviar</button>
              </div>
            ` : '<p class="aviso-login-comentario">Iniciá sesión para comentar.</p>'}
          </div>
        </div>
      </article>
    `;
    contenedorCards.innerHTML += cardHTML;
  });
}

// 4. FUNCIONES GLOBALES PARA EVENTOS ONCLICK EN EL HTML
window.agregarComentario = async function(serieId) {
  const input = document.getElementById(`input-comentario-${serieId}`);
  const texto = input.value.trim();
  if (!texto) return alert('Escribí algo antes de enviar.');

  const { error } = await agregarComentarioBD(serieId, texto, usuarioActual.email);
  if (error) alert('Error: ' + error.message);
  else {
    input.value = '';
    cargarCatalogo();
  }
};

window.eliminarSerie = async function(id) {
  const result = await Swal.fire({
    title: '¿Estás seguro/a?',
    text: "No vas a poder revertir esta acción",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d63031',
    cancelButtonColor: '#6c5ce7',
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    const { error } = await eliminarSerieBD(id);
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('¡Borrado!', 'La recomendación fue eliminada.', 'success');
      cargarCatalogo();
    }
  }
};


window.editarSerie = async function(id, resenaActual, puntuacionActual) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar recomendación',
    html: `
      <label style="display:block; text-align:left; margin-bottom:0.3rem;">Nueva reseña:</label>
      <textarea id="swal-input-resena" class="swal2-textarea" style="width:90%; margin:0 0 1rem 0;">${resenaActual}</textarea>
      
      <label style="display:block; text-align:left; margin-bottom:0.3rem;">Nueva puntuación (1 al 10):</label>
      <input id="swal-input-puntuacion" type="number" min="1" max="10" class="swal2-input" value="${puntuacionActual}" style="width:90%; margin:0;">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#6c5ce7',
    preConfirm: () => {
      const nuevaResena = document.getElementById('swal-input-resena').value.trim();
      const nuevaPuntuacion = parseFloat(document.getElementById('swal-input-puntuacion').value);

      if (!nuevaResena) {
        Swal.showValidationMessage('La reseña no puede estar vacía');
        return false;
      }
      if (isNaN(nuevaPuntuacion) || nuevaPuntuacion < 1 || nuevaPuntuacion > 10) {
        Swal.showValidationMessage('Ingresá una puntuación válida entre 1 y 10');
        return false;
      }

      return { nuevaResena, nuevaPuntuacion };
    }
  });

  if (formValues) {
    const { error } = await editarSerieBD(id, formValues.nuevaResena, formValues.nuevaPuntuacion);
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('¡Actualizado!', 'La reseña ha sido modificada.', 'success');
      cargarCatalogo();
    }
  }
};


Swal.fire({
  icon: 'success',
  title: '¡Genial!',
  text: '¡Serie recomendada con éxito!',
  confirmButtonColor: '#6c5ce7'
});


Swal.fire({
  icon: 'error',
  title: 'Oops...',
  text: 'Error al guardar: ' + error.message,
  confirmButtonColor: '#d63031'
});