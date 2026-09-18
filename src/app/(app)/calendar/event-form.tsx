"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createStandaloneEvent, type EventFormState } from "./actions";

const initialState: EventFormState = {};

export function EventForm({
  branchId,
  staffOptions,
}: {
  branchId: string;
  staffOptions: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createStandaloneEvent, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="eventType" className="text-sm font-medium">
            Type
          </label>
          <select
            id="eventType"
            name="eventType"
            defaultValue="other"
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="court_date">Court date</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium">
            Date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {staffOptions.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Assign staff</legend>
          <div className="flex flex-wrap gap-4">
            {staffOptions.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="staffIds" value={s.id} />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Adding…" : "Add event"}
      </Button>
    </form>
  );
}
