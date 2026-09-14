"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { addLineItem, type LineItemFormState } from "../actions";

const initialState: LineItemFormState = {};

export function LineItemForm({ invoiceId }: { invoiceId: string }) {
  const boundAction = addLineItem.bind(null, invoiceId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [feeBasis, setFeeBasis] = useState("fixed");

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="description"
            name="description"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="feeBasis" className="text-sm font-medium">
            Fee basis
          </label>
          <select
            id="feeBasis"
            name="feeBasis"
            value={feeBasis}
            onChange={(e) => setFeeBasis(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
            <option value="percentage_of_value">Percentage of value</option>
          </select>
        </div>

        {feeBasis === "hourly" ? (
          <>
            <div className="space-y-2">
              <label htmlFor="rate" className="text-sm font-medium">
                Rate (per hour)
              </label>
              <input
                id="rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="hours" className="text-sm font-medium">
                Hours
              </label>
              <input
                id="hours"
                name="hours"
                type="number"
                step="0.1"
                min="0"
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Adding…" : "Add line item"}
      </Button>
    </form>
  );
}
