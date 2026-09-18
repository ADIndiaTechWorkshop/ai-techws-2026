import Link from "next/link";
import { requireAdmin } from "./_session";
import { Shell } from "@/components/chrome/Shell";

const links = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/categories/sub", label: "Subcategories" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-sm font-medium text-muted">Admin</p>
            <h1 className="text-2xl font-semibold text-ink">Listings & fulfillment</h1>
          </div>
          <nav
            className="flex flex-wrap gap-2"
            aria-label="Admin sections"
          >
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-navy/30 hover:text-navy"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </Shell>
  );
}
