import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { z } from "zod";

export const uploadRouter = router({
  uploadDocumento: publicProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Decodificar base64
      const buffer = Buffer.from(input.fileData, 'base64');
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `documentos/${timestamp}-${randomSuffix}-${input.fileName}`;
      
      // Upload para S3
      const result = await storagePut(fileKey, buffer, input.mimeType);
      
      return {
        url: result.url,
        fileKey,
      };
    }),
});

