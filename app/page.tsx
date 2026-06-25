import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// hero image
// w x h = width x height
// 1600x900 because cinema/hero image is wide
const heroImageUrl =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&h=900&q=80";

// not the whole Movie model
// only what we need to draw one movie card
type MoviePreview = {
  id?: string;
  title: string;
  year: number | string;
  price: number;
  imageUrl?: string | null;
  director?: string;
  genre?: string;
  runtime?: number | string;
};

// each row in landing page
type MovieSection = {
  title: string;
  description: string;
  movies: MoviePreview[];
};

// empty sections
// if DB is empty or not answering, page still exists
// but there is simply nothing to show yet
const emptyMovieSections: MovieSection[] = [
  {
    title: "Most Purchased Movies",
    description: "Popular picks from MovieShop customers.",
    movies: [],
  },
  {
    title: "Most Recent Movies",
    description: "Fresh titles recently added to the catalogue.",
    movies: [],
  },
  {
    title: "Oldest Movies",
    description: "Classics and older titles from the archive.",
    movies: [],
  },
  {
    title: "Cheapest Movies",
    description: "Affordable movies for building your collection.",
    movies: [],
  },
];

// add to cart action
// cart is saved in cookie as { movieId: quantity }
// example: { "movie-123": 2 }
async function addToCart(formData: FormData) {
  "use server";

  // take movie id from hidden input
  const movieId = formData.get("movieId");

  // no movie id = nothing to add
  if (typeof movieId !== "string" || movieId.length === 0) {
    return;
  }

  // get cart cookie
  const cookieStore = await cookies();
  const currentCartValue = cookieStore.get("cart")?.value;

  // cart starts empty
  let cart: Record<string, number> = {};

  // read old cart
  // if cookie is broken, empty cart instead of crash
  try {
    cart = currentCartValue ? JSON.parse(currentCartValue) : {};
  } catch {
    cart = {};
  }

  // if movie exists in cart, add 1
  // else create first quantity
  cart[movieId] = (cart[movieId] ?? 0) + 1;

  // save cart again
  cookieStore.set("cart", JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // refresh home after cart update
  revalidatePath("/");
}

// turns DB movie into landing page movie
// DB can have more fields, but card only needs these
function mapMovie(movie: {
  id: string;
  title: string;
  price: unknown;
  releaseDate: unknown;
  imageUrl: string | null;
  runtime?: number | null;
}): MoviePreview {
  return {
    id: movie.id,
    title: movie.title,

    // releaseDate seems to be number in our DB
    // string is allowed too, just in case
    year:
      typeof movie.releaseDate === "number" ||
      typeof movie.releaseDate === "string"
        ? movie.releaseDate
        : "Unknown",

    // Prisma price/decimal can be annoying
    // Number() makes it normal for the card
    price: Number(movie.price),

    // image from DB
    imageUrl: movie.imageUrl,

    // runtime from DB
    runtime: movie.runtime ?? undefined,

    // DB note:
    // DB has relation tables like MovieDirector, MovieGenre, MovieCast, Person, Genre.
    // this page does not read those joins yet.
    // so card shows TBA until this page actually reads those joins.
    director: "Director TBA",
    genre: "Genre TBA",
  };
}

// top 5 purchased movies
// comes from OrderItem quantity
async function getMostPurchasedMovies(): Promise<MoviePreview[]> {
  // group order items by movieId and count quantity
  const purchasedMovieGroups = await prisma.orderItem.groupBy({
    by: ["movieId"],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  // only valid movie ids
  const movieIds = purchasedMovieGroups
    .map((group) => group.movieId)
    .filter((movieId): movieId is string => Boolean(movieId));

  // no orders yet
  if (movieIds.length === 0) {
    return [];
  }

  // get movie data from those ids
  const movies = await prisma.movie.findMany({
    where: {
      id: {
        in: movieIds,
      },
    },
    select: {
      id: true,
      title: true,
      price: true,
      releaseDate: true,
      imageUrl: true,
      runtime: true,
    },
  });

  // keep same order as most purchased ranking
  return movieIds.flatMap((movieId) => {
    const movie = movies.find((movie) => movie.id === movieId);

    if (!movie) {
      return [];
    }

    return [mapMovie(movie)];
  });
}

// gets all landing page rows
// DB first, empty sections if nothing works
async function getLandingMovieSections(): Promise<MovieSection[]> {
  try {
    // all DB requests at the same time
    const [mostPurchasedMovies, mostRecentMovies, oldestMovies, cheapestMovies] =
      await Promise.all([
        getMostPurchasedMovies(),

        // newest movies
        prisma.movie.findMany({
          take: 5,
          orderBy: {
            releaseDate: "desc",
          },
          select: {
            id: true,
            title: true,
            price: true,
            releaseDate: true,
            imageUrl: true,
            runtime: true,
          },
        }),

        // oldest movies
        prisma.movie.findMany({
          take: 5,
          orderBy: {
            releaseDate: "asc",
          },
          select: {
            id: true,
            title: true,
            price: true,
            releaseDate: true,
            imageUrl: true,
            runtime: true,
          },
        }),

        // cheapest movies
        prisma.movie.findMany({
          take: 5,
          orderBy: {
            price: "asc",
          },
          select: {
            id: true,
            title: true,
            price: true,
            releaseDate: true,
            imageUrl: true,
            runtime: true,
          },
        }),
      ]);

    // 4 required landing sections
    return [
      {
        title: "Most Purchased Movies",
        description: "Popular picks from MovieShop customers.",
        movies: mostPurchasedMovies,
      },
      {
        title: "Most Recent Movies",
        description: "Fresh titles recently added to the catalogue.",
        movies: mostRecentMovies.map((movie) => mapMovie(movie)),
      },
      {
        title: "Oldest Movies",
        description: "Classics and older titles from the archive.",
        movies: oldestMovies.map((movie) => mapMovie(movie)),
      },
      {
        title: "Cheapest Movies",
        description: "Affordable movies for building your collection.",
        movies: cheapestMovies.map((movie) => mapMovie(movie)),
      },
    ];
  } catch {
    // DB not answering
    // nothing to show, but landing page should not die
    return emptyMovieSections;
  }
}

// small empty box
// used when there is nothing real to show or do
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-6 text-zinc-400 sm:p-8">
      <p className="font-medium text-zinc-300">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

// top nav
// simple landing navigation
function DefaultNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-base font-bold tracking-tight text-white sm:text-lg"
        >
          {/* popcorn icon */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xl ring-1 ring-red-400/40">
            🍿
          </span>

          <span className="leading-tight">
            LONELY RIDER <span className="text-red-400">TEAM</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-300 sm:justify-end">
          <Link href="/movies" className="transition hover:text-white">
            Movies
          </Link>

          <Link href="/cart" className="transition hover:text-white">
            Cart
          </Link>

          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>

          <Link href="/sign-in" className="transition hover:text-white">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}

// one horizontal movie section
// phone/tablet/laptop friendly with native horizontal scroll
function MovieCarouselSection({ section }: { section: MovieSection }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {section.title}
          </h2>

          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            {section.description}
          </p>
        </div>

        <Link
          href="/movies"
          className="text-sm font-semibold text-red-400 transition hover:text-red-300"
        >
          View all movies →
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {section.movies.length === 0 ? (
          // nothing from DB to show in this row
          <EmptyState
            title="No movies here yet."
            description="Movies added from the admin/database will appear here."
          />
        ) : (
          <div className="flex snap-x gap-4 sm:gap-5">
            {section.movies.map((movie) => {
              // real DB movies go to /movies/[id]
              const movieHref = movie.id ? `/movies/${movie.id}` : "/movies";

              // cart needs DB movie id
              const canAddToCart = Boolean(movie.id);

              return (
                <article
                  key={`${section.title}-${movie.title}`}
                  className="min-w-[78vw] snap-start rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition hover:-translate-y-1 hover:border-red-500/60 sm:min-w-65 sm:p-5 md:min-w-62 lg:min-w-67"
                >
                  <Link href={movieHref} className="block">
                    <div
                      className="mb-4 flex aspect-2/3 items-center justify-center rounded-xl bg-cover bg-center text-center"
                      // movie image
                      // if DB has imageUrl, show image
                      // if not, show dark card with title
                      style={{
                        backgroundImage: movie.imageUrl
                          ? `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.65)), url(${movie.imageUrl})`
                          : "linear-gradient(to bottom right, #27272a, #09090b)",
                      }}
                    >
                      {!movie.imageUrl && (
                        <span className="px-3 text-sm font-semibold text-zinc-300">
                          {movie.title}
                        </span>
                      )}
                    </div>

                    <h3 className="line-clamp-2 text-base font-semibold">
                      {movie.title}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      {movie.director ?? "Director TBA"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {movie.genre ?? "Genre TBA"}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {movie.year}
                        {movie.runtime ? ` · ${movie.runtime} min` : ""}
                      </span>

                      <span className="font-semibold text-red-400">
                        {movie.price} kr
                      </span>
                    </div>
                  </Link>

                  {canAddToCart ? (
                    // cart button
                    // hidden input sends movie id to server action
                    <form action={addToCart} className="mt-4">
                      <input type="hidden" name="movieId" value={movie.id} />

                      <button
                        type="submit"
                        className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                      >
                        Add to cart
                      </button>
                    </form>
                  ) : (
                    // nothing real to add
                    <div className="mt-4 rounded-full border border-zinc-800 px-4 py-2 text-center text-sm text-zinc-500">
                      No cart item yet.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// footer
// team/project identity
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 px-4 py-10 text-sm text-zinc-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row">
        <p>
          Developed by{" "}
          <span className="font-semibold text-zinc-200">
            Lonely Rider Team
          </span>
          .
        </p>

        <p>
          MovieShop project · Lexicon AB · Built with Next.js, Prisma, Tailwind
          CSS and ShadCN.
        </p>
      </div>
    </footer>
  );
}

// home page
// async because it reads from Prisma before rendering
export default async function Home() {
  const movieSections = await getLandingMovieSections();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <DefaultNav />

      <section
        className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-cover bg-center px-4 py-20 text-center sm:min-h-[75vh] sm:px-6 sm:py-24 lg:px-8"
        style={{
          backgroundImage: `url(${heroImageUrl})`,
        }}
      >
        {/* fade over hero image */}
        {/* lighter than before, so cinema picture is visible */}
        <div className="absolute inset-0 bg-linear-to-b from-black/35 via-black/25 to-zinc-950/75" />

        <div className="relative z-10 mx-auto max-w-5xl space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400 sm:text-sm sm:tracking-[0.35em]">
              MovieShop
            </p>

            <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl">
              Buy, collect, and discover movies in one place.
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-8 text-zinc-100 drop-shadow sm:text-lg">
              Browse selected movies, add them to your cart, complete checkout,
              and keep track of your order history.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/movies"
              className="rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Browse all movies
            </Link>

            <Link
              href="/sign-in"
              className="rounded-full border border-white/40 bg-black/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-14 sm:space-y-16">
          {movieSections.map((section) => (
            <MovieCarouselSection key={section.title} section={section} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}