import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "./email";
import { render, toPlainText } from "react-email";
import EmailVerification from "@/components/email/templates/email-verification";



const cleanAuthUrl = process.env.BETTER_AUTH_URL?.replace(/\/$/, "");

const trustedOrigins = [
  cleanAuthUrl || "",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  "https://ecommerce-movie-portal.vercel.app",
].filter(Boolean);

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins,

    emailAndPassword:{
        enabled: true,
        async sendResetPassword(data){
            console.log("PASSWORD RESET", data.url)
            await sendEmail(data.user.email, "Password Reset", `
                Hello ${data.user.name},
You requested a password reset. Click the link below to reset your password:
${data.url}`,
                `<h1>Hello ${data.user.name},</h1>
<p>You requested a password reset. Click the link below to reset your password:</p>
<a href="${data.url}">Reset Password</a>
                `
                );
        }
    },
    emailVerification:{
        sendOnSignIn: true,
        sendOnSignUp: true,
        async sendVerificationEmail(data){
            console.log("EMAIL VERIFICATION", data.url)

            const html = await render(<EmailVerification url={data.url} />)
            const text = toPlainText(html)

            await sendEmail(data.user.email, 
                "Email Verification",
                text,
                html

                );
        },
    },

    plugins: [
        nextCookies()
    ]
});