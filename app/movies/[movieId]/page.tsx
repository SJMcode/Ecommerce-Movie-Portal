import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { DeleteMovieButton } from "./_components/delete-movie-button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

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
        // this assumes Movie has relation field genres
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

  // session is only used to decide if admin buttons should show
  // normal users should still be able to see movie details
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentUser = session
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          role: true,
        },
      })
    : null;

  const isAdmin = currentUser?.role === "admin";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex justify-between">
          <Link
            href="/movies"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            ← Back
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="cursor-pointer"
                  asChild
                >
                  <Link href={`/movies/${movieId}/edit`}>
                    Edit
                    <Edit />
                  </Link>
                </Button>

                <DeleteMovieButton
                  action={async () => {
                    "use server";

                    // Re-verify session on action invocation
                    const actionSession = await auth.api.getSession({
                      headers: await headers(),
                    });

                    if (!actionSession) {
                      throw new Error("Unauthorized");
                    }

                    // Re-verify user role in DB
                    const actionUser = await prisma.user.findUnique({
                      where: {
                        id: actionSession.user.id,
                      },
                      select: {
                        role: true,
                      },
                    });

                    if (actionUser?.role !== "admin") {
                      throw new Error("Forbidden: Admins only");
                    }

                    await prisma.movie.delete({
                      where: {
                        id: movie.id,
                      },
                    });
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
          <div
            className="flex aspect-[2/3] items-center justify-center rounded-3xl border border-zinc-800 bg-cover bg-center text-center shadow-xl"
            // movie poster/image
            // if DB has imageUrl, show it
            // if not, show dark card with title
            style={{
              backgroundImage: movie.imageUrl
                ? `url(${movie.imageUrl})`
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
                  movie.genres.length > 0
                    ? movie.genres.join(", ")
                    : "Genre TBA"
                }
              />
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-100">
                  Ready to add this movie?
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Add it to your cart and continue shopping.
                </p>
              </div>

              <AddToCartButton
                movieId={movie.id}
                className="w-full rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:{isPending} disabled:opacity-60 sm:w-auto"
              >
                Add to cart
              </AddToCartButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}