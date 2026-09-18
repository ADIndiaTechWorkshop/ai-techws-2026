import { Shell } from "@/components/chrome/Shell";
import { PriceFilters } from "@/components/catalog/PriceFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  getSearch,
  parsePriceFilter,
  priceWhere,
  type CatalogProduct,
  type PriceFilter,
} from "@/lib/catalog";

type PageProps = {
  searchParams: Promise<{ q?: string; price?: string }>;
};

function applyPriceFilter(
  products: CatalogProduct[],
  filter: PriceFilter,
): CatalogProduct[] {
  if (!filter) return products;
  const where = priceWhere(filter);
  return products.filter((p) => {
    if ("lt" in (where.pricePaise ?? {})) {
      return p.pricePaise < (where.pricePaise as { lt: number }).lt;
    }
    if ("gt" in (where.pricePaise ?? {})) {
      return p.pricePaise > (where.pricePaise as { gt: number }).gt;
    }
    const range = where.pricePaise as { gte?: number; lte?: number };
    if (range.gte !== undefined && range.lte !== undefined) {
      return p.pricePaise >= range.gte && p.pricePaise <= range.lte;
    }
    return true;
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", price } = await searchParams;
  const filter = parsePriceFilter(price);
  const query = q.trim();

  const raw = query ? await getSearch(query) : [];
  const products = applyPriceFilter(raw, filter);

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <form action="/search" method="GET" className="mb-8 flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products"
            className="min-w-0 flex-1 rounded-md border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <button
            type="submit"
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
          >
            Search
          </button>
        </form>

        <div className="flex gap-10">
          <PriceFilters
            basePath="/search"
            active={filter}
            extraQuery={query ? { q: query } : undefined}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-ink">
              {query ? `Results for “${query}”` : "Search"} · {products.length}{" "}
              products
            </h1>
            {!query ? (
              <p className="mt-4 text-muted">Enter a search term above.</p>
            ) : products.length === 0 ? (
              <p className="mt-8 text-muted">No products found.</p>
            ) : (
              <div className="mt-8 flex flex-wrap gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
