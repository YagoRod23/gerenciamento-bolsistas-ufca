import { invokeLLM } from "./_core/llm";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { PDFParse } from "pdf-parse";

export interface ResultadoAnalise {
  status: "CONFORME" | "NAO_CONFORME" | "ATENCAO";
  cargaHorariaDeclarada: number;
  cargaHorariaCalculada: number;
  divergenciaHoras: number;
  observacoes: string[];
  atividades: {
    dia: string;
    descricao: string;
    horas: number;
    alerta?: string;
  }[];
  recomendacao: string;
}

/**
 * Baixa um arquivo da URL e salva temporariamente
 */
async function downloadFile(url: string): Promise<string> {
  try {
    console.log(`[Analise IA] Iniciando download de: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Falha ao baixar arquivo: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log(`[Analise IA] Arquivo baixado: ${buffer.byteLength} bytes`);
    
    const tempPath = join(tmpdir(), `analise-${Date.now()}.pdf`);
    await writeFile(tempPath, Buffer.from(buffer));
    console.log(`[Analise IA] Arquivo salvo em: ${tempPath}`);
    
    return tempPath;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[Analise IA] Erro ao baixar arquivo: ${errorMsg}`);
    throw error;
  }
}

/**
 * Extrai texto de um PDF usando pdf-parse (sem depender de pdftotext do sistema)
 */
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    console.log(`[Analise IA] Extraindo texto do PDF usando pdf-parse: ${pdfPath}`);
    
    // Ler arquivo PDF
    const pdfBuffer = await readFile(pdfPath);
    console.log(`[Analise IA] Buffer do PDF: ${pdfBuffer.byteLength} bytes`);
    
    // Criar instância do PDFParse com o buffer
    const pdfParser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    
    // Extrair texto
    const textResult = await pdfParser.getText();
    const text = textResult.text;
    
    // Limpar recursos
    await pdfParser.destroy();
    
    if (!text || text.trim().length === 0) {
      throw new Error("PDF não contém texto extraível");
    }
    
    console.log(`[Analise IA] Texto extraído com sucesso: ${text.length} caracteres`);
    return text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[Analise IA] Erro ao extrair texto do PDF: ${errorMsg}`);
    throw new Error(`Falha ao extrair texto do PDF: ${errorMsg}`);
  }
}

/**
 * Analisa um PDF de frequência usando IA para validar carga horária e atividades
 */
export async function analisarFrequenciaComIA(
  pdfUrl: string,
  projetoNome: string
): Promise<ResultadoAnalise> {
  let tempPdfPath: string | null = null;
  
  try {
    // Baixar PDF
    console.log("[Análise IA] Baixando PDF...");
    tempPdfPath = await downloadFile(pdfUrl);
    
    // Extrair texto do PDF
    console.log("[Análise IA] Extraindo texto do PDF...");
    const pdfText = await extractTextFromPDF(tempPdfPath);
    
    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error("PDF vazio ou sem texto extraível suficiente");
    }
    
    console.log(`[Análise IA] Texto extraído: ${pdfText.length} caracteres`);
    
    const prompt = `Você é um assistente especializado em análise de frequências de bolsistas universitários.

Sua tarefa é analisar o texto extraído de um PDF de frequência com RIGOR MATEMÁTICO.

TEXTO DO PDF:
${pdfText}

PROJETO: ${projetoNome}

INSTRUÇÕES OBRIGATÓRIAS:

1. EXTRAÇÃO DE ATIVIDADES:
   - Procure por TODAS as linhas com datas e horas trabalhadas
   - Para cada atividade, extraia:
     * Dia/data (ex: "01", "02", "01/10", etc)
     * Descrição exata da atividade
     * Carga horária em HORAS DECIMAIS (ex: "3h" = 3, "3h30m" = 3.5, "1h15m" = 1.25)
   - NÃO ignore nenhuma atividade
   - Se encontrar "Total: XXh" ou "Carga Total: XXh", use como cargaHorariaDeclarada

2. CÁLCULO MATEMÁTICO RIGOROSO:
   - Some TODAS as horas das atividades extraídas
   - Faça a soma passo a passo (ex: 3 + 4 + 2.5 + 3 = 12.5)
   - Verifique se a soma bate com o total declarado
   - Se houver diferença, registre em observações

3. VALIDAÇÃO DE HORAS:
   - Cada atividade deve ter entre 1 e 12 horas (valores fora disso são suspeitos)
   - Identifique atividades com horas anormais
   - Verifique se as horas são coerentes com a descrição

4. ANÁLISE DE ATIVIDADES:
   - Verifique se as atividades são coerentes com o projeto: "${projetoNome}"
   - Identifique atividades genéricas ("reunião", "estudo", "trabalho")
   - Detecte possíveis inconsistências

5. RETORNE UM JSON COM ESTA ESTRUTURA EXATA:
{
  "cargaHorariaDeclarada": number,
  "cargaHorariaCalculada": number,
  "atividades": [
    {
      "dia": "string (ex: 01, 02, 01/10, etc)",
      "descricao": "string",
      "horas": number (em decimal, ex: 3.5),
      "alerta": "string ou null"
    }
  ],
  "observacoes": ["string com observações gerais"],
  "recomendacao": "string com recomendação final"
}

REGRAS CRÍTICAS:
- A soma de todas as horas em atividades DEVE ser igual a cargaHorariaCalculada
- Se não conseguir extrair cargaHorariaDeclarada, use 0
- Retorne APENAS o JSON válido, sem texto adicional
- Não arredonde horas desnecessariamente
- Converta TODAS as horas para decimal (3h30m = 3.5)
- Some passo a passo e verifique o resultado`;

    console.log("[Análise IA] Enviando para LLM...");
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analise_frequencia",
          strict: true,
          schema: {
            type: "object",
            properties: {
              cargaHorariaDeclarada: { type: "number", description: "Carga horária total declarada no documento" },
              cargaHorariaCalculada: { type: "number", description: "Carga horária total calculada pela soma das atividades" },
              atividades: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dia: { type: "string", description: "Dia ou data da atividade" },
                    descricao: { type: "string", description: "Descrição da atividade" },
                    horas: { type: "number", description: "Horas em formato decimal" },
                    alerta: { type: "string", description: "Alerta se houver problema, ou vazio" }
                  },
                  required: ["dia", "descricao", "horas", "alerta"],
                  additionalProperties: false
                }
              },
              observacoes: {
                type: "array",
                items: { type: "string" }
              },
              recomendacao: { type: "string", description: "Recomendação final" }
            },
            required: ["cargaHorariaDeclarada", "cargaHorariaCalculada", "atividades", "observacoes", "recomendacao"],
            additionalProperties: false
          }
        }
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    console.log(`[Análise IA] Resposta recebida. Content length: ${content?.length || 0}`);
    
    if (!content || content.trim().length === 0) {
      throw new Error("Resposta vazia da IA - o modelo não retornou conteúdo");
    }

    console.log("[Análise IA] Processando resposta JSON...");
    
    // Tentar fazer parse do JSON
    let analise: any;
    try {
      // Remover possíveis markdown code blocks
      const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analise = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error(`[Análise IA] Erro ao parsear JSON. Conteúdo recebido: "${content.substring(0, 200)}"`);
      throw new Error(`Resposta da IA não é um JSON válido. Conteúdo: "${content.substring(0, 100)}..."`);
    }

    // VALIDAÇÃO: Verificar se a soma das atividades bate com cargaHorariaCalculada
    const somaDasAtividades = analise.atividades.reduce((sum: number, a: any) => sum + (a.horas || 0), 0);
    console.log(`[Análise IA] Soma das atividades: ${somaDasAtividades}, Carga calculada pela IA: ${analise.cargaHorariaCalculada}`);
    
    if (Math.abs(somaDasAtividades - analise.cargaHorariaCalculada) > 0.1) {
      console.warn(`[Análise IA] AVISO: Soma das atividades não bate! Corrigindo de ${analise.cargaHorariaCalculada} para ${somaDasAtividades}`);
      analise.cargaHorariaCalculada = somaDasAtividades;
      if (!analise.observacoes) analise.observacoes = [];
      analise.observacoes.push(`CORREÇÃO AUTOMÁTICA: Carga horária ajustada para ${somaDasAtividades}h (soma das atividades)`);
    }

    // Calcular divergência
    const divergencia = Math.abs(
      analise.cargaHorariaDeclarada - analise.cargaHorariaCalculada
    );

    // Determinar status
    let status: "CONFORME" | "NAO_CONFORME" | "ATENCAO";
    if (divergencia === 0 && analise.atividades.every((a: any) => !a.alerta || a.alerta === "")) {
      status = "CONFORME";
    } else if (divergencia > 2 || analise.atividades.some((a: any) => a.alerta && a.alerta !== "")) {
      status = "ATENCAO";
    } else {
      status = "NAO_CONFORME";
    }

    console.log("[Análise IA] Análise concluída com sucesso!");
    return {
      status,
      cargaHorariaDeclarada: analise.cargaHorariaDeclarada,
      cargaHorariaCalculada: analise.cargaHorariaCalculada,
      divergenciaHoras: divergencia,
      observacoes: analise.observacoes || [],
      atividades: analise.atividades || [],
      recomendacao: analise.recomendacao || "Sem recomendação",
    };
  } catch (error) {
    console.error("Erro ao analisar frequência com IA:", error);
    throw new Error(`Falha na análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  } finally {
    // Limpar arquivo temporário
    if (tempPdfPath) {
      try {
        await unlink(tempPdfPath);
      } catch (e) {
        console.warn("Não foi possível remover arquivo temporário:", e);
      }
    }
  }
}
