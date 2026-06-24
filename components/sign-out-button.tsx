"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = React.ComponentProps<typeof Button>

function SignOutButton(props: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    await authClient.signOut()
    router.refresh()
    setIsLoading(false)
  }

  return <Button disabled={isLoading} onClick={handleClick} {...props} />
}

export { SignOutButton }
