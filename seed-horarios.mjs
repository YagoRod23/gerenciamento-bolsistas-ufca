import mysql from "mysql2/promise";

async function seedHorarios() {
  let connection;
  try {
    console.log("Conectando ao banco de dados...");
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Primeiro, verificar bolsistas existentes
    console.log("\nBuscando bolsistas existentes...");
    const [bolsistas] = await connection.execute("SELECT id, nome FROM bolsistas LIMIT 10");
    
    if (bolsistas.length === 0) {
      console.log("❌ Nenhum bolsista encontrado no banco de dados!");
      process.exit(1);
    }
    
    console.log(`✓ Encontrados ${bolsistas.length} bolsistas:`);
    bolsistas.forEach(b => console.log(`  - ID: ${b.id}, Nome: ${b.nome}`));
    
    console.log("\nInserindo dados de teste de horários...");
    
    // Usar IDs reais dos bolsistas
    const bolsistaIds = bolsistas.map(b => b.id);
    const testHorarios = [
      [bolsistaIds[0], "segunda", "09:00", "13:00", "PROCULT"],
      [bolsistaIds[0], "terca", "13:00", "17:00", "PROCULT"],
      [bolsistaIds[1] || bolsistaIds[0], "segunda", "14:00", "18:00", "Laboratório"],
      [bolsistaIds[1] || bolsistaIds[0], "quarta", "09:00", "13:00", "Laboratório"],
      [bolsistaIds[2] || bolsistaIds[0], "terca", "08:00", "12:00", "PROCULT"],
      [bolsistaIds[2] || bolsistaIds[0], "quinta", "14:00", "18:00", "PROCULT"],
    ];

    for (const horario of testHorarios) {
      const query = `
        INSERT INTO horarios_previstos (bolsista_id, dia_semana, hora_inicio, hora_fim, local)
        VALUES (?, ?, ?, ?, ?)
      `;
      await connection.execute(query, horario);
      console.log(`✓ Inserido: Bolsista ${horario[0]} - ${horario[1]} ${horario[2]}-${horario[3]}`);
    }

    console.log("\n✅ Dados de teste inseridos com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedHorarios();
