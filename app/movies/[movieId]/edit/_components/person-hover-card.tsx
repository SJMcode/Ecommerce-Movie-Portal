import { HoverCardContent } from "@/components/ui/hover-card";
import type { PersonAllDetails } from "../_actions/people-actions";
import Image from "next/image";

type PersonHoverCardProps = {
  person: PersonAllDetails | undefined;
};

function PersonHoverCard({ person }: PersonHoverCardProps) {
  // Function to validate the URL and return a variable that either holds a validated working URL or a fallback image
  function isValidImageSrc(src: string | null | undefined) {
    if (!src) return false;
    if (src.startsWith("/")) return true; // local public file
    try {
      const url = new URL(src);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  const safeImageSrc = isValidImageSrc(person?.imageUrl)
    ? person!.imageUrl!
    : "/file.svg";

  return (
    <HoverCardContent
      className="flex w-auto justify-around gap-4"
      side={"left"}
    >
     
      <div className="flex flex-col gap-2">
        <div className="flex justify-around items-center">
             <Image
        src={safeImageSrc}
        alt={person?.name ? `${person.name} portrait` : "Person portrait"}
        width={64}
        height={64}
        className="rounded-md object-cover"
        sizes="64px"
      />
        <h1 className="font-semibold">{person?.name ?? "Unknown name"}</h1>

        </div>
        <div className="max-w-[14vw] max-h-28 overflow-y-auto whitespace-pre-wrap">
          <strong>Bio: </strong>
          {person?.biography ?? "No biography available"}
        </div>
        <div>IMDB-ID: {person?.imdbId}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Last updated: {person?.updatedAt.toLocaleDateString()}
        </div>
      </div>
      <div></div>
    </HoverCardContent>
  );
}

export { PersonHoverCard };
