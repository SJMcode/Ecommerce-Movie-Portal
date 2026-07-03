import Link from "next/link";
import { PersonCombobox } from "@/components/movies/person-combobox";
import {
  defaultSort,
  GenreOption,
  MovieFilters,
  PersonOption,
  sortOptions,
} from "./movies-types";

type MovieFiltersFormProps = {
  filters: MovieFilters;
  genres: GenreOption[];
  actors: PersonOption[];
  directors: PersonOption[];
};

// Helper: check if any filters are active
export function hasActiveFilters(filters: MovieFilters) {
  return Boolean(
    filters.q ||
      filters.genre ||
      filters.actorId ||
      filters.directorId ||
      filters.sort !== defaultSort,
  );
}

export function MovieFiltersForm({
  filters,
  genres,
  actors,
  directors,
}: MovieFiltersFormProps) {
  const advancedIsOpen = Boolean(
    filters.genre || filters.actorId || filters.directorId,
  );

  return (
    <form
      action="/movies"
      method="GET"
      className="sticky top-4 z-30 mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
        {/* Smart search */}
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Smart search: Matrix, Keanu, sci-fi..."
          className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
        />

        {/* Sort is always visible */}
        <div className="relative">
          <select
            name="sort"
            defaultValue={filters.sort}
            aria-label="Sort movies"
            className="min-h-11 w-full appearance-none rounded-full border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition focus:border-red-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400">
            ▾
          </span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="min-h-11 rounded-full bg-red-500 px-6 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Search
        </button>
      </div>

      <details open={advancedIsOpen} className="mt-4">
        <summary className="cursor-pointer select-none text-sm font-semibold text-red-400 transition hover:text-red-300">
          Advanced search
        </summary>

        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_220px_180px]">
          {/* Actor combobox */}
          <PersonCombobox
            people={actors}
            selectedPersonId={filters.actorId}
            name="actorId"
            placeholder="Search actor..."
            ariaLabel="Actor"
          />

          {/* Director combobox */}
          <PersonCombobox
            people={directors}
            selectedPersonId={filters.directorId}
            name="directorId"
            placeholder="Search director..."
            ariaLabel="Director"
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
        </div>
      </details>

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