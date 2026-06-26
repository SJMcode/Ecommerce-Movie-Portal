import Link from "next/link";
import { prisma } from "@/lib/prisma";

// movies page
// public page where customers browse available movies

type MovieCardData = {
  id: string;
  title: string;
  price: number;
  releaseDate: number | string;
  imageUrl?: string | null;
  runtime?: number | null;
};

// get movies from DB
// page should still render even if there is nothing to show
async function getMovies(): Promise<MovieCardData[]> {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
        price: true,
        releaseDate: true,
        imageUrl: true,
        runtime: true,
      },
    });

    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      price: Number(movie.price),
      releaseDate: movie.releaseDate,
      imageUrl: movie.imageUrl,
      runtime: movie.runtime,
    }));
  } catch {
    // DB not answering
    // nothing to show, but page should not die
    return [];
  }
}

// empty message
// used when DB has no movies yet
function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
      <p className="text-lg font-semibold text-zinc-300">
        No movies here yet.
      </p>

      <p className="mt-2 text-sm">
        Our database is currently being updated. Please come back soon!
      </p>
    </div>
  );
}

// one movie card
// clicking it opens movie details
function MovieCard({ movie }: { movie: MovieCardData }) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition hover:-translate-y-1 hover:border-red-500/60"
    >
      <div
        className="flex aspect-2/3 items-center justify-center rounded-xl bg-cover bg-center text-center"
        // movie image
        // if DB has imageUrl, show it
        // if not, show dark card with title
        style={{
          backgroundImage: movie.imageUrl
            ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.65)), url(${movie.imageUrl})`
            : "linear-gradient(to bottom right, #27272a, #09090b)",
        }}
      >
        {!movie.imageUrl && (
          <span className="px-3 text-sm font-semibold text-zinc-300">
            {movie.title}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="line-clamp-2 text-base font-semibold text-zinc-50 group-hover:text-red-300">
          {movie.title}
        </h2>

        <div className="flex flex-col gap-1 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {movie.releaseDate}
            {movie.runtime ? ` · ${movie.runtime} min` : ""}
          </span>

          <span className="font-semibold text-red-400">
            {Number.isFinite(movie.price) ? `${movie.price} kr` : "Price TBA"}
          </span>
        </div>

        <p className="pt-2 text-sm font-medium text-zinc-300 group-hover:text-white">
          View details →
        </p>
      </div>
    </Link>
  );
}

export default async function MoviesPage() {
  const movies = await getMovies();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
              MovieShop
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Browse movies
            </h1>

            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              Choose a movie, open its details, and continue from there.
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            ← Back to home
          </Link>
        </div>

        {movies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}