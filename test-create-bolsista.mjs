import mysql from "mysql2/promise";

async function testCreateBolsista() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Criar um novo bolsista de teste
    const testBolsista = {
      id: 999999,
      nome: "TESTE BOLSISTA",
      cpf: "999.999.999-99",
      email: "teste@test.com",
      dataInicio: new Date(),
      dataFim: new Date(),
      projetoId: 1
    };
    
    console.log("Inserindo bolsista de teste...");
    await connection.execute(`
      INSERT INTO bolsistas (id, nome, cpf, email, dataInicio, dataFim, projetoId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testBolsista.id, testBolsista.nome, testBolsista.cpf, testBolsista.email, testBolsista.dataInicio, testBolsista.dataFim, testBolsista.projetoId]);
    
    console.log("✓ Bolsista inserido com ID:", testBolsista.id);
    
    // Inserir horários
    console.log("\nInserindo horários...");
    const horarios = [
      [testBolsista.id, "segunda", "09:00", "13:00", "PROCULT"],
      [testBolsista.id, "terca", "14:00", "18:00", "Laboratório"],
    ];
    
    for (const horario of horarios) {
      await connection.execute(`
        INSERT INTO horarios_previstos (bolsista_id, dia_semana, hora_inicio, hora_fim, local)
        VALUES (?, ?, ?, ?, ?)
      `, horario);
      console.log(`✓ Horário inserido: ${horario[1]} ${horario[2]}-${horario[3]}`);
    }
    
    // Verificar se foram salvos
    console.log("\nVerificando horários salvos...");
    const [savedHorarios] = await connection.execute(`
      SELECT * FROM horarios_previstos WHERE bolsista_id = ?
    `, [testBolsista.id]);
    
    console.log(`✓ Total de horários salvos: ${savedHorarios.length}`);
    savedHorarios.forEach(h => {
      console.log(`  - ${h.dia_semana}: ${h.hora_inicio} - ${h.hora_fim} (${h.local})`);
    });
    
    // Limpar dados de teste
    console.log("\nLimpando dados de teste...");
    await connection.execute(`DELETE FROM horarios_previstos WHERE bolsista_id = ?`, [testBolsista.id]);
    await connection.execute(`DELETE FROM bolsistas WHERE id = ?`, [testBolsista.id]);
    console.log("✓ Dados de teste removidos");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testCreateBolsista();
