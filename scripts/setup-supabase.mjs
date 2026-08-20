import { spawnSync } from 'node:child_process';
import process from 'node:process';

const projectRef = process.env.SUPABASE_PROJECT_REF;
if (!projectRef) {
  console.error('\nFalta SUPABASE_PROJECT_REF.');
  console.error('Ejemplo macOS/Linux: SUPABASE_PROJECT_REF=abc123 npm run supabase:setup');
  console.error('Ejemplo PowerShell: $env:SUPABASE_PROJECT_REF="abc123"; npm run supabase:setup\n');
  process.exit(1);
}

const run = (args) => {
  const result = spawnSync('npx', ['supabase', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

console.log('\n1/2 Vinculando el proyecto de Supabase...');
run(['link', '--project-ref', projectRef]);

console.log('\n2/2 Aplicando migraciones...');
run(['db', 'push']);

console.log('\nBase de datos creada correctamente. Ahora copiá .env.example como .env.local y completá las claves del proyecto.\n');
