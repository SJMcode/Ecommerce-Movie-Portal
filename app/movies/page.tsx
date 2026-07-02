import Link from "next/link";
import { prisma } from "@/lib/prisma";
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

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    fromYear?: string;
    toYear?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  // Keep existing filter parsing from URL query params.
  const filters: MovieFilters = {
    q: params.q?.trim() ?? "",
    genre: params.genre?.trim() ?? "",
    fromYear: parseYear(params.fromYear),
    toYear: parseYear(params.toYear),
  };

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
                description="Try another title, genre, director, actor, or year range."
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
    </main>
  );
}
