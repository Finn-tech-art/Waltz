"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadDocument, type DocumentFormState } from "../actions";

const initialState: DocumentFormState = {};

export function DocumentUploadForm({ fileId, branchId }: { fileId: string; branchId: string }) {
  const boundAction = uploadDocument.bind(null, fileId, branchId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <label htmlFor="file" className="text-sm font-medium">
          Upload document
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="block text-sm"
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
