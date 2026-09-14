import { describe, it, expect } from "vitest";
import { getAllHorarios, getHorariosByBolsista } from "../db";

describe("Horarios Database Functions", () => {
  describe("getAllHorarios", () => {
    it("deve retornar um array de horários", async () => {
      const horarios = await getAllHorarios();
      expect(Array.isArray(horarios)).toBe(true);
    });

    it("cada horário deve ter os campos obrigatórios", async () => {
      const horarios = await getAllHorarios();
      
      if (horarios.length > 0) {
        const horario = horarios[0];
        expect(horario).toHaveProperty("id");
        expect(horario).toHaveProperty("bolsistaId");
        expect(horario).toHaveProperty("diaSemana");
        expect(horario).toHaveProperty("horaInicio");
        expect(horario).toHaveProperty("horaFim");
        expect(horario).toHaveProperty("local");
      }
    });

    it("deve retornar horários com tipos corretos", async () => {
      const horarios = await getAllHorarios();
      
      if (horarios.length > 0) {
        const horario = horarios[0];
        expect(typeof horario.id).toBe("number");
        expect(typeof horario.bolsistaId).toBe("number");
        expect(typeof horario.diaSemana).toBe("string");
        expect(typeof horario.horaInicio).toBe("string");
        expect(typeof horario.horaFim).toBe("string");
        expect(typeof horario.local).toBe("string");
      }
    });

    it("dias da semana devem ser válidos", async () => {
      const horarios = await getAllHorarios();
      const diasValidos = ["segunda", "terça", "terca", "quarta", "quinta", "sexta", "sábado", "sabado", "domingo"];
      
      horarios.forEach((horario) => {
        expect(diasValidos).toContain(horario.diaSemana);
      });
    });

    it("horários devem estar em formato HH:MM", async () => {
      const horarios = await getAllHorarios();
      const regexHora = /^\d{2}:\d{2}$/;
      
      horarios.forEach((horario) => {
        expect(regexHora.test(horario.horaInicio)).toBe(true);
        expect(regexHora.test(horario.horaFim)).toBe(true);
      });
    });
  });

  describe("getHorariosByBolsista", () => {
    it("deve retornar um array de horários para um bolsista específico", async () => {
      const horarios = await getHorariosByBolsista(1);
      expect(Array.isArray(horarios)).toBe(true);
    });

    it("todos os horários retornados devem pertencer ao bolsista especificado", async () => {
      const bolsistaId = 1;
      const horarios = await getHorariosByBolsista(bolsistaId);
      
      horarios.forEach((horario) => {
        expect(horario.bolsistaId).toBe(bolsistaId);
      });
    });

    it("deve retornar array vazio para bolsista sem horários", async () => {
      const horarios = await getHorariosByBolsista(99999);
      expect(horarios).toEqual([]);
    });
  });

  describe("Comparação entre getAllHorarios e getHorariosByBolsista", () => {
    it("getAllHorarios deve retornar mais ou igual horários que getHorariosByBolsista", async () => {
      const todosHorarios = await getAllHorarios();
      const horariosBolsista1 = await getHorariosByBolsista(1);
      
      expect(todosHorarios.length).toBeGreaterThanOrEqual(horariosBolsista1.length);
    });

    it("horários de getHorariosByBolsista devem estar contidos em getAllHorarios", async () => {
      const todosHorarios = await getAllHorarios();
      const horariosBolsista1 = await getHorariosByBolsista(1);
      
      horariosBolsista1.forEach((horarioBolsista) => {
        const encontrado = todosHorarios.some(
          (h) => h.id === horarioBolsista.id && h.bolsistaId === horarioBolsista.bolsistaId
        );
        expect(encontrado).toBe(true);
      });
    });
  });
});
