import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { nextCookies } from "better-auth/next-js";



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword:{
        enabled: true,
        async sendResetPassword(data){
            console.log("PASSWORD RESET", data.url)
        }
    },
    emailVerification:{
        sendOnSignIn: true,
        sendOnSignUp: true,
        async sendVerificationEmail(data){
            console.log("EMAIL VERIFICATION", data.url)
        },
    },

    plugins: [
        nextCookies()
    ]
});