import mysql from "mysql2/promise";

async function checkHorarios() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Buscar Edson e João
    const [bolsistas] = await connection.execute(`
      SELECT id, nome FROM bolsistas 
      WHERE nome LIKE '%EDSON%' OR nome LIKE '%Joao%'
    `);
    
    console.log("Bolsistas encontrados:", bolsistas);
    
    for (const bolsista of bolsistas) {
      const [horarios] = await connection.execute(`
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
    if (connection) await connection.end();
  }
}

checkHorarios();
