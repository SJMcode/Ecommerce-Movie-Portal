"use client";

import { useMemo, useState } from "react";

// reusable searchable person selector
// used for actor and director filters
// sends selected id through the normal GET form

type PersonOption = {
  id: string;
  name: string;
};

type PersonComboboxProps = {
  people: PersonOption[];
  selectedPersonId: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
};

export function PersonCombobox({
  people,
  selectedPersonId,
  name,
  placeholder,
  ariaLabel,
}: PersonComboboxProps) {
  const selectedPerson = people.find((person) => person.id === selectedPersonId);

  const [inputValue, setInputValue] = useState(selectedPerson?.name ?? "");
  const [selectedId, setSelectedId] = useState(selectedPersonId);
  const [isOpen, setIsOpen] = useState(false);

  const filteredPeople = useMemo(() => {
    const search = inputValue.trim().toLowerCase();

    if (!search) {
      return people.slice(0, 8);
    }

    return people
      .filter((person) => person.name.toLowerCase().includes(search))
      .slice(0, 8);
  }, [people, inputValue]);

  function selectPerson(person: PersonOption) {
    setSelectedId(person.id);
    setInputValue(person.name);
    setIsOpen(false);
  }

  function clearPerson() {
    setSelectedId("");
    setInputValue("");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} />

      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
          }, 150);
        }}
        onChange={(event) => {
          setInputValue(event.target.value);
          setSelectedId("");
          setIsOpen(true);
        }}
        className="min-h-11 w-full rounded-full border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-red-500"
      />

      {inputValue && (
        <button
          type="button"
          onClick={clearPerson}
          aria-label={`Clear ${ariaLabel.toLowerCase()} filter`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 transition hover:text-red-300"
        >
          ×
        </button>
      )}

      {isOpen && filteredPeople.length > 0 && (
        <div className="absolute left-0 right-0 top-[3.25rem] z-50 max-h-72 overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">
          {filteredPeople.map((person) => (
            <button
              key={person.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectPerson(person);
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-zinc-800 hover:text-red-300"
            >
              {person.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && inputValue && filteredPeople.length === 0 && (
        <div className="absolute left-0 right-0 top-[3.25rem] z-50 rounded-2xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-400 shadow-2xl">
          No match found.
        </div>
      )}
    </div>
  );
}