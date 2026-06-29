import { Movie } from "@/app/generated/prisma/browser";
import { prisma } from "@/lib/prisma";

// This is a seed file for the DB that will generate a list of movies in your local db upon executing.
// Run the file with "npx prisma db seed" in your terminal.

export const genres = [
  { name: "Horror" },
  { name: "Action" },
  { name: "Romantic" },
  { name: "Drama" },
  { name: "Adventure" },
  { name: "Comedy" },
  { name: "Thriller" },
  { name: "Sci-Fi" },
  { name: "Crime" },
  { name: "Fantasy" },
];

export const people = [
  // Actors
  { name: "Christian Bale" },
  { name: "Heath Ledger" },
  { name: "John Travolta" },
  { name: "Samuel L. Jackson" },
  { name: "Quentin Tarantino" }, //Pulp Fiction -> Also director
  { name: "Leonardo DiCaprio" },
  { name: "Joseph Gordon-Levitt" },
  { name: "Tom Hanks" },
  { name: "Robin Wright" },
  { name: "Keanu Reeves" },
  { name: "Laurence Fishburne" },

  // Directors
  { name: "Christopher Nolan" }, //Inception and The Dark Knight
  { name: "Robert Zemeckis" }, // Forrest Gump
  { name: "Lana Wachowski" }, //Matrix
  { name: "Lilly Wachowski" }, //Matrix
];

// -------------------------- Movies
// The Dark Knight (2008)
// Pulp Fiction (1994)
// Inception (2010)
// Forrest Gump (1994)
// The Matrix (1999)

const moviesArray = [
  {
    title: "The Dark Knight",
    description:
      "A rising wave of crime in Gotham forces Batman to confront the Joker, a chaotic mastermind who pushes the city - and Batman - to their moral limits.",
    price: 169,
    releaseDate: 2008,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/The_Dark_Knight_%282008_film%29.jpg/250px-The_Dark_Knight_%282008_film%29.jpg",
    runtime: 152,
    genreNames: ["Action", "Crime", "Drama"],
    castNames: ["Christian Bale", "Heath Ledger"],
    directorNames: ["Christopher Nolan"],
  },
  {
    title: "Pulp Fiction",
    description:
      "Interwoven stories follow hitmen, a boxer, and a crime boss’s wife as their lives collide in a darkly comic, violent, and stylish series of twists.",
    price: 79,
    releaseDate: 1994,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Pulp_Fiction_%281994%29_poster.jpg/250px-Pulp_Fiction_%281994%29_poster.jpg",
    runtime: 154,
    genreNames: ["Crime", "Drama"],
    castNames: ["John Travolta", "Samuel L. Jackson", "Quentin Tarantino"],
    directorNames: ["Quentin Tarantino"],
  },
  {
    title: "Inception",
    description:
      "A skilled thief who steals secrets through dream‑sharing technology is offered a chance at redemption if he can plant an idea deep inside a target’s subconscious.",
    price: 169,
    releaseDate: 2010,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg",
    runtime: 148,
    genreNames: ["Sci-Fi", "Action", "Thriller"],
    castNames: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
    directorNames: ["Christopher Nolan"],
  },
  {
    title: "Forrest Gump",
    description:
      "A kind‑hearted man with a simple outlook unwittingly influences major historical events while pursuing his lifelong love, Jenny.",
    price: 79,
    releaseDate: 1994,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg",
    runtime: 142,
    genreNames: ["Drama", "Romantic"],
    castNames: ["Tom Hanks", "Robin Wright"],
    directorNames: ["Robert Zemeckis"],
  },
  {
    title: "The Matrix",
    description:
      "A hacker discovers that reality is a simulated world controlled by machines, and joins a rebellion to free humanity from the illusion.",
    price: 79,
    releaseDate: 1999,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/The_Dark_Knight_%282008_film%29.jpg/250px-The_Dark_Knight_%282008_film%29.jpg",
    runtime: 136,
    genreNames: ["Sci-Fi", "Action"],
    castNames: ["Keanu Reeves", "Laurence Fishburne"],
    directorNames: ["Lana Wachowski", "Lilly Wachowski"],
  },
];

async function createData() {
  // Create genres data
  const createdGenres = await prisma.genre.createMany({ data: genres });

  // Create People
  const createdPeople = await prisma.person.createMany({ data: people });

  // Create Movies with connections to genre, cast and directors.
  const createdMovies = await Promise.all(
    moviesArray.map((movie) =>
      prisma.movie.create({
        data: {
          title: movie.title,
          description: movie.description,
          price: movie.price,
          releaseDate: movie.releaseDate,
          imageUrl: movie.imageUrl,
          runtime: movie.runtime,
          genres: {
            create: movie.genreNames.map((genreName) => ({
              genre: { connect: { name: genreName } },
            })),
          },
          cast: {
            create: movie.castNames.map((castName) => ({
              person: { connect: { name: castName } },
            })),
          },
          directors: {
            create: movie.directorNames.map((directorName) => ({
              person: { connect: { name: directorName } },
            })),
          },
        },
      }),
    ),
  );
}

createData()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
