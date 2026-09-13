import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const url = env.VITE_SUPABASE_URL || '';
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.startsWith('sb_publishable_');
export const emailEnabled = configured && env.VITE_EMAIL_AUTH_ENABLED === 'true';
export const googleEnabled = configured && env.VITE_GOOGLE_AUTH_ENABLED === 'true';
export const supabase = configured ? createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}) : null;
export const redirectURL = () => location.origin + location.pathname;
export function friendlyError(error) {
  if(error?.code==='invalid_credentials') return 'E-mail ou senha incorretos.';
  if(error?.code==='email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  if(error?.code==='over_email_send_rate_limit' || error?.status===429) return 'Muitas tentativas. Aguarde alguns minutos.';
  if(error?.message?.includes('Failed to fetch') || error?.name==='TypeError') return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  return error?.message || 'Não foi possível concluir. Tente novamente.';
}
