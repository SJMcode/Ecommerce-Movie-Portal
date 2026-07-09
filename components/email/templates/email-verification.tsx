import React from "react";
import { Button, Heading, Text, Hr, Section } from "react-email";
import EmailLayout from "./email-layout";

type Props = {
  url: string;
};

export default function EmailVerification({ url="http://localhost:3000" }: Props) {
  return (
    <EmailLayout>
      {/* Brand Header */}
      <Text className="text-red-500 font-mono text-xs uppercase tracking-widest font-bold mb-2">
        Lonely Rider Movie Portal
      </Text>
      
      <Heading className="text-2xl font-bold text-zinc-100 tracking-tight">
        Verify your email address
      </Heading>

      <Text className="text-sm text-zinc-300 mt-6 leading-relaxed">
        Thank you for signing up. To complete your registration and secure your account, please verify your email address by clicking the button below:
      </Text>

      {/* Button Section */}
      <Section className="text-center my-8">
        <Button 
          href={url} 
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md px-6 py-3 text-sm inline-block shadow-md transition"
        >
          Verify Email Address
        </Button>
      </Section>

      <Text className="text-xs text-zinc-400 leading-relaxed mb-6">
        For your security, this link will expire in 24 hours. If you did not request this registration, you can safely ignore this email.
      </Text>

      <Hr className="border-zinc-800 my-6" />

      {/* Fallback Link Section */}
      <Text className="text-xs text-zinc-500 leading-normal">
        If the button above does not work, copy and paste the following URL into your web browser:
      </Text>
      <Text className="text-xs text-red-400 break-all font-mono mt-1">
        {url}
      </Text>
    </EmailLayout>
  );
}

// Mock data for the React Email Preview Dashboard
EmailVerification.PreviewProps = {
  url: "https://lonely-rider.se/auth/verify?token=example_token_123"
} satisfies Props;
