import { auth } from "@/lib/auth"
import { CreateMovieForm } from "./_components/create-movie-form"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function CreateMoviePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect("/sign-in")
    }

    return (
        <div className="mx-auto max-w-prose space-y-4 p-4">
            <h1 className="text-4xl font-bold">Create Movie</h1>
            <CreateMovieForm />
        </div>
    )
}