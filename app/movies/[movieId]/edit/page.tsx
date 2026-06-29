import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EditMovieForm } from "./_components/edit-movie-form";



// edit movie page
// this page exists so the edit route is a valid Next page
// real edit form can be connected here by the movie edit branch



async function EditMoviePage(props: PageProps<"/movies/[movieId]/edit">) {
  const { movieId } = await props.params;

  
 const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in")
  }

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      genres: true,
      directors: true,
      cast: true
    }
  })

  if (!movie) {
    notFound();
  }

  // Form validation on the client side (EditMovieForm comp) requires all values as strings, or string[]
  // Below: Type conversion of movie data from database to STRINGS so data can be passed as props to the EditMovieForm component
  const movieForForm = {
    id: movie.id,
    title: movie.title ?? "",
    description: movie.description ?? "",
    price: movie.price.toString(), //Why toString() here, and not String()?
    releaseDate: String(movie.releaseDate),
    imageUrl: movie.imageUrl ?? "",
    stock: String(movie.stock ?? 0),
    runtime: String(movie.runtime ?? ""),
    genres: movie.genres.map((genre) => genre.genreId),
    directors: movie.directors.map((d) => d.personId),
    cast: movie.cast.map((cast) => cast.personId)
  }

  return (
    <div className="mx-auto max-w-prose space-y-4 p-4">
      <h1 className="text-3xl font-semibold">Edit Movie</h1>

      <EditMovieForm movie={movieForForm} />

    </div>
  );
}

export default EditMoviePage
