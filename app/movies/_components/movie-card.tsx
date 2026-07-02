import Link from "next/link";
import Image from "next/image";
import { MovieCardData } from "./movies-types";

type MovieCardProps = {
  movie: MovieCardData;
  posterSrc: string | null;
};

const allowedImageHosts = new Set([
  "image.tmdb.org",
  "upload.wikimedia.org",
  "m.media-amazon.com",
]);

// ----------------- INVALID URL GUARD FUNCTION
// This function is called inside the src attribute on Image when mapping out movies on the page (takes the movies.imageUrl as argument). 
// It simply makes sure no invalid url strings slip through (which causes the Image component to crash)
// This function could be avoided completely by not allowing invalid URL strings into the DB (in the create/edit movie form)
function getSafeImageSrc(rawUrl?: string | null) {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : "https://" + trimmed;
  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "https:") return null;
    if (!allowedImageHosts.has(parsed.hostname)) return null;

    return parsed.toString();
  } catch {
    return null;
  }
}

function MovieCard({ movie, posterSrc }: MovieCardProps) {
  return (
    <Link
      href={"/movies/" + movie.id}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-zinc-800/70"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-xl">
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={movie.title + " movie poster"}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950 text-center">
            <span className="px-3 text-sm font-semibold text-zinc-300">
              {movie.title}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="line-clamp-2 text-base font-semibold text-zinc-50 group-hover:text-red-300">
          {movie.title}
        </h2>

        <p className="text-xs text-zinc-500">{movie.genre ?? "Genre TBA"}</p>

        <div className="flex flex-col gap-1 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {movie.releaseDate}
            {movie.runtime ? " · " + movie.runtime + " min" : ""}
          </span>

          <span className="font-semibold text-red-400">
            {Number.isFinite(movie.price) ? movie.price + " kr" : "Price TBA"}
          </span>
        </div>

        <p className="pt-2 text-sm font-medium text-zinc-300 group-hover:text-white">
          View details →
        </p>
      </div>
    </Link>
  );
}

export { MovieCard, getSafeImageSrc };
