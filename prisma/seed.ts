import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding live Supabase database...");

  // 1. Clean existing records in join tables first (prevents key conflicts)
  await prisma.movieGenre.deleteMany();
  await prisma.movieDirector.deleteMany();
  await prisma.movieCast.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.person.deleteMany();
  await prisma.movie.deleteMany();

  // 2. Create default Genres
  const action = await prisma.genre.create({ data: { name: "Action" } });
  const sciFi = await prisma.genre.create({ data: { name: "Sci-Fi" } });
  const thriller = await prisma.genre.create({ data: { name: "Thriller" } });
  const adventure = await prisma.genre.create({ data: { name: "Adventure" } });

  // 3. Create default Directors / Cast Persons
  const nolan = await prisma.person.create({ data: { name: "Christopher Nolan", biography: "British-American filmmaker known for his complex narratives." } });
  const wachowski = await prisma.person.create({ data: { name: "Lana Wachowski", biography: "Co-director of the revolutionary Matrix trilogy." } });
  const dicaprio = await prisma.person.create({ data: { name: "Leonardo DiCaprio" } });
  const reeves = await prisma.person.create({ data: { name: "Keanu Reeves" } });

  // 4. Create Movies with standard relationships
  await prisma.movie.create({
    data: {
      title: "Inception",
      description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      price: 149.00,
      releaseDate: 2010,
      stock: 15,
      runtime: 148,
      imageUrl: "https://image.tmdb.org/t/p/w500/8IB2e4R45Td91S5S6f94t0C0a8N.jpg",
      genres: {
        create: [{ genreId: sciFi.id }, { genreId: action.id }, { genreId: thriller.id }],
      },
      directors: {
        create: [{ personId: nolan.id }],
      },
      cast: {
        create: [{ personId: dicaprio.id }],
      },
    },
  });

  await prisma.movie.create({
    data: {
      title: "The Matrix",
      description: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
      price: 99.00,
      releaseDate: 1999,
      stock: 8,
      runtime: 136,
      imageUrl: "https://image.tmdb.org/t/p/w500/gynBNzwyaHKtXqlEKKLioNkjKgN.jpg",
      genres: {
        create: [{ genreId: sciFi.id }, { genreId: action.id }],
      },
      directors: {
        create: [{ personId: wachowski.id }],
      },
      cast: {
        create: [{ personId: reeves.id }],
      },
    },
  });

  await prisma.movie.create({
    data: {
      title: "Interstellar",
      description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
      price: 129.00,
      releaseDate: 2014,
      stock: 12,
      runtime: 169,
      imageUrl: "https://image.tmdb.org/t/p/w500/gEU2QpI6EZiTiTYVfH06Ppyi9Ym.jpg",
      genres: {
        create: [{ genreId: sciFi.id }, { genreId: adventure.id }],
      },
      directors: {
        create: [{ personId: nolan.id }],
      },
    },
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
