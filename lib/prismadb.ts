import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // PrismaTiDBCloud takes the raw config object (with `url`), NOT a pre-built
  // Connection instance. Internally it calls `new Connection(config)` on each
  // query, giving it the URL to parse host/username/password from.
  const adapter = new PrismaTiDBCloud({ url: process.env.DATABASE_URL });
  return new PrismaClient({ adapter } as any);
}

const prismadb = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb;

export default prismadb;
