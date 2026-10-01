import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type Db = PrismaClient;

export function createDb(connectionString?: string): Db {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Reuse one client across dev hot reloads so we don't exhaust connections.
const globalForDb = globalThis as typeof globalThis & { __db?: Db };
export const db = (globalForDb.__db ??= createDb(process.env.DATABASE_URL));
