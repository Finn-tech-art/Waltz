"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ClientFormState } from "./actions";

type Props = {
  action: (prevState: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  branches?: { id: string; name: string }[];
  defaultValues?: {
    type: string;
    name: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
  };
  submitLabel: string;
};

const initialState: ClientFormState = {};

export function ClientForm({ action, branches, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={defaultValues?.type ?? "individual"}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="individual">Individual</option>
            <option value="organization">Organization</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contactEmail" className="text-sm font-medium">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaultValues?.contactEmail}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contactPhone" className="text-sm font-medium">
            Contact phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            defaultValue={defaultValues?.contactPhone}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {branches && (
          <div className="space-y-2">
            <label htmlFor="branchId" className="text-sm font-medium">
              Branch
            </label>
            <select
              id="branchId"
              name="branchId"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
