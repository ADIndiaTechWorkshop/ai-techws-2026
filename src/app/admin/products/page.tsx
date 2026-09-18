import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatInr } from "@/lib/money";

function statusLabel(status: ProductStatus): string {
  return status === ProductStatus.ACTIVE ? "Active" : "Hidden";
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Products</h2>

      <div className="overflow-hidden rounded-xl bg-surface">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-line text-xs font-semibold text-ink">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line/60">
                <td className="px-4 py-3 font-normal text-ink">{p.name}</td>
                <td className="px-4 py-3 font-normal text-gold">
                  {formatInr(p.pricePaise)}
                </td>
                <td className="px-4 py-3 font-normal text-ink">
                  {statusLabel(p.status)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-ink hover:text-navy hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/admin/products/new"
        className="inline-block rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy/90"
      >
        Add product
      </Link>
    </div>
  );
}
