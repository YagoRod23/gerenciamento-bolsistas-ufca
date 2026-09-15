import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function toPg(sqlText) {
  let i = 0;
  return sqlText.replace(/\?/g, () => `$${++i}`);
}

async function run(sqlText, params = []) {
  return pool.query(toPg(sqlText), params);
}

async function checkHorarios() {
  try {
    // Buscar Edson e João
    const { rows: bolsistas } = await run(`
      SELECT id, nome FROM bolsistas
      WHERE nome ILIKE '%EDSON%' OR nome ILIKE '%Joao%'
    `);

    console.log("Bolsistas encontrados:", bolsistas);

    for (const bolsista of bolsistas) {
      const { rows: horarios } = await run(`
        SELECT * FROM horarios_previstos WHERE bolsista_id = ?
      `, [bolsista.id]);

      console.log(`\nHorários de ${bolsista.nome} (ID: ${bolsista.id}):`);
      if (horarios.length === 0) {
        console.log("  - Nenhum horário cadastrado");
      } else {
        horarios.forEach(h => {
          console.log(`  - ${h.dia_semana}: ${h.hora_inicio} - ${h.hora_fim} (${h.local})`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Erro:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkHorarios();
