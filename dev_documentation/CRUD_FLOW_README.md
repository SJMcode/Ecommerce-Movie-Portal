# Create Movie Flow

This document explains how the three create forms in the movie creation page work together with their server actions.

It now covers both create and delete behavior used in the movie form's lookup fields (genres, directors, cast).

## Overview

The movie creation experience is composed of:

1. Main form: CreateMovieForm
2. Dialog form: CreateGenreDialog
3. Dialog form: CreatePersonDialog (used for both Director and Cast)

These forms coordinate through callbacks and server actions so users can create missing related data (genres/people) without leaving the page, then submit a full movie payload.

The same form also supports inline delete for genres and people directly from combobox dropdown lists (trash icon), making this page responsible for the Create and Delete parts of CRUD for those entities.

## Architecture

### Client components

- Main parent form: `app/movies/create/_components/create-movie-form.tsx`
- Genre dialog child form: `app/movies/create/_components/create-genre-dialog-form.tsx`
- Person dialog child form: `app/movies/create/_components/create-person-dialog-form.tsx`

### Server actions

- Movie create action: `app/movies/create/_actions/create-movie-action.ts`
- Genre actions: `app/movies/create/_actions/genre-actions.ts` (`getGenres`, `createGenre`, `deleteGenreById`)
- People actions: `app/movies/create/_actions/people-actions.ts` (`getPeople`, `createPerson`, `deletePersonById`)

## End-to-End Flow

1. Parent form loads available genres and people via `getGenres()` and `getPeople()`.
2. Combobox fields store IDs (`genreId`, `personId`) as selected values.
3. UI labels are resolved from local lookup maps (`genreLabelMap`, `peopleLabelMap`) so chips display names.
4. If a needed genre/person does not exist, user creates it in a dialog.
5. Dialog submits to its server action and returns the new row ID.
6. Parent receives that ID through `onCreated`, refreshes source list, and auto-selects the new entry.
7. Final submit sends all scalar movie fields and selected arrays (`genres`, `directors`, `cast`) to `createMovie()`.
8. Server action validates, checks duplicates, then creates movie + junction table rows.

Delete branch in the same screen:

1. User clicks trash icon for a genre/person inside a combobox list item.
2. Click handler uses `stopPropagation()` so delete click does not also toggle selection.
3. User confirms deletion via `window.confirm`.
4. Client calls `deleteGenreById` or `deletePersonById`.
5. Parent refetches list (`getGenres`/`getPeople`) and updates local state.
6. Parent removes deleted IDs from selected arrays so stale chips are not left behind.

## Form 1: CreateMovieForm + createMovie action

### What the form does

- Manages all movie fields with TanStack Form and Zod validation.
- Maintains local state for combobox search inputs and fetched options.
- Uses selected IDs for:
  - `genres` (Genre IDs)
  - `directors` (Person IDs)
  - `cast` (Person IDs)
- Calls `createMovie(value)` on submit.
- On success, routes to the new movie details page.

### What the server action does

In `createMovie(values)`:

1. Parses and validates input via `createMovieSchema`.
2. Checks for duplicate movie with compound unique key (`title + releaseDate`).
3. Creates the `Movie` record.
4. Creates junction rows:
   - `MovieGenre` via `genres.createMany` using `genreId`
   - `MovieDirector` via `directors.createMany` using `personId`
   - `MovieCast` via `cast.createMany` using `personId`
5. Returns `{ ok: true, movie: { id } }` or `{ ok: false, error }`.

### Important relation behavior

- `Movie.id` is the movie primary key.
- `MovieDirector.movieId` and `MovieCast.movieId` reference `Movie.id`.
- `MovieDirector.personId` and `MovieCast.personId` reference `Person.id`.

The movie row is created first, then related rows are inserted in junction tables with the generated `movieId` and selected `personId`s.

## Form 2: CreateGenreDialog + createGenre action

### What the dialog does

- Collects a new genre name.
- Calls `createGenre(value)` on submit.
- On success:
  - closes dialog
  - calls parent callback `onCreated(newGenreId)`
  - shows success toast

### What the server action does

In `createGenre(values)`:

1. Validates `name`.
2. Performs case-insensitive duplicate check.
3. If duplicate found, returns `{ ok: false, error }`.
4. Otherwise creates genre row and returns `{ ok: true, genre: { id } }`.

### Parent callback behavior

In `CreateMovieForm`:

- Refreshes genres by calling `getGenres()` again.
- Adds newly created genre ID into selected `genres` field so the new entry is already chosen.

### Delete behavior

- `deleteGenreById(genreId)` removes a genre from the database.
- After delete, the parent form:
  - refreshes `genres` state from `getGenres()`
  - removes deleted `genreId` from the selected `genres` array
- The item-level delete button uses `type="button"` to avoid accidental form submit.

## Form 3: CreatePersonDialog + createPerson action

This same dialog is used in two places:

1. Director section
2. Cast section

### What the dialog does

- Collects person details (`name`, optional bio/image/imdbId inputs).
- Calls `createPerson(value)` on submit.
- Handles three result paths:

1. `ok === false`:
   - hard failure, shows error toast
2. `ok === "duplicate-name"`:
   - shows confirm prompt on client
   - if user agrees, sends second request with `forceCreate: true`
3. `ok === true`:
   - closes dialog
   - calls `onCreated(personId)`
   - shows success toast

### What the server action does

In `createPerson(values)`:

1. Validates and normalizes optional strings (empty string => undefined).
2. Hard-block path: if imdbId is provided and already exists, returns `{ ok: false, error }`.
3. Soft-block path: if same name exists and `forceCreate` is not set, returns `{ ok: "duplicate-name", error }`.
4. If allowed, creates person and returns `{ ok: true, person: { id } }`.

### How confirm round-trip works

The confirmation is not automatic framework behavior. It is explicitly implemented as:

1. First request returns `ok: "duplicate-name"`.
2. Client displays confirm dialog.
3. If confirmed, client sends a second request with `forceCreate: true`.
4. Server sees `forceCreate` and skips duplicate-name guard.

### Parent callback behavior

In `CreateMovieForm` (for both Director and Cast callbacks):

- Refreshes people list via `getPeople()`.
- Adds new person ID to the corresponding selected field.
- Because `people` is refreshed, `peopleLabelMap` can resolve name labels correctly in chips.

### Delete behavior

- `deletePersonById(personId)` removes a person from the database.
- After delete, the parent form:
  - refreshes `people` state from `getPeople()`
  - removes deleted `personId` from the current field selection
  - removes deleted `personId` from the other people-selection field as well (directors and cast stay in sync)
- This prevents stale selected IDs from appearing in chips after label map refresh.

## Shared Data and UI Patterns

### ID-based value model

Combobox values use IDs to keep submit payload relationally correct:

- Display text: name
- Submitted value: ID

This allows clean server inserts into junction tables while still showing friendly labels.

For delete actions, this same ID-first model allows precise removal from selected arrays by filtering out the deleted ID.

### Validation layering

- Client-side Zod schemas provide immediate UX feedback.
- Server-side Zod schemas enforce data integrity regardless of client behavior.

### Response contract pattern

All create actions follow discriminated result objects:

- success object with `ok: true`
- error object with `ok: false` and message
- specialized state where needed (e.g. `ok: "duplicate-name"`)

This keeps client-side branching explicit and predictable.

## Reset Button Behavior

The reset button uses controlled-form reset logic in the parent form.

Because fields are managed by TanStack Form and local state, native HTML reset alone is not sufficient. The handler performs:

1. Optional user confirmation.
2. `form.reset()` for form values.
3. Clears search input states used by combobox controls.

## Current Status

The core create workflow is wired and coherent:

- Genre creation and immediate selection works.
- Person creation with duplicate-name confirmation works.
- Person creation is reusable for both Director and Cast.
- Movie create persists scalar fields plus genre/director/cast junction links.
- Parent-child callback loop keeps UI state and DB state in sync.

The inline delete workflow is also wired:

- Genre delete is available from the genres dropdown list.
- Person delete is available from both directors and cast dropdown lists.
- Deletion confirms intent, updates DB, refetches list state, and clears selected IDs.

## Suggested Next Improvements

1. Add integration tests for the duplicate-name confirm two-call path.
2. Add integration tests for inline delete behavior (including cross-field person cleanup).
3. Add server-side auth/authorization checks in create and delete actions.
4. Optionally return richer includes from `createMovie` if the client needs immediate relational data.
5. Consolidate repeated mapping style (`personId: personId`) to shorthand (`personId`) for readability.
