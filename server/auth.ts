import crypto from "crypto";

/**
 * Hash de senha usando SHA256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verifica se a senha corresponde ao hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Gera um token de sessão
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

