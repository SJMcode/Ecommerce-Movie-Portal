"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { createMovie } from "../_actions/create-movie-action";
import { deleteGenreById, getGenres } from "../_actions/genre-actions";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useEffect, useMemo, useState } from "react";
import { CreateGenreDialog } from "./create-genre-dialog-form";
import {
  deletePersonById,
  getPeople,
  PersonAllDetails,
} from "../_actions/people-actions";
import { CreatePersonDialog } from "./create-person-dialog-form";
import { Edit, Trash } from "lucide-react";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { PersonHoverCard } from "./person-hover-card";
import { Textarea } from "@/components/ui/textarea";
import { EditGenreDialogForm } from "@/app/movies/[movieId]/edit/_components/edit-genre-dialog-form";
import { EditPersonDialogForm } from "@/app/movies/[movieId]/edit/_components/edit-person-dialog-form";

// ----------------------------------------- ZOD Validation form model/schema

const currentYear = new Date().getFullYear();
const firstMovieYear = 1888;

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(40, "Title cannot be longer than 40 characters"),
  description: z
    .string()
    .max(500, "Content cannot be longer than 250 characters"),
  price: z
    .string()
    .min(1, "Price is required")
    .transform(Number)
    .refine((v) => !isNaN(v), "Price must be a number")
    .refine((v) => v > 0, "Price must be greater than 0"),
  releaseDate: z
    .string()
    .transform(Number)
    .refine((v) => !isNaN(v), "Year must be a number")
    .refine(
      (v) => v > firstMovieYear,
      `No movie was released before ${firstMovieYear}`,
    )
    .refine(
      (v) => v < currentYear,
      `Release year cannot be greater than ${currentYear}`,
    ),
  imageUrl: z.string(),
  stock: z
    .string()
    .transform(Number)
    .refine((v) => v >= 0, "Stock cannot be less than zero"),
  runtime: z
    .string()
    .transform(Number)
    .refine(
      (v) => !isNaN(v) && v >= 0,
      "Runtime must be a number and cannot be a negative value",
    ),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  directors: z.array(z.string()).min(1, "Select at least one director"),
  cast: z.array(z.string()),
});

function CreateMovieForm() {
  const genresAnchor = useComboboxAnchor();
  const directorAnchor = useComboboxAnchor();
  const castAnchor = useComboboxAnchor();
  const router = useRouter();
  const handleReset = () => {
    const confirm = window.confirm("Are you sure you wish to reset the form?");
    if (!confirm) {
      return;
    }
    form.reset();
    setUserInputGenres("");
    setUserInputDirector("");
    setUserInputActor("");
  };

  // ---------------------------------------------------- STATE CONTROL/UPDATES

  // State control for genres search bar.
  // When new genre is added, search field is re-rendered with updates from db.
  const [userInputGenres, setUserInputGenres] = useState("");
  type GenreItem = {
    id: string;
    name: string;
  };

  const [genres, setGenres] = useState<GenreItem[]>([]);

  const genreLabelMap = useMemo(() => {
    const lookup: Record<string, string> = {};

    genres.forEach((genre) => {
      lookup[genre.id] = genre.name;
    });

    return lookup;
  }, [genres]);

  // useEffect-hook to fetch and set the genres list once, when the parent component (CreateMovieForm) mounts to the DOM
  useEffect(() => {
    async function loadGenres() {
      const genres = await getGenres();
      setGenres(genres);
    }

    loadGenres();
  }, []);

  // ------------------------------------------------------------

  // State control for PEOPLE search bar (director/cast search fields are populated from the Person db table)

  const [userInputDirector, setUserInputDirector] = useState("");
  const [userInputActor, setUserInputActor] = useState("");

  const [people, setPeople] = useState<PersonAllDetails[]>([]);

  // ------------ State control for "edit button" dialog windows
  // GENRE EDIT
  const [editingGenre, setIsEditingGenre] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isEditGenreOpen, setIsEditGenreOpen] = useState(false);

  // PERSON EDIT
  const [editingPerson, setEditingPerson] = useState<PersonAllDetails | null>(
    null,
  );
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);

  // useMemo-hook rebuilds the lookup map whenever the 'people' list is updated
  const peopleLabelMap = useMemo(() => {
    const lookup: Record<string, string> = {};

    people.forEach((person) => {
      lookup[person.id] = person.name;
    });
    return lookup;
  }, [people]); // Tells useMemo to run whenever the 'people' array state changes

  // useEffect-hook to fetch and set the people list once, when the parent component (CreateMovieForm) mounts to the DOM
  useEffect(() => {
    async function loadPeople() {
      const people = await getPeople();
      setPeople(people);
    }

    loadPeople();
  }, []);

  // useMemo to update person-hover-card details
  const peopleById = useMemo(() => {
    const lookup: Record<string, PersonAllDetails> = {};
    people.forEach((person) => {
      lookup[person.id] = person;
    });
    return lookup;
  }, [people]);

  // -------------------------------------------------------------

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      releaseDate: "",
      imageUrl: "",
      stock: "50", // default in prisma schema is set to 50
      runtime: "",
      genres: [] as string[],
      directors: [] as string[],
      cast: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const newMovie = await createMovie(value);

      if (newMovie.ok === false) {
        return toast.error(newMovie.error);
      }

      toast.success("Successfully added movie!");
      router.push(`/movies/${newMovie.movie.id}`);
    },
  });

  return (
    <form
      method="POST"
      onSubmit={(ev) => {
        ev.preventDefault();
        form.handleSubmit(ev);
      }}
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="min-h-36 resize-y"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="price">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Price</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="releaseDate">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Release year</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="imageUrl">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="stock">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>In stock</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="runtime">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Runtime in minutes</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="genres">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name} className="justify-between">
                  Genre
                  {/* AddGenreDialog contains the minimal form for creating genre! */}
                  <CreateGenreDialog
                    onCreated={async (createdGenreId) => {
                      const latestGenres = await getGenres();
                      setGenres(latestGenres);

                      field.handleChange(
                        Array.from(
                          new Set([...field.state.value, createdGenreId]),
                        ),
                      );
                    }}
                  />
                </FieldLabel>

                <Combobox
                  multiple
                  autoHighlight
                  items={genres.map((genre) => genre.id)}
                  value={field.state.value}
                  onValueChange={(values) => field.handleChange(values)}
                  inputValue={userInputGenres}
                  onInputValueChange={setUserInputGenres}
                  filter={(itemId, userSearch) =>
                    (genreLabelMap[itemId] ?? "")
                      .toLowerCase()
                      .includes(userSearch.toLowerCase())
                  }
                >
                  <ComboboxChips ref={genresAnchor}>
                    <ComboboxValue>
                      {(values) => (
                        <>
                          {values.map((id: string) => (
                            <ComboboxChip key={id}>
                              {genreLabelMap[id]}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            placeholder="Search genres..."
                            onBlur={field.handleBlur}
                            aria-invalid={isInvalid}
                          />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={genresAnchor}>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => {
                        const genre = genres.find((g) => g.id === item);
                        if (!genre) return null;
                        return (
                          <ComboboxItem key={item} value={item}>
                            <div className="w-full flex justify-between items-center">
                              {genreLabelMap[item] ?? item}
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size={"icon-lg"}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setIsEditingGenre(genre);
                                    setIsEditGenreOpen(true);
                                  }}
                                >
                                  <Edit />
                                </Button>

                                <Button
                                  variant="destructive"
                                  type="button"
                                  size={"icon-lg"}
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Prevents the click on the icon from selecting the item in the list
                                    const confirmDelete = window.confirm(
                                      `Are you sure you wish to delete ${genreLabelMap[item]}? This will also remove it from any connected movies.`,
                                    );
                                    if (confirmDelete) {
                                      const deletedGenre =
                                        await deleteGenreById(item);
                                      const updateList = await getGenres();
                                      setGenres(updateList);
                                      field.handleChange(
                                        Array.from(
                                          new Set(
                                            field.state.value.filter(
                                              (id) => id !== item,
                                            ),
                                          ),
                                        ),
                                      );
                                      toast.success(
                                        `${genreLabelMap[item]} was successfully deleted.`,
                                      );
                                      return deletedGenre;
                                    }
                                  }}
                                >
                                  <Trash />
                                </Button>
                              </div>
                            </div>
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {editingGenre && (
                  <EditGenreDialogForm
                    key={editingGenre.id}
                    genre={editingGenre}
                    open={isEditGenreOpen}
                    onOpenChange={(open) => {
                      setIsEditGenreOpen(open);
                      if (!open) setIsEditingGenre(null);
                    }}
                    onUpdated={async () => {
                      const latestGenres = await getGenres();
                      setGenres(latestGenres);
                    }}
                  />
                )}

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="directors">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field>
                <FieldLabel htmlFor={field.name} className="justify-between">
                  Director
                  <CreatePersonDialog
                    onCreated={async (createdPersonId) => {
                      const latestPeople = await getPeople();
                      setPeople(latestPeople);

                      field.handleChange(
                        Array.from(
                          new Set([...field.state.value, createdPersonId]),
                        ),
                      );
                    }}
                  />
                </FieldLabel>

                <Combobox
                  multiple
                  autoHighlight
                  items={people.map((person) => person.id)}
                  value={field.state.value}
                  onValueChange={(values) => field.handleChange(values)}
                  inputValue={userInputDirector}
                  onInputValueChange={setUserInputDirector}
                  filter={(itemId, userSearch) =>
                    (peopleLabelMap[itemId] ?? "")
                      .toLowerCase()
                      .includes(userSearch.toLowerCase())
                  }
                >
                  <ComboboxChips ref={directorAnchor}>
                    <ComboboxValue>
                      {(values) => (
                        <>
                          {values.map((id: string) => (
                            <ComboboxChip key={id}>
                              {peopleLabelMap[id] ?? id}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            placeholder="Search person..."
                            onBlur={field.handleBlur}
                            aria-invalid={isInvalid}
                          />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={directorAnchor}>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => {
                        const person = peopleById[item];
                        if (!person) return null;
                        return (
                          <ComboboxItem key={item} value={item}>
                            <div className="w-full flex justify-between items-center">
                              <HoverCard openDelay={10} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <span className="cursor-pointer">
                                    {peopleLabelMap[item] ?? item}
                                  </span>
                                </HoverCardTrigger>
                                <PersonHoverCard person={peopleById[item]} />
                              </HoverCard>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size={"icon-lg"}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingPerson(person);
                                    setIsEditPersonOpen(true);
                                  }}
                                >
                                  <Edit />
                                </Button>
                                <Button
                                  type="button"
                                  size={"icon-lg"}
                                  variant="destructive"
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Prevents the click on the icon from selecting the item in the list
                                    const confirmDelete = window.confirm(
                                      `Are you sure you wish to delete ${peopleLabelMap[item]}? This will also remove them from any connected movies.`,
                                    );
                                    if (confirmDelete) {
                                      const deletedPerson =
                                        await deletePersonById(item);
                                      const updateList = await getPeople();
                                      setPeople(updateList);
                                      field.handleChange(
                                        Array.from(
                                          new Set(
                                            field.state.value.filter(
                                              (id) => id !== item,
                                            ),
                                          ),
                                        ),
                                      );
                                      form.setFieldValue(
                                        "cast",
                                        form.state.values.cast.filter(
                                          (id) => id !== item,
                                        ),
                                      );
                                      toast.success(
                                        `${peopleLabelMap[item]} was successfully deleted.`,
                                      );
                                      return deletedPerson;
                                    }
                                  }}
                                >
                                  <Trash />
                                </Button>
                              </div>
                            </div>
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="cast">
          {(field) => {
            const isInvalid =
              (field.state.meta.isDirty || form.state.isSubmitted) &&
              !field.state.meta.isValid;

            return (
              <Field>
                <FieldLabel htmlFor={field.name} className="justify-between">
                  Cast
                  <CreatePersonDialog
                    onCreated={async (createdPersonId) => {
                      const latestPeople = await getPeople();
                      setPeople(latestPeople);

                      field.handleChange(
                        Array.from(
                          new Set([...field.state.value, createdPersonId]),
                        ),
                      );
                    }}
                  />
                </FieldLabel>

                <Combobox
                  multiple
                  autoHighlight
                  items={people.map((person) => person.id)}
                  value={field.state.value}
                  onValueChange={(values) => field.handleChange(values)}
                  inputValue={userInputActor}
                  onInputValueChange={setUserInputActor}
                  filter={(itemId, userSearch) =>
                    (peopleLabelMap[itemId] ?? "")
                      .toLowerCase()
                      .includes(userSearch.toLowerCase())
                  }
                >
                  <ComboboxChips ref={castAnchor}>
                    <ComboboxValue>
                      {(values) => (
                        <>
                          {values.map((id: string) => (
                            <ComboboxChip key={id}>
                              {peopleLabelMap[id] ?? id}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            placeholder="Search person..."
                            onBlur={field.handleBlur}
                            aria-invalid={isInvalid}
                          />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={castAnchor}>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => {
                        const person = peopleById[item];
                        if (!person) return null;
                        return (
                          <ComboboxItem key={item} value={item}>
                            <div className="w-full flex justify-between items-center">
                              <HoverCard openDelay={10} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <span className="cursor-pointer">
                                    {peopleLabelMap[item] ?? item}
                                  </span>
                                </HoverCardTrigger>
                                <PersonHoverCard person={peopleById[item]} />
                              </HoverCard>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size={"icon-lg"}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingPerson(person);
                                    setIsEditPersonOpen(true);
                                  }}
                                >
                                  <Edit />
                                </Button>

                                <Button
                                  type="button"
                                  size={"icon-lg"}
                                  variant="destructive"
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Prevents the click on the icon from selecting the item in the list
                                    const confirmDelete = window.confirm(
                                      `Are you sure you wish to delete ${peopleLabelMap[item]}? This will also remove them from any connected movies.`,
                                    );
                                    if (confirmDelete) {
                                      const deletedPerson =
                                        await deletePersonById(item);
                                      const updateList = await getPeople();
                                      setPeople(updateList);
                                      field.handleChange(
                                        Array.from(
                                          new Set(
                                            field.state.value.filter(
                                              (id) => id !== item,
                                            ),
                                          ),
                                        ),
                                      );
                                      form.setFieldValue(
                                        "directors",
                                        form.state.values.directors.filter(
                                          (id) => id !== item,
                                        ),
                                      );
                                      toast.success(
                                        `${peopleLabelMap[item]} was successfully deleted.`,
                                      );
                                      return deletedPerson;
                                    }
                                  }}
                                >
                                  <Trash />
                                </Button>
                              </div>
                            </div>
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {editingPerson && (
                  <EditPersonDialogForm
                    key={editingPerson.id}
                    person={editingPerson}
                    open={isEditPersonOpen}
                    onOpenChange={(open) => {
                      setIsEditPersonOpen(open);
                      if (!open) setEditingPerson(null);
                    }}
                    onUpdated={async () => {
                      const latestPeople = await getPeople();
                      setPeople(latestPeople);
                    }}
                  />
                )}

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <Field orientation="horizontal">
          <div className="flex justify-center gap-4 w-full sm:grid sm:grid-cols-3 sm:items-center">
            <div className="hidden sm:block" />
            <Button type="submit" className="sm:justify-self-center">
              Create Movie
            </Button>
            <Button
              type="reset"
              variant="destructive"
              className="sm:justify-self-end"
              onClick={handleReset}
            >
              Reset form
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}

export { CreateMovieForm };
