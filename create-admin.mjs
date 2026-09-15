import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SALT_ROUNDS = 10;

async function createAdmin() {
  const [nome, usuario, email, senha] = process.argv.slice(2);

  if (!nome || !usuario || !email || !senha) {
    console.error("Uso: node create-admin.mjs <nome> <usuario> <email> <senha>");
    process.exit(1);
  }

  try {
    const { rows: existing } = await pool.query(
      `SELECT id FROM coordenadores WHERE usuario = $1 OR email = $2`,
      [usuario, email]
    );

    if (existing.length > 0) {
      console.error(`❌ Já existe um coordenador com esse usuário ou email.`);
      process.exit(1);
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO coordenadores (nome, usuario, email, senha, "isSuperAdmin", ativo)
       VALUES ($1, $2, $3, $4, 'true', 'true')
       RETURNING id, nome, usuario, email`,
      [nome, usuario, email, senhaHash]
    );

    console.log("✓ Coordenador super admin criado:");
    console.log(rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
