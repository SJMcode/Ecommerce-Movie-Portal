import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { notFound } from "next/navigation"


export default async function MovieDetailsPage(props: PageProps<"/movies/[movieId]">) {

    const params = await props.params
    if (!params.movieId) {
        notFound()
    }

    // ------------------UNCOMMENT TO ENABLE BETTER AUTH
    // const session = await auth.api.getSession({
    //     headers: await headers(),
    // })

    const movie = await prisma.movie.findUnique({
        where: { id: params.movieId },
    })

    if (!movie) {
        notFound()
    }

    return (
        <div className="mx-auto max-w-prose space-y-4 p-4">

            {/* CREATE A MOVIE DETAILS LAYOUT WITH IMAGE ( -> movie.imageUrl) */}
            <h1 className="text-4xl font-bold">{movie.title}</h1>
            
        </div>
    )
}