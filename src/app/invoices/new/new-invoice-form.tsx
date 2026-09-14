"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createInvoice, type InvoiceFormState } from "../actions";

const initialState: InvoiceFormState = {};

export function NewInvoiceForm({
  files,
}: {
  files: { id: string; file_number: string; clients: { name: string } | null }[];
}) {
  const [state, formAction, pending] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="fileId" className="text-sm font-medium">
          File
        </label>
        <select
          id="fileId"
          name="fileId"
          required
          defaultValue=""
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a file&hellip;
          </option>
          {files.map((f) => (
            <option key={f.id} value={f.id}>
              {f.file_number} &mdash; {f.clients?.name ?? "—"}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </form>
  );
}
