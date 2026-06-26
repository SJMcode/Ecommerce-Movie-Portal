import Link from "next/link";

// edit movie page
// this page exists so the edit route is a valid Next page
// real edit form can be connected here by the movie edit branch
export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = await params;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
          MovieShop
        </p>

        <h1 className="mt-4 text-3xl font-bold">Edit movie</h1>

        <p className="mt-4 text-zinc-400">
          This edit page exists, but the edit form is not connected here yet.
        </p>

        <p className="mt-4 rounded-xl bg-zinc-950 p-3 text-sm text-zinc-500">
          Movie id: {movieId}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/movies/${movieId}`}
            className="rounded-full bg-red-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Back to movie
          </Link>

          <Link
            href="/movies"
            className="rounded-full border border-zinc-700 px-5 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
          >
            Back to movies
          </Link>
        </div>
      </section>
    </main>
  );
}