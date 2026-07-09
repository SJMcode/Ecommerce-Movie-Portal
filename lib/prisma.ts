import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaPg | undefined;
};

const connectionString = `${process.env.DATABASE_URL}`;

if (!globalForPrisma.adapter) {
  globalForPrisma.adapter = new PrismaPg({ connectionString });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: globalForPrisma.adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}