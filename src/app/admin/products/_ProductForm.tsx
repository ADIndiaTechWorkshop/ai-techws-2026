import type { Category, Product } from "@prisma/client";

type CategoryOption = Pick<Category, "id" | "name">;

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: CategoryOption[];
  subcategories: CategoryOption[];
  product?: Product;
  error?: string;
};

export function ProductForm({
  action,
  categories,
  subcategories,
  product,
  error,
}: ProductFormProps) {
  const priceRupees = product ? (product.pricePaise / 100).toString() : "";
  const mrpRupees = product ? (product.mrpPaise / 100).toString() : "";

  return (
    <form
      action={action}
      className="max-w-xl space-y-4 rounded-lg border border-line bg-surface p-6"
    >
      {error ? (
        <p className="rounded-md bg-canvas px-3 py-2 text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Name</span>
        <input
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className="w-full rounded-md border border-line px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Category</span>
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? ""}
          className="w-full rounded-md border border-line px-3 py-2"
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Subcategory</span>
        <select
          name="subcategoryId"
          defaultValue={product?.subcategoryId ?? ""}
          className="w-full rounded-md border border-line px-3 py-2"
        >
          <option value="">None</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Price (₹)</span>
          <input
            name="priceRupees"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={priceRupees}
            className="w-full rounded-md border border-line px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">MRP (₹)</span>
          <input
            name="mrpRupees"
            type="number"
            min="0"
            step="0.01"
            defaultValue={mrpRupees}
            className="w-full rounded-md border border-line px-3 py-2"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Stock qty</span>
        <input
          name="stockQty"
          type="number"
          min="0"
          defaultValue={product?.stockQty ?? 10}
          className="w-full rounded-md border border-line px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Image URL</span>
        <input
          name="imageUrl"
          type="text"
          defaultValue={product?.imageUrl ?? ""}
          className="w-full rounded-md border border-line px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-md border border-line px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-ink">Status</span>
        <select
          name="status"
          defaultValue={product?.status ?? "ACTIVE"}
          className="w-full rounded-md border border-line px-3 py-2"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
      >
        Save product
      </button>
    </form>
  );
}
