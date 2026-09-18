// supabaseClient.js

// 1. Reemplazá con tu URL real
const SUPABASE_URL = "https://wpafkizkmnqpnrkocizy.supabase.co"; 

// 2. Reemplazá con tu anon/public key real
const SUPABASE_KEY = "sb_publishable_JrHcJJe8PbZXW-5WZE0aMQ_A8E9Bzud"; 



export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);