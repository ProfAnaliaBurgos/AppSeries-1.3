import { supabase } from './supabaseClient.js';

// Obtener todas las series
export async function obtenerSeriesBD() {
  return await supabase
    .from('series')
    .select('*')
    .order('id', { ascending: false });
}

// Obtener todos los comentarios
export async function obtenerComentariosBD() {
  return await supabase
    .from('comentarios')
    .select('*')
    .order('created_at', { ascending: true });
}

// Subir imagen al Bucket 'portadas'
export async function subirImagenStorage(archivo) {
  const nombreArchivo = `${Date.now()}_${archivo.name}`;

  const { error: storageError } = await supabase.storage
    .from('portadas')
    .upload(nombreArchivo, archivo);

  if (storageError) throw storageError;

  const { data: urlData } = supabase.storage
    .from('portadas')
    .getPublicUrl(nombreArchivo);

  return urlData.publicUrl;
}

// Guardar nueva serie
export async function crearSerieBD(nuevaSerie) {
  return await supabase.from('series').insert([nuevaSerie]);
}

// Borrar serie
export async function eliminarSerieBD(id) {
  return await supabase.from('series').delete().eq('id', id);
}

// Editar serie
export async function editarSerieBD(id, resena, puntuacion) {
  return await supabase
    .from('series')
    .update({ resena, puntuacion })
    .eq('id', id);
}

// Agregar comentario
export async function agregarComentarioBD(serieId, texto, userEmail) {
  return await supabase.from('comentarios').insert([
    {
      serie_id: serieId,
      texto: texto,
      user_email: userEmail
    }
  ]);
}