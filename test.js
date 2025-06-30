import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://mpeluntqzaitmwkhucae.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZWx1bnRxemFpdG13a2h1Y2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTIxMjQsImV4cCI6MjA2NjQyODEyNH0.dCsX3URT1P-qQDqSOtHNOheYhJ8pwWkPLGyR0TblMAg');
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'wykyaw2001@gmail.com',
  password: 'WaiYanKyaw2001'
});
console.log(data.session.access_token); // Use this token

