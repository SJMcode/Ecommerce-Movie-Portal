import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendEmail(email: string, subject: string, text: string, html?: string) {

  return  await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        text,
        html,

    });


}