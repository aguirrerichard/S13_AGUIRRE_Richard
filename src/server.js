import 'dotenv/config';
import app from './app.js';

// Sin estas variables la API no puede funcionar: mejor fallar al arrancar que a mitad de una petición
for (const variable of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[variable]) {
    console.error(`Falta la variable ${variable}. Copia .env.example como .env y complétala.`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API LuzCentro Perú en http://localhost:${PORT}/api`);
});
