import mysql from "mysql2/promise";

async function testMultipleBolsistas() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("Buscando bolsistas existentes...");
    const [bolsistas] = await connection.execute(`
      SELECT id, nome FROM bolsistas LIMIT 3
    `);
    
    if (bolsistas.length < 2) {
      console.log("❌ Não há bolsistas suficientes para teste");
      process.exit(1);
    }
    
    console.log(`✓ Encontrados ${bolsistas.length} bolsistas`);
    
    // Adicionar horários para que 2 bolsistas estejam na PROCULT na terça das 13-17
    console.log("\nAdicionando horários de teste...");
    
    // Bolsista 1: Terça 13:00-17:00 PROCULT
    await connection.execute(`
      DELETE FROM horarios_previstos WHERE bolsista_id = ? AND dia_semana = 'terca'
    `, [bolsistas[0].id]);
    
    await connection.execute(`
      INSERT INTO horarios_previstos (bolsista_id, dia_semana, hora_inicio, hora_fim, local)
      VALUES (?, 'terca', '13:00', '17:00', 'PROCULT')
    `, [bolsistas[0].id]);
    console.log(`✓ ${bolsistas[0].nome}: Terça 13:00-17:00 PROCULT`);
    
    // Bolsista 2: Terça 13:00-17:00 PROCULT (mesmo horário!)
    await connection.execute(`
      DELETE FROM horarios_previstos WHERE bolsista_id = ? AND dia_semana = 'terca'
    `, [bolsistas[1].id]);
    
    await connection.execute(`
      INSERT INTO horarios_previstos (bolsista_id, dia_semana, hora_inicio, hora_fim, local)
      VALUES (?, 'terca', '13:00', '17:00', 'PROCULT')
    `, [bolsistas[1].id]);
    console.log(`✓ ${bolsistas[1].nome}: Terça 13:00-17:00 PROCULT`);
    
    // Verificar dados
    console.log("\nVerificando dados inseridos...");
    const [horarios] = await connection.execute(`
      SELECT h.*, b.nome FROM horarios_previstos h
      JOIN bolsistas b ON h.bolsista_id = b.id
      WHERE h.dia_semana = 'terca' AND h.hora_inicio = '13:00'
      ORDER BY b.nome
    `);
    
    console.log(`✓ Total de bolsistas na terça 13:00-17:00 PROCULT: ${horarios.length}`);
    horarios.forEach(h => {
      console.log(`  - ${h.nome}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testMultipleBolsistas();
