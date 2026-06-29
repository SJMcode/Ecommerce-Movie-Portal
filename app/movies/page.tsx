import Link from "next/link";
import { prisma } from "@/lib/prisma";

// movies page
// public catalog where customers browse available movies
// users can search and filter movies here

type MovieCardData = {
  id: string;
  title: string;
  price: number;
  releaseDate: number | string;
  imageUrl?: string | null;
  runtime?: number | null;
  genre?: string | null;
};

type GenreOption = {
  id: string;
  name: string;
};

type MovieFilters = {
  q: string;
  genre: string;
  fromYear?: number;
  toYear?: number;
};

// use Prisma's own type from the current prisma client
// this avoids guessing the exact generated import path
type MovieFindManyArgs = NonNullable<Parameters<typeof prisma.movie.findMany>[0]>;
type MovieWhereInput = NonNullable<MovieFindManyArgs["where"]>;

// turn year from URL string into number
// empty or invalid values become undefined
function parseYear(value?: string) {
  if (!value) {
    return undefined;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    return undefined;
  }

  return year;
}

// check if user is searching/filtering
function hasActiveFilters(filters: MovieFilters) {
  return Boolean(
    filters.q ||
      filters.genre ||
      filters.fromYear !== undefined ||
      filters.toYear !== undefined,
  );
}

// get genres from DB for the genre dropdown
async function getGenres(): Promise<GenreOption[]> {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return genres;
  } catch (error) {
    // DB not answering
    // dropdown should not kill the page
    console.error("Genres DB error:", error);
    return [];
  }
}

// get movies from DB
// q searches title, description, genre, director and cast
// genre/fromYear/toYear are extra filters
async function getMovies(filters: MovieFilters): Promise<MovieCardData[]> {
  try {
    const whereFilters: MovieWhereInput[] = [];

    if (filters.q.length > 0) {
      const textFilter = {
        contains: filters.q,
        mode: "insensitive" as const,
      };

      whereFilters.push({
        OR: [
          {
            title: textFilter,
          },
          {
            description: textFilter,
          },
          {
            genres: {
              some: {
                genre: {
                  name: textFilter,
                },
              },
            },
          },
          {
            directors: {
              some: {
                person: {
                  name: textFilter,
                },
              },
            },
          },
          {
            cast: {
              some: {
                person: {
                  name: textFilter,
                },
              },
            },
          },
        ],
      });
    }

    if (filters.genre.length > 0) {
      whereFilters.push({
        genres: {
          some: {
            genre: {
              name: filters.genre,
            },
          },
        },
      });
    }

    if (filters.fromYear !== undefined) {
      whereFilters.push({
        releaseDate: {
          gte: filters.fromYear,
        },
      });
    }

    if (filters.toYear !== undefined) {
      whereFilters.push({
        releaseDate: {
          lte: filters.toYear,
        },
      });
    }

    const movies = await prisma.movie.findMany({
      where:
        whereFilters.length > 0
          ? {
              AND: whereFilters,
            }
          : undefined,
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

        // Movie.genres is MovieGenre[]
        // show first genre on card
        genres: {
          select: {
            genre: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      price: Number(movie.price),
      releaseDate: movie.releaseDate,
      imageUrl: movie.imageUrl,
      runtime: movie.runtime,
      genre: movie.genres[0]?.genre.name ?? null,
    }));
  } catch (error) {
    // DB not answering
    // nothing to show, but page should not die
    console.error("Movies page DB error:", error);
    return [];
  }
}

// empty message
// used when DB has no movies or filters have no matches
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
      <p className="text-lg font-semibold text-zinc-300">{title}</p>

      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

// movie filters
// normal GET form, so the URL becomes /movies?q=matrix&genre=Action
function MovieFiltersForm({
  filters,
  genres,
}: {
  filters: MovieFilters;
  genres: GenreOption[];
}) {
  return (
    <form
      action="/movies"
      method="GET"
      className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_130px_130px_auto]">
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search title, director, cast, genre..."
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

<div className="relative">
  <select
    name="genre"
    defaultValue={filters.genre}
    aria-label="Genre"
    className="min-h-11 w-full appearance-none rounded-full border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition focus:border-red-500"
  >
    <option value="">All genres</option>

    {genres.map((genre) => (
      <option key={genre.id} value={genre.name}>
        {genre.name}
      </option>
    ))}
  </select>

  {/* custom select arrow */}
  {/* appearance-none removes browser arrow, this one is ours */}
  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400">
    ▾
  </span>
</div>

<input
  type="text"
  inputMode="numeric"
  name="fromYear"
  defaultValue={filters.fromYear ?? ""}
  placeholder="From year"
  className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
/>

<input
  type="text"
  inputMode="numeric"
  name="toYear"
  defaultValue={filters.toYear ?? ""}
  placeholder="To year"
  className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
/>

        <button
          type="submit"
          className="min-h-11 rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Search
        </button>
      </div>

      {hasActiveFilters(filters) && (
        <div className="mt-4">
          <Link
            href="/movies"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            Clear search and filters
          </Link>
        </div>
      )}
    </form>
  );
}

// one movie card
// clicking it opens movie details
function MovieCard({ movie }: { movie: MovieCardData }) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-zinc-800/70"
    >
      <div
        className="flex aspect-[2/3] items-center justify-center rounded-xl bg-cover bg-center text-center"
        // movie image
        // if DB has imageUrl, show it clear
        // if not, show dark card with title
        style={{
          backgroundImage: movie.imageUrl
            ? `url(${movie.imageUrl})`
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

        <p className="text-xs text-zinc-500">{movie.genre ?? "Genre TBA"}</p>

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

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    fromYear?: string;
    toYear?: string;
  }>;
}) {
  const params = await searchParams;

  // filters come from URL
  // example: /movies?q=nolan&genre=Action&fromYear=2000
  const filters: MovieFilters = {
    q: params.q?.trim() ?? "",
    genre: params.genre?.trim() ?? "",
    fromYear: parseYear(params.fromYear),
    toYear: parseYear(params.toYear),
  };

  const [movies, genres] = await Promise.all([
    getMovies(filters),
    getGenres(),
  ]);

  const isFiltering = hasActiveFilters(filters);

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
              Search and filter the catalog by title, genre, people, or year.
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            ← Back to home
          </Link>
        </div>

        <MovieFiltersForm filters={filters} genres={genres} />

        {isFiltering && (
          <p className="mt-6 text-sm text-zinc-400">
            Showing {movies.length} result{movies.length === 1 ? "" : "s"} from
            your current search and filters.
          </p>
        )}

        <div className="mt-8">
          {movies.length === 0 ? (
            isFiltering ? (
              <EmptyState
                title="No movies found."
                description="Try another title, genre, director, actor, or year range."
              />
            ) : (
              <EmptyState
                title="No movies here yet."
                description="Our database is currently being updated. Please come back soon!"
              />
            )
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}