import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';

const supabaseUrl = 'https://nufhfyyjkhshmkbmwwxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZmhmeXlqa2hzaG1rYm13d3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODIxNDQsImV4cCI6MjA5Mjc1ODE0NH0.jzHn4-GgMPvQSakEVmBqMq5ZuqaKak8JOnrUgwN_cyU';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const email = 'parthparekh1507@gmail.com';
const password = 'Parth1234';
const folder = '30b9f6cd-d144-4309-8702-27c2ec4600ae/5ddf19b0-8411-4065-8edc-aa98158c0577';
const filePath = `${folder}/test-upload.pdf`;
const fileName = 'test-upload.pdf';

writeFileSync(fileName, '%PDF-1.4\nTest PDF content');
const fileContent = readFileSync(fileName);

(async () => {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error('SIGN IN ERROR', signInError);
    process.exit(1);
  }
  console.log('Signed in userId', signInData.session?.user?.id);
  const { data: userData, error: getUserError } = await supabase.auth.getUser();
  if (getUserError) {
    console.error('GET USER ERROR', getUserError);
    process.exit(1);
  }
  console.log('USER ID:', userData.user?.id);
  const { data, error } = await supabase.storage.from('reports').upload(filePath, fileContent, { upsert: true });
  console.log('UPLOAD data', data);
  console.log('UPLOAD error', error);
  process.exit(error ? 1 : 0);
})();
