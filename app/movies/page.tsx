import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PersonCombobox } from "@/components/movies/person-combobox";

// movies page
// public catalog where customers browse available movies
// users can search, filter and sort movies here

type MovieCardData = {
  id: string;
  title: string;
  price: number;
  releaseDate: number | string;
  imageUrl?: string | null;
  runtime?: number | null;
  genre?: string | null;
};
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MovieFilters } from "./_components/movies-types";
import {
  hasActiveFilters,
  MovieFiltersForm,
} from "./_components/movie-search-filters-form";
import { getSafeImageSrc, MovieCard } from "./_components/movie-card";
import {
  buildMoviesHref,
  getMoviesPage,
  getPaginationTokens,
  PAGE_SIZE,
  parsePage,
} from "./_components/pagination-helpers-and-types";

type GenreOption = {
  id: string;
  name: string;
};

type PersonOption = {
  id: string;
  name: string;
};

type MovieSort =
  | "title-asc"
  | "title-desc"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "year-asc"
  | "runtime-asc"
  | "runtime-desc";

type MovieFilters = {
  q: string;
  genre: string;
  actorId: string;
  directorId: string;
  sort: MovieSort;
};

// use Prisma's own type from the current prisma client
// this avoids guessing the exact generated import path
type MovieFindManyArgs = NonNullable<
  Parameters<typeof prisma.movie.findMany>[0]
>;
type MovieWhereInput = NonNullable<MovieFindManyArgs["where"]>;
type MovieOrderBy = NonNullable<MovieFindManyArgs["orderBy"]>;

const defaultSort: MovieSort = "title-asc";

const sortOptions: {
  value: MovieSort;
  label: string;
}[] = [
  {
    value: "title-asc",
    label: "Name A-Z",
  },
  {
    value: "title-desc",
    label: "Name Z-A",
  },
  {
    value: "price-asc",
    label: "Price low to high",
  },
  {
    value: "price-desc",
    label: "Price high to low",
  },
  {
    value: "year-desc",
    label: "Newest first",
  },
  {
    value: "year-asc",
    label: "Oldest first",
  },
  {
    value: "runtime-asc",
    label: "Quick watch",
  },
  {
    value: "runtime-desc",
    label: "Epic watch",
  },
];

// URL values are just strings
// this keeps only allowed sort values
function parseSort(value?: string): MovieSort {
  const allowedSorts = sortOptions.map((option) => option.value);

  if (value && allowedSorts.includes(value as MovieSort)) {
    return value as MovieSort;
// turn year from URL string into number
// empty or invalid values become undefined
function parseYear(value?: string) {
  if (!value) {
    return undefined;
  }

  return defaultSort;
}

// check if user is searching/filtering/sorting
function hasActiveFilters(filters: MovieFilters) {
  return Boolean(
    filters.q ||
      filters.genre ||
      filters.actorId ||
      filters.directorId ||
      filters.sort !== defaultSort,
  );
}

// converts sort value into Prisma orderBy
// this gives the DB a useful first order
// later we also do human-friendly sorting in TypeScript
function getMovieOrderBy(sort: MovieSort): MovieOrderBy {
  switch (sort) {
    case "title-desc":
      return {
        title: "desc",
      };

    case "price-asc":
      return {
        price: "asc",
      };

    case "price-desc":
      return {
        price: "desc",
      };

    case "year-desc":
      return {
        releaseDate: "desc",
      };

    case "year-asc":
      return {
        releaseDate: "asc",
      };

    case "runtime-asc":
      return {
        runtime: "asc",
      };

    case "runtime-desc":
      return {
        runtime: "desc",
      };

    case "title-asc":
    default:
      return {
        title: "asc",
      };
  }
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

// get actors from DB for the actor combobox
async function getActors(): Promise<PersonOption[]> {
  try {
    const castRows = await prisma.movieCast.findMany({
      orderBy: {
        person: {
          name: "asc",
        },
      },
      select: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // same actor can appear in many movies
    // Map removes duplicates by person id
    const actorsById = new Map<string, PersonOption>();

    for (const row of castRows) {
      actorsById.set(row.person.id, row.person);
    }

    return Array.from(actorsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    // DB not answering
    // combobox should not kill the page
    console.error("Actors DB error:", error);
    return [];
  }
}

// get directors from DB for the director combobox
async function getDirectors(): Promise<PersonOption[]> {
  try {
    const directorRows = await prisma.movieDirector.findMany({
      orderBy: {
        person: {
          name: "asc",
        },
      },
      select: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // same director can appear in many movies
    // Map removes duplicates by person id
    const directorsById = new Map<string, PersonOption>();

    for (const row of directorRows) {
      directorsById.set(row.person.id, row.person);
    }

    return Array.from(directorsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    // DB not answering
    // combobox should not kill the page
    console.error("Directors DB error:", error);
    return [];
  }
}

// makes text easier to compare
// lower case, removes accents, handles symbols and keeps numbers
function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/@/g, " at ")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// splits search text into useful words/numbers
// "Spider-Man 2" becomes ["spider", "man", "2"]
function getSearchTokens(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

// counts how many small edits are needed to turn one word into another
// example: matric -> matrix = 1 edit
function getLevenshteinDistance(a: string, b: string) {
  const first = normalizeSearchText(a);
  const second = normalizeSearchText(b);

  const matrix = Array.from({ length: first.length + 1 }, () =>
    Array(second.length + 1).fill(0),
  );

  for (let i = 0; i <= first.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= second.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= first.length; i++) {
    for (let j = 1; j <= second.length; j++) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[first.length][second.length];
}

// checks one search token against one movie/person/genre token
function isCloseTokenMatch(queryToken: string, textToken: string) {
  if (queryToken === textToken) {
    return true;
  }

  // normal partial match
  // example: "mat" matches "matrix"
  if (queryToken.length >= 3 && textToken.includes(queryToken)) {
    return true;
  }

  // numbers should be stricter
  // "2" should not fuzzy-match "3"
  const queryHasNumber = /\d/.test(queryToken);
  const textHasNumber = /\d/.test(textToken);

  if (queryHasNumber || textHasNumber) {
    // pure short numbers must match exactly
    if (queryToken.length <= 2 || textToken.length <= 2) {
      return queryToken === textToken;
    }

    return getLevenshteinDistance(queryToken, textToken) <= 1;
  }

  const distance = getLevenshteinDistance(queryToken, textToken);

  // short words should be strict
  if (queryToken.length <= 2) {
    return distance === 0;
  }

  if (queryToken.length <= 4) {
    return distance <= 1;
  }

  if (queryToken.length <= 8) {
    return distance <= 2;
  }

  return distance <= 3;
}

// typo tolerant match
// supports words, numbers and weird title punctuation
function isFuzzyMatch(search: string, value: string) {
  const queryTokens = getSearchTokens(search);
  const textTokens = getSearchTokens(value);

  if (queryTokens.length === 0) {
    return true;
  }

  const compactQuery = queryTokens.join("");
  const compactText = textTokens.join("");

  // handles "walle" -> "wall e"
  // handles "spiderman" -> "spider man"
  if (compactQuery.length >= 3 && compactText.includes(compactQuery)) {
    return true;
  }

  // every searched word/number must match something in the movie text
  return queryTokens.every((queryToken) =>
    textTokens.some((textToken) => isCloseTokenMatch(queryToken, textToken)),
  );
}

// human sorting
// numeric: true makes "2 Fast" come before "10 Things"
// ignorePunctuation makes "Spider-Man" sort like "Spider Man"
const titleCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});

// get movies from DB
// q searches title, description, genre, director and cast
// genre/actor/director are DB filters
// q is checked in TypeScript so we can support fuzzy search
// sort is also polished in TypeScript so names with numbers behave better
async function getMovies(filters: MovieFilters): Promise<MovieCardData[]> {
  try {
    const whereFilters: MovieWhereInput[] = [];

    // exact filters stay in Prisma
    // these filters are not fuzzy, they are direct choices from UI
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

    if (filters.actorId.length > 0) {
      whereFilters.push({
        cast: {
          some: {
            personId: filters.actorId,
          },
        },
      });
    }

    if (filters.directorId.length > 0) {
      whereFilters.push({
        directors: {
          some: {
            personId: filters.directorId,
          },
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
      orderBy: getMovieOrderBy(filters.sort),
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        releaseDate: true,
        imageUrl: true,
        runtime: true,

        // Movie.genres is MovieGenre[]
        // first genre is shown on card
        // all genres can still be searched
        genres: {
          select: {
            genre: {
              select: {
                name: true,
              },
            },
          },
        },

        // used only for search text
        directors: {
          select: {
            person: {
              select: {
                name: true,
              },
            },
          },
        },

        // used only for search text
        cast: {
          select: {
            person: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const searchedMovies =
      filters.q.length > 0
        ? movies.filter((movie) => {
            const searchableText = [
              movie.title,
              movie.description ?? "",
              String(movie.releaseDate),
              String(movie.price),
              movie.runtime ? String(movie.runtime) : "",
              ...movie.genres.map((movieGenre) => movieGenre.genre.name),
              ...movie.directors.map(
                (movieDirector) => movieDirector.person.name,
              ),
              ...movie.cast.map((movieCast) => movieCast.person.name),
            ].join(" ");

            return isFuzzyMatch(filters.q, searchableText);
          })
        : movies;

    const sortedMovies = [...searchedMovies].sort((a, b) => {
      switch (filters.sort) {
        case "title-desc":
          return titleCollator.compare(b.title, a.title);

        case "price-asc":
          return Number(a.price) - Number(b.price);

        case "price-desc":
          return Number(b.price) - Number(a.price);

        case "year-desc":
          return Number(b.releaseDate) - Number(a.releaseDate);

        case "year-asc":
          return Number(a.releaseDate) - Number(b.releaseDate);

        case "runtime-asc":
          return (
            (a.runtime ?? Number.POSITIVE_INFINITY) -
            (b.runtime ?? Number.POSITIVE_INFINITY)
          );

        case "runtime-desc":
          return (
            (b.runtime ?? Number.NEGATIVE_INFINITY) -
            (a.runtime ?? Number.NEGATIVE_INFINITY)
          );

        case "title-asc":
        default:
          return titleCollator.compare(a.title, b.title);
      }
    });

    return sortedMovies.map((movie) => ({
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
// normal GET form, so the URL becomes /movies?q=matrix&actorId=123
function MovieFiltersForm({
  filters,
  genres,
  actors,
  directors,
}: {
  filters: MovieFilters;
  genres: GenreOption[];
  actors: PersonOption[];
  directors: PersonOption[];
}) {
  return (
    <form
      action="/movies"
      method="GET"
      className="sticky top-4 z-30 mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur"
    >
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[1fr_180px_180px_160px_180px_auto]">
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search title, director, cast, genre..."
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

        <PersonCombobox
          people={actors}
          selectedPersonId={filters.actorId}
          name="actorId"
          placeholder="Search actor..."
          ariaLabel="Actor"
        />

        <PersonCombobox
          people={directors}
          selectedPersonId={filters.directorId}
          name="directorId"
          placeholder="Search director..."
          ariaLabel="Director"
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

        <div className="relative">
          <select
            name="sort"
            defaultValue={filters.sort}
            aria-label="Sort movies"
            className="min-h-11 w-full appearance-none rounded-full border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition focus:border-red-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>

          {/* custom select arrow */}
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400">
            ▾
          </span>
        </div>

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
    actorId?: string;
    directorId?: string;
    sort?: string;
    fromYear?: string;
    toYear?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  // filters come from URL
  // example: /movies?q=nolan&genre=Action&sort=year-desc
  // Keep existing filter parsing from URL query params.
  const filters: MovieFilters = {
    q: params.q?.trim() ?? "",
    genre: params.genre?.trim() ?? "",
    actorId: params.actorId?.trim() ?? "",
    directorId: params.directorId?.trim() ?? "",
    sort: parseSort(params.sort),
  };

  const [movies, genres, actors, directors] = await Promise.all([
    getMovies(filters),
    getGenres(),
    getActors(),
    getDirectors(),
  ]);
  // Read the current page from URL (invalid/missing values become page 1).
  const requestedPage = parsePage(params.page);

  // Load paginated movies and dropdown genres in parallel for faster SSR.
  const [{ movies, totalCount, currentPage, totalPages }, genres] =
    await Promise.all([getMoviesPage(filters, requestedPage), getGenres()]);

  const isFiltering = hasActiveFilters(filters);

  // Human-friendly range text: "Showing 1-30 of 31".
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);

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

            <p
              id="movie-filters"
              className="mt-4 scroll-mt-24 text-sm leading-7 text-zinc-400 sm:text-base"
            >
              Search and filter the catalog by title, genre, people, or sort
              order.
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            ← Back to home
          </Link>
        </div>

        <MovieFiltersForm
          filters={filters}
          genres={genres}
          actors={actors}
          directors={directors}
        />

        {isFiltering && (
          <p className="mt-6 text-sm text-zinc-400">
            Showing {movies.length} result{movies.length === 1 ? "" : "s"} from
            your current search, filters and sort.
            Showing {from}-{to} of {totalCount} result
            {totalCount === 1 ? "" : "s"}
            {isFiltering ? " for your current search and filters." : "."}
          </p>
        )}

        <div className="mt-8">
          {/* Main content area: either empty state or current page of cards. */}
          {movies.length === 0 ? (
            isFiltering ? (
              <EmptyState
                title="No movies found."
                description="Try another title, genre, director, actor, or sort option."
              />
            ) : (
              <EmptyState
                title="No movies here yet."
                description="Our database is currently being updated. Please come back soon!"
              />
            )
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  posterSrc={getSafeImageSrc(movie.imageUrl)}
                />
              ))}
            </div>
          )}

          {/* Pagination appears only when there is more than one page. */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildMoviesHref(
                        filters,
                        Math.max(1, currentPage - 1),
                      )}
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {getPaginationTokens(currentPage, totalPages).map(
                    (token, index) =>
                      token === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={token}>
                          <PaginationLink
                            href={buildMoviesHref(filters, token)}
                            isActive={token === currentPage}
                          >
                            {token}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href={buildMoviesHref(
                        filters,
                        Math.min(totalPages, currentPage + 1),
                      )}
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>

      <a
        href="#movie-filters"
        className="fixed bottom-6 right-6 z-40 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-zinc-100 shadow-xl backdrop-blur transition hover:border-red-500 hover:text-red-300"
      >
        ↑ Filters
      </a>
    </main>
  );
}
