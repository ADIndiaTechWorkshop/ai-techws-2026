import { prisma } from "@/lib/db";
import { saveSubcategory } from "@/app/actions/admin";

export default async function AdminSubcategoriesPage() {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
  const subcategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
    orderBy: { name: "asc" },
  });

  async function addSubcategory(formData: FormData) {
    "use server";
    await saveSubcategory(undefined, formData);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">Subcategories</h2>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Slug</th>
            </tr>
          </thead>
          <tbody>
            {subcategories.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.parent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={addSubcategory}
        className="max-w-md space-y-4 rounded-lg border border-line bg-surface p-4"
      >
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Parent category</span>
          <select
            name="parentId"
            required
            className="w-full rounded-md border border-line px-3 py-2"
          >
            <option value="" disabled>
              Select parent
            </option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Subcategory name</span>
          <input
            name="name"
            required
            className="w-full rounded-md border border-line px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          Add subcategory
        </button>
      </form>
    </div>
  );
}
