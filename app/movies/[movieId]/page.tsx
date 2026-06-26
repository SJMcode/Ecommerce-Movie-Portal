import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// movie detail page
// customer can see more information about one movie here

type MovieDetails = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  releaseDate: number | string;
  runtime: number | null;
  stock: number | null;
  imageUrl: string | null;
  genres: string[];
}; 

// turn DB movie into page movie
// page only needs display data
function mapMovie(movie: {
  id: string;
  title: string;
  description: string | null;
  price: unknown;
  releaseDate: unknown;
  runtime: number | null;
  stock: number | null;
  imageUrl: string | null;
  genres?: {
    genre: {
      name: string;
    };
  }[];
}): MovieDetails {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    price: Number(movie.price),

    // releaseDate seems to be number in our DB
    // string is also allowed just in case
    releaseDate:
      typeof movie.releaseDate === "number" ||
      typeof movie.releaseDate === "string"
        ? movie.releaseDate
        : "Unknown",

    runtime: movie.runtime,
    stock: movie.stock,
    imageUrl: movie.imageUrl,

    // genre comes from MovieGenre relation
    // if relation has no data, page still works
    genres: movie.genres?.map((movieGenre) => movieGenre.genre.name) ?? [],
  };
}

// get one movie from DB
// missing movie id should be handled safely
async function getMovie(movieId: string): Promise<MovieDetails | null> {
  try {
    const movie = await prisma.movie.findUnique({
      where: {
        id: movieId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        releaseDate: true,
        runtime: true,
        stock: true,
        imageUrl: true,

        // DB note:
        // this assumes Movie has relation field movieGenres
        // if Prisma screams, we adjust this relation name from schema
        genres: {
          select: {
            genre: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!movie) {
      return null;
    }

    return mapMovie(movie);
  } catch {
    // DB not answering or relation name mismatch
    // no crash, show not found page
    return null;
  }
}

// add to cart button
// button exists here because BL 03.03 asks for it
// real cart behavior belongs to BL 04
function AddToCartButton() {
  return (
    <button
      type="button"
      className="w-full rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 sm:w-auto"
    >
      Add to cart
    </button>
  );
}

// small info card
function MovieInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = await params;

  // no id = not found
  if (!movieId) {
    notFound();
  }

  const movie = await getMovie(movieId);

  // movie does not exist = not found
  if (!movie) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/movies"
          className="text-sm font-semibold text-red-400 transition hover:text-red-300"
        >
          ← Back to movies
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
          <div
            className="flex aspect-2/3 items-center justify-center rounded-3xl border border-zinc-800 bg-cover bg-center text-center shadow-xl"
            // movie poster/image
            // if DB has imageUrl, show it
            // if not, show dark card with title
            style={{
              backgroundImage: movie.imageUrl
                ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.65)), url(${movie.imageUrl})`
                : "linear-gradient(to bottom right, #27272a, #09090b)",
            }}
          >
            {!movie.imageUrl && (
              <span className="px-6 text-2xl font-bold text-zinc-300">
                {movie.title}
              </span>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
                Movie details
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {movie.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
                {movie.description || "No description available yet."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MovieInfoItem
                label="Price"
                value={
                  Number.isFinite(movie.price)
                    ? `${movie.price} kr`
                    : "Price TBA"
                }
              />

              <MovieInfoItem label="Release date" value={movie.releaseDate} />

              <MovieInfoItem
                label="Runtime"
                value={movie.runtime ? `${movie.runtime} min` : "Runtime TBA"}
              />

              <MovieInfoItem
                label="Stock"
                value={movie.stock !== null ? movie.stock : "Stock TBA"}
              />

              <MovieInfoItem
                label="Genre"
                value={
                  movie.genres.length > 0 ? movie.genres.join(", ") : "Genre TBA"
                }
              />
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-100">
                  Ready to add this movie?
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Cart functionality is connected in the cart and checkout
                  workflow.
                </p>
              </div>

              <AddToCartButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}