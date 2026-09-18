"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateFileRecord, type FileFormState } from "../actions";

const initialState: FileFormState = {};

export function EditFileForm({
  fileId,
  staffOptions,
  defaultValues,
}: {
  fileId: string;
  staffOptions: { id: string; name: string }[];
  defaultValues: {
    matterType: string;
    description: string;
    responsibleLawyerId: string;
    status: string;
  };
}) {
  const boundAction = updateFileRecord.bind(null, fileId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="matterType" className="text-sm font-medium">
            Matter type
          </label>
          <input
            id="matterType"
            name="matterType"
            defaultValue={defaultValues.matterType}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues.status}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="responsibleLawyerId" className="text-sm font-medium">
            Responsible lawyer
          </label>
          <select
            id="responsibleLawyerId"
            name="responsibleLawyerId"
            defaultValue={defaultValues.responsibleLawyerId}
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
          defaultValue={defaultValues.description}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
