import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nufhfyyjkhshmkbmwwxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZmhmeXlqa2hzaG1rYm13d3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODIxNDQsImV4cCI6MjA5Mjc1ODE0NH0.jzHn4-GgMPvQSakEVmBqMq5ZuqaKak8JOnrUgwN_cyU';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const email = 'parthparekh1507@gmail.com';
const password = 'Parth1234';

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
if (signInError) {
  console.error('SIGN IN ERROR', signInError);
  process.exit(1);
}
const userId = signInData.session?.user?.id;
console.log('userId', userId);

const { data: households, error: householdsError } = await supabase.from('households').select('*');
console.log('householdsError', householdsError);
console.log('households', households);
