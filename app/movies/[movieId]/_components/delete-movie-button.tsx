"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  action: () => Promise<void>;
};

function DeleteMovieButton({ action }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const shouldDelete = confirm("Are you sure you want to delete this movie?");

    if (!shouldDelete) {
      return;
    }

    setIsLoading(true);
    await action();
    setIsLoading(false);
    toast.success("Successfully deleted movie!");
    router.replace("/movies");
  }

  return (
    <Button variant="destructive" onClick={handleClick} disabled={isLoading} className="cursor-pointer" size={"sm"}>
      {isLoading ? <Spinner /> : <Trash />}
      Delete
    </Button>
  );
}

export { DeleteMovieButton }
