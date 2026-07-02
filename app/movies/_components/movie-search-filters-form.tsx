import Link from "next/link";
import { MovieFilters } from "./movies-types";

type GenreOption = {
  id: string;
  name: string;
};

type MovieFiltersFormProps = {
  filters: MovieFilters;
  genres: GenreOption[];
};

// Helper: check if any filters are active
export function hasActiveFilters(filters: MovieFilters) {
  return Boolean(
    filters.q ||
    filters.genre ||
    filters.fromYear !== undefined ||
    filters.toYear !== undefined
  );
}

export function MovieFiltersForm({ filters, genres }: MovieFiltersFormProps) {
  return (
    <form
      action="/movies"
      method="GET"
      className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_130px_130px_auto]">
        {/* Search input */}
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search title, director, cast, genre..."
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

        {/* Genre dropdown */}
        <div className="relative">
          <select
            name="genre"
            defaultValue={filters.genre}
            aria-label="Genre"
            className="min-h-11 w-full appearance-none rounded-full border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition focus:border-red-500"
          >
            <option value="">All genres</option>

            {genres.map((genre) => (
              <option key={genre.id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400">
            ▾
          </span>
        </div>

        {/* Year range inputs */}
        <input
          type="text"
          inputMode="numeric"
          name="fromYear"
          defaultValue={filters.fromYear ?? ""}
          placeholder="From year"
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

        <input
          type="text"
          inputMode="numeric"
          name="toYear"
          defaultValue={filters.toYear ?? ""}
          placeholder="To year"
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

        {/* Submit button */}
        <button
          type="submit"
          className="min-h-11 rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Search
        </button>
      </div>

      {/* Clear filters link */}
      {hasActiveFilters(filters) && (
        <div className="mt-4">
          <Link
            href="/movies"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            Clear search and filters
          </Link>
        </div>
      )}
    </form>
  );
}
