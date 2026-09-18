import type { Category, Product } from "@prisma/client";

type CategoryOption = Pick<Category, "id" | "name">;

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: CategoryOption[];
  subcategories: CategoryOption[];
  product?: Product;
  error?: string;
};

const fieldClass =
  "w-full rounded-lg border-0 bg-canvas px-3 py-2.5 text-sm text-ink";

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
    <form action={action} className="max-w-[640px] space-y-3">
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Name
        <input
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Category
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? ""}
          className={fieldClass}
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

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Subcategory
        <select
          name="subcategoryId"
          defaultValue={product?.subcategoryId ?? ""}
          className={fieldClass}
        >
          <option value="">None</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Price
        <input
          name="priceRupees"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={priceRupees}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Image URL
        <input
          name="imageUrl"
          type="text"
          defaultValue={product?.imageUrl ?? ""}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-medium text-muted">
          MRP
          <input
            name="mrpRupees"
            type="number"
            min="0"
            step="0.01"
            defaultValue={mrpRupees}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5 text-xs font-medium text-muted">
          Stock qty
          <input
            name="stockQty"
            type="number"
            min="0"
            defaultValue={product?.stockQty ?? 10}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5 text-xs font-medium text-muted">
        Status
        <select
          name="status"
          defaultValue={product?.status ?? "ACTIVE"}
          className={fieldClass}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy/90"
      >
        Save
      </button>
    </form>
  );
}
