import { supabase } from './supabaseClient.js';

export let usuarioActual = null;

// Verifica si hay sesión activa al cargar
export async function verificarSesion(alCambiarEstado) {
  const { data: { session } } = await supabase.auth.getSession();
  usuarioActual = session ? session.user : null;
  alCambiarEstado(usuarioActual);
}

// Registro
export async function registrarUsuario(email, password) {
  return await supabase.auth.signUp({ email, password });
}

// Login
export async function iniciarSesion(email, password) {
  const respuesta = await supabase.auth.signInWithPassword({ email, password });
  if (!respuesta.error) {
    usuarioActual = respuesta.data.user;
  }
  return respuesta;
}

// Logout
export async function cerrarSesion() {
  await supabase.auth.signOut();
  usuarioActual = null;
}