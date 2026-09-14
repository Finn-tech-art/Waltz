"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createFileRecord, type FileFormState } from "../actions";

const initialState: FileFormState = {};

export function NewFileForm({
  clientId,
  staffOptions,
}: {
  clientId: string;
  staffOptions: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createFileRecord, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-6">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="matterType" className="text-sm font-medium">
            Matter type
          </label>
          <input
            id="matterType"
            name="matterType"
            placeholder="e.g. Conveyancing"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="responsibleLawyerId" className="text-sm font-medium">
            Responsible lawyer
          </label>
          <select
            id="responsibleLawyerId"
            name="responsibleLawyerId"
            defaultValue=""
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create file"}
      </Button>
    </form>
  );
}
