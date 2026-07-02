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

type MovieFilters = {
  q: string;
  genre: string;
  fromYear?: number;
  toYear?: number;
};

type MovieFindManyArgs = NonNullable<
  Parameters<typeof prisma.movie.findMany>[0]
>;

type MovieWhereInput = NonNullable<MovieFindManyArgs["where"]>;

export type { MovieCardData, MovieFilters, MovieFindManyArgs, MovieWhereInput };
