import { prisma } from "@/lib/prisma";
import {
  defaultSort,
  GenreOption,
  MovieCardData,
  MovieFilters,
  MovieSort,
  MovieWhereInput,
  PersonOption,
  sortOptions,
} from "./movies-types";

// Fixed page size so every query returns at most 30 movies.
const PAGE_SIZE = 30;

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

function parseSort(value?: string): MovieSort {
  const allowedSorts = sortOptions.map((option) => option.value);

  if (value && allowedSorts.includes(value as MovieSort)) {
    return value as MovieSort;
  }

  return defaultSort;
}

function getMovieOrderBy(sort: MovieSort) {
  // Gives Prisma a useful first order.
  // We still do final human sorting below for names with numbers/symbols.
  switch (sort) {
    case "title-desc":
      return {
        title: "desc" as const,
      };

    case "price-asc":
      return {
        price: "asc" as const,
      };

    case "price-desc":
      return {
        price: "desc" as const,
      };

    case "year-desc":
      return {
        releaseDate: "desc" as const,
      };

    case "year-asc":
      return {
        releaseDate: "asc" as const,
      };

    case "runtime-asc":
      return {
        runtime: "asc" as const,
      };

    case "runtime-desc":
      return {
        runtime: "desc" as const,
      };

    case "best-match":
    case "title-asc":
    default:
      return {
        title: "asc" as const,
      };
  }
}

function buildMovieWhere(filters: MovieFilters): MovieWhereInput | undefined {
  // Build exact Prisma filters.
  // Smart search is handled later in TypeScript so we can allow typos.
  const whereFilters: MovieWhereInput[] = [];

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

  return whereFilters.length > 0 ? { AND: whereFilters } : undefined;
}

function buildMoviesHref(filters: MovieFilters, page: number) {
  // Keep current filters in the URL when user changes page.
  const query = new URLSearchParams();

  if (filters.q) query.set("q", filters.q);
  if (filters.genre) query.set("genre", filters.genre);
  if (filters.actorId) query.set("actorId", filters.actorId);
  if (filters.directorId) query.set("directorId", filters.directorId);
  if (filters.sort !== defaultSort) query.set("sort", filters.sort);

  // Keep page param off page 1 for cleaner URLs.
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

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (end < totalPages - 1) tokens.push("ellipsis");

  tokens.push(totalPages);

  return tokens;
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

  const matrix: number[][] = Array.from({ length: first.length + 1 }, () =>
    Array<number>(second.length + 1).fill(0),
  );

  for (let i = 0; i <= first.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= second.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= first.length; i += 1) {
    for (let j = 1; j <= second.length; j += 1) {
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

function getTokenScore(queryToken: string, textToken: string) {
  if (queryToken === textToken) {
    return 10;
  }

  // normal partial match
  // example: "mat" matches "matrix"
  if (queryToken.length >= 3 && textToken.includes(queryToken)) {
    return 8;
  }

  const queryHasNumber = /\d/.test(queryToken);
  const textHasNumber = /\d/.test(textToken);

  // numbers should be stricter
  if (queryHasNumber || textHasNumber) {
    if (queryToken.length <= 2 || textToken.length <= 2) {
      return queryToken === textToken ? 10 : 0;
    }

    return getLevenshteinDistance(queryToken, textToken) <= 1 ? 6 : 0;
  }

  const distance = getLevenshteinDistance(queryToken, textToken);

  if (queryToken.length <= 2) {
    return distance === 0 ? 10 : 0;
  }

  if (queryToken.length <= 4) {
    return distance <= 1 ? 7 : 0;
  }

  if (queryToken.length <= 8) {
    return distance <= 2 ? 6 : 0;
  }

  return distance <= 3 ? 5 : 0;
}

function getFieldScore(queryToken: string, fieldText: string, weight: number) {
  const fieldTokens = getSearchTokens(fieldText);

  if (fieldTokens.length === 0) {
    return 0;
  }

  const compactFieldText = fieldTokens.join("");

  // handles "walle" -> "wall e"
  // handles "spiderman" -> "spider man"
  if (queryToken.length >= 3 && compactFieldText.includes(queryToken)) {
    return 8 * weight;
  }

  const bestTokenScore = Math.max(
    ...fieldTokens.map((fieldToken) => getTokenScore(queryToken, fieldToken)),
  );

  return bestTokenScore * weight;
}

type SearchableMovie = {
  title: string;
  description: string | null;
  price: unknown;
  releaseDate: unknown;
  runtime: number | null;
  genres: {
    genre: {
      name: string;
    };
  }[];
  directors: {
    person: {
      name: string;
    };
  }[];
  cast: {
    person: {
      name: string;
    };
  }[];
};

function getMovieSearchScore(movie: SearchableMovie, search: string) {
  const queryTokens = getSearchTokens(search);

  if (queryTokens.length === 0) {
    return 0;
  }

  let score = 0;

  for (const queryToken of queryTokens) {
    const tokenScore = Math.max(
      getFieldScore(queryToken, movie.title, 10),
      getFieldScore(queryToken, movie.description ?? "", 2),
      getFieldScore(queryToken, String(movie.releaseDate), 2),
      getFieldScore(queryToken, String(movie.price), 1),
      getFieldScore(queryToken, movie.runtime ? String(movie.runtime) : "", 1),
      getFieldScore(
        queryToken,
        movie.genres.map((movieGenre) => movieGenre.genre.name).join(" "),
        5,
      ),
      getFieldScore(
        queryToken,
        movie.directors.map((movieDirector) => movieDirector.person.name).join(" "),
        7,
      ),
      getFieldScore(
        queryToken,
        movie.cast.map((movieCast) => movieCast.person.name).join(" "),
        8,
      ),
    );

    // garbage words add nothing, but they do not kill the whole search
    score += tokenScore;
  }

  return score;
}

function passesSmartSearch(movie: SearchableMovie, search: string) {
  if (search.trim().length === 0) {
    return true;
  }

  const score = getMovieSearchScore(movie, search);

  // one strong match is enough
  // example: "matric ribs" can still show Matrix
  return score >= 45;
}

// human sorting
// numeric: true makes "2 Fast" come before "10 Things"
// ignorePunctuation makes "Spider-Man" sort like "Spider Man"
const titleCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});

function sortMovies<
  T extends {
    title: string;
    price: unknown;
    releaseDate: unknown;
    runtime: number | null;
  },
>(movies: T[], sort: MovieSort, search: string) {
  return [...movies].sort((a, b) => {
    if (sort === "best-match" && search.trim().length > 0) {
      const scoreA = getMovieSearchScore(a as T & SearchableMovie, search);
      const scoreB = getMovieSearchScore(b as T & SearchableMovie, search);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return titleCollator.compare(a.title, b.title);
    }

    switch (sort) {
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

      case "best-match":
      case "title-asc":
      default:
        return titleCollator.compare(a.title, b.title);
    }
  });
}

async function getGenres(): Promise<GenreOption[]> {
  try {
    return await prisma.genre.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });
  } catch (error) {
    console.error("Genres DB error:", error);
    return [];
  }
}

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

    const actorsById = new Map<string, PersonOption>();

    for (const row of castRows) {
      actorsById.set(row.person.id, row.person);
    }

    return Array.from(actorsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    console.error("Actors DB error:", error);
    return [];
  }
}

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

    const directorsById = new Map<string, PersonOption>();

    for (const row of directorRows) {
      directorsById.set(row.person.id, row.person);
    }

    return Array.from(directorsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    console.error("Directors DB error:", error);
    return [];
  }
}

async function getMoviesPage(
  filters: MovieFilters,
  requestedPage: number,
): Promise<PaginatedMoviesResult> {
  try {
    const where = buildMovieWhere(filters);

    // We fetch exact-filtered movies first, then smart-search in TypeScript.
    // This keeps pagination totals correct after typo-tolerant search.
    const allMovies = await prisma.movie.findMany({
      where,
      orderBy: getMovieOrderBy(filters.sort),
      select: {
        id: true,
        title: true,
        description: true,
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
        },
        directors: {
          select: {
            person: {
              select: {
                name: true,
              },
            },
          },
        },
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
        ? allMovies.filter((movie) => passesSmartSearch(movie, filters.q))
        : allMovies;

    const sortedMovies = sortMovies(searchedMovies, filters.sort, filters.q);

    const totalCount = sortedMovies.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * PAGE_SIZE;
    const pageMovies = sortedMovies.slice(skip, skip + PAGE_SIZE);

    return {
      movies: pageMovies.map((movie) => ({
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
  parseSort,
  buildMoviesHref,
  getPaginationTokens,
  getMoviesPage,
  getGenres,
  getActors,
  getDirectors,
};

export type { PaginatedMoviesResult, PaginationItemToken };