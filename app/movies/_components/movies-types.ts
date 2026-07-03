import { prisma } from "@/lib/prisma";

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

type PersonOption = {
  id: string;
  name: string;
};

type MovieSort =
  | "best-match"
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

type MovieFindManyArgs = NonNullable<
  Parameters<typeof prisma.movie.findMany>[0]
>;

type MovieWhereInput = NonNullable<MovieFindManyArgs["where"]>;

const defaultSort: MovieSort = "best-match";

const sortOptions: {
  value: MovieSort;
  label: string;
}[] = [
  {
    value: "best-match",
    label: "Best match",
  },
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

export { defaultSort, sortOptions };

export type {
  MovieCardData,
  GenreOption,
  PersonOption,
  MovieSort,
  MovieFilters,
  MovieFindManyArgs,
  MovieWhereInput,
};