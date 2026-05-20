const supabaseUrl = 'https://umdbrzfsjtenaoiugzpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZGJyemZzanRlbmFvaXVnenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Njg3MDEsImV4cCI6MjA5NDQ0NDcwMX0.uIWMzucUZNC-97R8fnFM6K-3KQKegLeA1AcSYYd2eK4';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase initialized");
