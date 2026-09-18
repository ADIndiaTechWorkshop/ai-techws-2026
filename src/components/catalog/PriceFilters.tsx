import Link from "next/link";
import type { PriceFilter } from "@/lib/catalog";

const FILTERS: { value: PriceFilter; label: string }[] = [
  { value: null, label: "All prices" },
  { value: "u500", label: "Under ₹500" },
  { value: "500-2000", label: "₹500 – ₹2,000" },
  { value: "2000-10000", label: "₹2,000 – ₹10,000" },
  { value: "a10000", label: "Above ₹10,000" },
];

type PriceFiltersProps = {
  basePath: string;
  active: PriceFilter;
  extraQuery?: Record<string, string>;
};

function buildHref(
  basePath: string,
  filter: PriceFilter,
  extraQuery?: Record<string, string>,
): string {
  const params = new URLSearchParams(extraQuery ?? {});
  if (filter) {
    params.set("price", filter);
  } else {
    params.delete("price");
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function PriceFilters({ basePath, active, extraQuery }: PriceFiltersProps) {
  return (
    <aside className="w-56 shrink-0">
      <h2 className="text-sm font-semibold text-ink">Filters</h2>
      <ul className="mt-4 space-y-1">
        {FILTERS.map((f) => {
          const isActive = f.value === active;
          return (
            <li key={f.label}>
              <Link
                href={buildHref(basePath, f.value, extraQuery)}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-navy font-medium text-white"
                    : "text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
