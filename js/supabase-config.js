const SUPABASE_URL = 'https://gbtzldadqnqjeacfdisw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NB7DFBmPtIFnQ4rQKU9HiQ_5kWGeNMs';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatarDataHoraBR(isoString) {
  const dt = new Date(isoString);
  return {
    data: dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    hora: dt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  };
}