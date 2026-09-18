"use client";

import { useActionState } from "react";
import { updateProfileName, type ProfileFormState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileFormState = {};

export function ProfileNameForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateProfileName, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={name}
          className="w-full max-w-sm rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Name updated.</p>}

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}
