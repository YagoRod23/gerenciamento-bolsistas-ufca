import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { getCoordenadorById } from "../db";
import { verifyCoordenadorSessionToken } from "../localSession";

export type ContextUser = {
  id: number;
  nome: string;
  usuario: string;
  email: string;
  isSuperAdmin: boolean;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: ContextUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: ContextUser | null = null;

  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
    const session = await verifyCoordenadorSessionToken(cookies[COOKIE_NAME]);

    if (session) {
      const coordenador = await getCoordenadorById(session.coordenadorId);
      if (coordenador && coordenador.ativo === "true") {
        user = {
          id: coordenador.id,
          nome: coordenador.nome,
          usuario: coordenador.usuario,
          email: coordenador.email,
          isSuperAdmin: coordenador.isSuperAdmin === "true",
        };
      }
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
