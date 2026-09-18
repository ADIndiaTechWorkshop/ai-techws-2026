import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveTopLevelCategory } from "@/app/actions/admin";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminCategoriesPage({
  searchParams,
}: Props) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
  const topLevelCount = categories.length;

  async function addCategory(formData: FormData) {
    "use server";
    const result = await saveTopLevelCategory(undefined, formData);
    if (!result.ok) {
      redirect(
        `/admin/categories?error=${encodeURIComponent(result.error)}`,
      );
    }
    redirect("/admin/categories");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">
        Categories · max 10 top-level
      </h2>
      <p className="text-sm text-muted">
        {topLevelCount} of 10 top-level categories in use.
      </p>
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Sort</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
                <td className="px-4 py-3">{c.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={addCategory}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end"
      >
        <label className="flex-1 space-y-1 text-sm">
          <span className="font-medium text-ink">New top-level category</span>
          <input
            name="name"
            required
            disabled={topLevelCount >= 10}
            className="w-full rounded-md border border-line px-3 py-2 disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={topLevelCount >= 10}
          className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
