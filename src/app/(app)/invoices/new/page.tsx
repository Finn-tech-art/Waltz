import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage() {
  await requireUser();
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("files")
    .select("id, file_number, clients(name)")
    .order("created_at", { ascending: false })
    .returns<{ id: string; file_number: string; clients: { name: string } | null }[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New invoice</h1>

      {(files ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          There are no files yet.{" "}
          <Link href="/files/new" className="underline">
            Create a file
          </Link>{" "}
          first.
        </p>
      ) : (
        <NewInvoiceForm files={files ?? []} />
      )}
    </div>
  );
}
