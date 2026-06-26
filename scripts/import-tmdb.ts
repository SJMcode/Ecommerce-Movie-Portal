import "dotenv/config";
import { prisma } from "@/lib/prisma";

/*
  TMDB IMPORT SCRIPT

  This file is not part of the website runtime.
  It is a helper script we run manually when we want to fill our local DB.

  Flow:
  TMDB API -> this script -> Prisma DB -> /movies page reads our DB

  Run with:
  npx tsx scripts/import-tmdb.ts

  Required in .env:
  TMDB_BEARER_TOKEN="your-token-here"
*/

const tmdbToken = process.env.TMDB_BEARER_TOKEN;

const tmdbBaseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

// This is the small movie object we get from /movie/popular
type TmdbMovieListItem = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
};

// TMDB wraps the movie list inside a results array
type TmdbPopularResponse = {
  results: TmdbMovieListItem[];
};

// TMDB genre object
type TmdbGenre = {
  id: number;
  name: string;
};

// This is the bigger movie object we get from /movie/{id}
// We fetch this because popular list does not include all details we need
type TmdbMovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: TmdbGenre[];
};

// Fetch data from TMDB
// T means: "whatever type we expect back from this specific request"
async function fetchTmdb<T>(path: string): Promise<T> {
  if (!tmdbToken) {
    throw new Error("Missing TMDB_BEARER_TOKEN in .env");
  }

  const response = await fetch(`${tmdbBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: "application/json",
    },
  });

  // If TMDB says no, we stop and show a useful error
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// TMDB gives release_date like "2008-07-18"
// Our DB stores releaseDate as Int, only year
function getReleaseYear(releaseDate: string) {
  const year = Number(releaseDate.slice(0, 4));

  if (!Number.isFinite(year)) {
    return null;
  }

  return year;
}

// TMDB only gives poster_path, for example "/abc123.jpg"
// We turn it into a full usable image URL
function getPosterUrl(posterPath: string | null) {
  if (!posterPath) {
    return null;
  }

  return `${imageBaseUrl}${posterPath}`;
}

// TMDB gives movie data, but our shop also needs price
// So we create simple fake shop prices
function getPrice(index: number) {
  const prices = ["79.00", "89.00", "99.00", "119.00", "149.00", "169.00"];

  return prices[index % prices.length];
}

// TMDB gives movie data, but our shop also needs stock
// So we create simple fake stock numbers
function getStock(index: number) {
  return 20 + index * 2;
}

async function importTmdbMovies() {
  console.log("Fetching popular movies from TMDB...");

  // First request:
  // get a list of popular movies
  const popularMovies = await fetchTmdb<TmdbPopularResponse>(
    "/movie/popular?language=en-US&page=1",
  );

  // Keep import small for school project
  // We do not need hundreds of movies now
  const moviesToImport = popularMovies.results.slice(0, 20);

  for (const [index, movie] of moviesToImport.entries()) {
    // Second request:
    // fetch one movie again, but with full details
    const details = await fetchTmdb<TmdbMovieDetails>(
      `/movie/${movie.id}?language=en-US`,
    );

    const releaseYear = getReleaseYear(details.release_date);

    // Our DB requires releaseDate as Int
    // If TMDB has no valid year, skip this movie
    if (!releaseYear) {
      console.log(`Skipped ${details.title}: no valid release year`);
      continue;
    }

    /*
      upsert means:

      if movie exists:
        update it

      if movie does not exist:
        create it

      Our Movie model has:
      @@unique([title, releaseDate])

      So Prisma gives us:
      title_releaseDate
    */
    await prisma.movie.upsert({
      where: {
        title_releaseDate: {
          title: details.title,
          releaseDate: releaseYear,
        },
      },

      // If movie already exists, refresh its data
      update: {
        description: details.overview || null,
        price: getPrice(index),
        imageUrl: getPosterUrl(details.poster_path),
        stock: getStock(index),
        runtime: details.runtime,

        /*
          Movie.genres is MovieGenre[]

          This means:
          Movie -> MovieGenre -> Genre

          We delete old genre links for this movie,
          then create fresh links from TMDB.
          This does NOT delete the Genre table itself.
        */
        genres: {
          deleteMany: {},
          create: details.genres.map((genre) => ({
            genre: {
              connectOrCreate: {
                where: {
                  name: genre.name,
                },
                create: {
                  name: genre.name,
                },
              },
            },
          })),
        },
      },

      // If movie does not exist, create it
      create: {
        title: details.title,
        description: details.overview || null,
        price: getPrice(index),
        releaseDate: releaseYear,
        imageUrl: getPosterUrl(details.poster_path),
        stock: getStock(index),
        runtime: details.runtime,

        // Create MovieGenre rows and connect/create Genre rows
        genres: {
          create: details.genres.map((genre) => ({
            genre: {
              connectOrCreate: {
                where: {
                  name: genre.name,
                },
                create: {
                  name: genre.name,
                },
              },
            },
          })),
        },
      },
    });

    console.log(`Imported: ${details.title} (${releaseYear})`);
  }

  console.log("TMDB import finished.");
}

importTmdbMovies()
  .catch((error) => {
    console.error("TMDB import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });