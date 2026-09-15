import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export type CoordenadorSessionPayload = {
  coordenadorId: number;
  usuario: string;
  nome: string;
  isSuperAdmin: boolean;
};

function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createCoordenadorSessionToken(
  payload: CoordenadorSessionPayload
): Promise<string> {
  const expirationSeconds = Math.floor((Date.now() + SESSION_MAX_AGE_MS) / 1000);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

export async function verifyCoordenadorSessionToken(
  token: string | undefined | null
): Promise<CoordenadorSessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const { coordenadorId, usuario, nome, isSuperAdmin } = payload as Record<string, unknown>;

    if (
      typeof coordenadorId !== "number" ||
      typeof usuario !== "string" ||
      typeof nome !== "string" ||
      typeof isSuperAdmin !== "boolean"
    ) {
      return null;
    }

    return { coordenadorId, usuario, nome, isSuperAdmin };
  } catch {
    return null;
  }
}
