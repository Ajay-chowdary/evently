import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function prismaClient() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl?.startsWith("file:")) {
    const absolute = path.join(process.cwd(), "prisma", "dev.db");
    return new PrismaClient({
      datasources: {
        db: { url: `file:${absolute}` },
      },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? prismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
