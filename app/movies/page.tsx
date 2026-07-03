import Link from "next/link";
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
  getActors,
  getDirectors,
  getGenres,
  getMoviesPage,
  getPaginationTokens,
  PAGE_SIZE,
  parsePage,
  parseSort,
} from "./_components/pagination-helpers-and-types";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    actorId?: string;
    directorId?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const filters: MovieFilters = {
    q: params.q?.trim() ?? "",
    genre: params.genre?.trim() ?? "",
    actorId: params.actorId?.trim() ?? "",
    directorId: params.directorId?.trim() ?? "",
    sort: parseSort(params.sort),
  };

  const requestedPage = parsePage(params.page);

  const [
    { movies, totalCount, currentPage, totalPages },
    genres,
    actors,
    directors,
  ] = await Promise.all([
    getMoviesPage(filters, requestedPage),
    getGenres(),
    getActors(),
    getDirectors(),
  ]);

  const isFiltering = hasActiveFilters(filters);

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
              Smart search the catalog, sort results, or use advanced filters
              for actors, directors and genres.
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
            Showing {from}-{to} of {totalCount} result
            {totalCount === 1 ? "" : "s"} for your current search, filters and
            sort.
          </p>
        )}

        <div className="mt-8">
          {movies.length === 0 ? (
            isFiltering ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
                <p className="text-lg font-semibold text-zinc-300">
                  No movies found.
                </p>

                <p className="mt-2 text-sm">
                  Try another title, actor, director, genre, or sort option.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
                <p className="text-lg font-semibold text-zinc-300">
                  No movies here yet.
                </p>

                <p className="mt-2 text-sm">
                  Our database is currently being updated. Please come back
                  soon!
                </p>
              </div>
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