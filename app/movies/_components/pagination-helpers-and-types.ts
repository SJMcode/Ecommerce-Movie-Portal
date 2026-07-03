import { prisma } from "@/lib/prisma";
import { MovieCardData, MovieFilters, MovieWhereInput } from "./movies-types";

// Fixed page size so every query returns at most 30 movies.
const PAGE_SIZE = 30; // Set this number to the amount of movies you want shown per page

type PaginatedMoviesResult = {
  movies: MovieCardData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

type PaginationItemToken = number | "ellipsis";

function parsePage(value?: string) {
  // Parse URL page value and safely fall back to page 1.
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function buildMovieWhere(filters: MovieFilters): MovieWhereInput | undefined {
  // Build one shared Prisma where object used by both count + findMany
  // so pagination totals always match the visible results.
  const whereFilters: MovieWhereInput[] = [];

  if (filters.q.length > 0) {
    const textFilter = {
      contains: filters.q,
      mode: "insensitive" as const,
    };

    whereFilters.push({
      OR: [
        { title: textFilter },
        { description: textFilter },
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

  return whereFilters.length > 0 ? { AND: whereFilters } : undefined;
}

function buildMoviesHref(filters: MovieFilters, page: number) {
  // Keep current filters in the URL when user changes page.
  const query = new URLSearchParams();

  if (filters.q) query.set("q", filters.q);
  if (filters.genre) query.set("genre", filters.genre);
  if (filters.fromYear !== undefined)
    query.set("fromYear", String(filters.fromYear));
  if (filters.toYear !== undefined) query.set("toYear", String(filters.toYear));

  // Keep page param off page 1 for cleaner URLs
  if (page > 1) query.set("page", String(page));

  const qs = query.toString();
  return qs ? `/movies?${qs}` : "/movies";
}

function getPaginationTokens(
  currentPage: number,
  totalPages: number,
): PaginationItemToken[] {
  // Build compact page tokens: 1 ... current ... last.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const tokens: PaginationItemToken[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) tokens.push("ellipsis");
  for (let page = start; page <= end; page += 1) tokens.push(page);
  if (end < totalPages - 1) tokens.push("ellipsis");

  tokens.push(totalPages);
  return tokens;
}

async function getMoviesPage(
  filters: MovieFilters,
  requestedPage: number,
): Promise<PaginatedMoviesResult> {
  try {
    const where = buildMovieWhere(filters);

    // Count first so we can calculate valid page bounds.
    const totalCount = await prisma.movie.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);

    // Prisma pagination: skip previous rows, then take one page.
    const skip = (currentPage - 1) * PAGE_SIZE;
    const take = PAGE_SIZE;

    const movies = await prisma.movie.findMany({
      where,
      orderBy: {
        title: "asc",
      },
      skip,
      take,
      select: {
        id: true,
        title: true,
        price: true,
        releaseDate: true,
        imageUrl: true,
        runtime: true,
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

    return {
      // Normalize DB row shape into the card shape used by the UI.
      movies: movies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        price: Number(movie.price),
        releaseDate: movie.releaseDate,
        imageUrl: movie.imageUrl,
        runtime: movie.runtime,
        genre: movie.genres[0]?.genre.name ?? null,
      })),
      totalCount,
      currentPage,
      totalPages,
    };
  } catch (error) {
    console.error("Movies page DB error:", error);
    return {
      movies: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }
}

export {
  PAGE_SIZE,
  parsePage,
  buildMoviesHref,
  getPaginationTokens,
  getMoviesPage,
};

export type { PaginatedMoviesResult, PaginationItemToken };
