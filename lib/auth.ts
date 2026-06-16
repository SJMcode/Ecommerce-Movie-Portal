import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    plugins: [
        admin()
    ]
})