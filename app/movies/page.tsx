import { prisma } from "@/lib/prisma"

export default async function MoviesPage() {

    const movies = prisma.movie.findMany({
        orderBy: { title: 'desc' }
    })

    return (
        <div>
            <h1>Movies Page!</h1>
        </div>
    )
}