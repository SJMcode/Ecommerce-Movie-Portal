import { Body, Head, Html, pixelBasedPreset, Tailwind } from "react-email"

type props ={
    children: React.ReactNode
}

export default function EmailTemplate({ children }: props) {
  return (
    <Tailwind config={{
        presets: [pixelBasedPreset]
    }}>
        <Html>
            <Head/>
            <Body className="bg-zinc-950 text-zinc-100 my-auto mx-auto w-full max-w-2xl p-8 font-sans">
                {children}
            </Body>
        </Html>
    </Tailwind>
  )
}