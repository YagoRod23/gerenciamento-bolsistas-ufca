import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser, users,
  projetos, InsertProjeto,
  bolsistas, InsertBolsista,
  documentos, InsertDocumento,
  controlePagamentos, InsertControlePagamento,
  horariosPrevistos, InsertHorarioPrevisto,
  coordenadores, InsertCoordenador,
  coordenadorProjetos, InsertCoordenadorProjeto
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { and } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Queries para Projetos
export async function getAllProjetos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projetos);
}

export async function createProjeto(data: InsertProjeto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(projetos).values(data).returning();
  return result;
}

export async function updateProjeto(id: number, data: Partial<InsertProjeto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projetos).set(data).where(eq(projetos.id, id));
}

export async function deleteProjeto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projetos).where(eq(projetos.id, id));
}

// Queries para Bolsistas
export async function getAllBolsistas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bolsistas);
}

export async function createBolsista(data: InsertBolsista) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(bolsistas).values(data);
  // Buscar o bolsista pelo CPF para retornar o ID
  if (data.cpf) {
    const [bolsista] = await db.select().from(bolsistas).where(eq(bolsistas.cpf, data.cpf)).limit(1);
    if (bolsista) {
      return { id: bolsista.id };
    }
  }
  // Se não conseguir encontrar, retornar um objeto vazio
  return { id: null };
}

export async function updateBolsista(id: number, data: Partial<InsertBolsista>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bolsistas).set(data).where(eq(bolsistas.id, id));
}

export async function deleteBolsista(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bolsistas).where(eq(bolsistas.id, id));
}

// Queries para Documentos
export async function getAllDocumentos() {
  const db = await getDb();
  if (!db) return [];
  const docs = await db.select().from(documentos);
  // Mapear statusDocumento para status para compatibilidade com frontend
  return docs.map(doc => ({
    ...doc,
    status: doc.statusDocumento
  }));
}

export async function getDocumentosByBolsista(bolsistaId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documentos).where(eq(documentos.bolsistaId, bolsistaId));
}

export async function createDocumento(data: InsertDocumento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(documentos).values(data).returning();
  return result;
}

export async function updateDocumento(id: number, data: Partial<InsertDocumento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documentos).set(data).where(eq(documentos.id, id));
}

export async function deleteDocumento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentos).where(eq(documentos.id, id));
}

// Queries para Controle de Pagamentos
export async function getAllControlePagamentos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(controlePagamentos);
}

export async function createControlePagamento(data: InsertControlePagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(controlePagamentos).values(data).returning();
  return result;
}

export async function updateControlePagamento(id: number, data: Partial<InsertControlePagamento>) {
  const db = await getDb();
  if (!db) return;
  await db.update(controlePagamentos).set(data).where(eq(controlePagamentos.id, id));
}

export async function deleteControlePagamento(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(controlePagamentos).where(eq(controlePagamentos.id, id));
}


// Horários Previstos
export async function getAllHorarios() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(horariosPrevistos);
}

export async function getHorariosByBolsista(bolsistaId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(horariosPrevistos).where(eq(horariosPrevistos.bolsistaId, bolsistaId));
}

export async function createHorarioPrevisto(horario: InsertHorarioPrevisto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(horariosPrevistos).values(horario);
}

export async function deleteHorarioPrevisto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(horariosPrevistos).where(eq(horariosPrevistos.id, id));
}

export async function deleteHorariosByBolsista(bolsistaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(horariosPrevistos).where(eq(horariosPrevistos.bolsistaId, bolsistaId));
}

export async function updateHorarioPrevisto(id: number, data: Partial<InsertHorarioPrevisto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(horariosPrevistos).set(data).where(eq(horariosPrevistos.id, id));
}



// Coordenadores
export async function getAllCoordenadores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coordenadores);
}

export async function getCoordenadorByUsuario(usuario: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coordenadores).where(eq(coordenadores.usuario, usuario)).limit(1);
  return result[0] || null;
}

export async function getCoordenadorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coordenadores).where(eq(coordenadores.id, id)).limit(1);
  return result[0] || null;
}

export async function createCoordenador(data: InsertCoordenador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coordenadores).values(data);
  return result;
}

export async function updateCoordenador(id: number, data: Partial<InsertCoordenador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coordenadores).set(data).where(eq(coordenadores.id, id));
}

export async function deleteCoordenador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(coordenadores).where(eq(coordenadores.id, id));
}

// Relacao Coordenador-Projetos
export async function getProjetosByCoordenador(coordenadorId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(coordenadorProjetos)
    .innerJoin(projetos, eq(coordenadorProjetos.projetoId, projetos.id))
    .where(eq(coordenadorProjetos.coordenadorId, coordenadorId));
  return result.map(r => r.projetos);
}

export async function linkCoordenadorToProjeto(coordenadorId: number, projetoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(coordenadorProjetos).values({ coordenadorId, projetoId });
}

export async function unlinkCoordenadorFromProjeto(coordenadorId: number, projetoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(coordenadorProjetos)
    .where(and(
      eq(coordenadorProjetos.coordenadorId, coordenadorId),
      eq(coordenadorProjetos.projetoId, projetoId)
    ));
}


export async function getOcupacaoLocais() {
  const db = await getDb();
  if (!db) return {};
  
  const horarios = await db.select().from(horariosPrevistos);
  
  // Agrupar por local e contar bolsistas
  const ocupacao: Record<string, Array<{ dia: string; horaInicio: string; horaFim: string; bolsistas: number }>> = {};
  
  horarios.forEach((h: any) => {
    if (!ocupacao[h.local]) {
      ocupacao[h.local] = [];
    }
    
    const chave = `${h.diaSemana}-${h.horaInicio}-${h.horaFim}`;
    const existing = ocupacao[h.local].find(item => 
      item.dia === h.diaSemana && item.horaInicio === h.horaInicio && item.horaFim === h.horaFim
    );
    
    if (existing) {
      existing.bolsistas++;
    } else {
      ocupacao[h.local].push({
        dia: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
        bolsistas: 1
      });
    }
  });
  
  return ocupacao;
}
