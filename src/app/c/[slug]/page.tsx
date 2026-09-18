import { notFound } from "next/navigation";
import { Shell } from "@/components/chrome/Shell";
import { PriceFilters } from "@/components/catalog/PriceFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  getBrowse,
  getCategoryName,
  parsePriceFilter,
} from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ price?: string }>;
};

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { price } = await searchParams;
  const filter = parsePriceFilter(price);

  const categoryName = await getCategoryName(slug);
  if (!categoryName) notFound();

  const products = await getBrowse(slug, filter);

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <div className="flex gap-10">
          <PriceFilters basePath={`/c/${slug}`} active={filter} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-ink">
              {categoryName} · {products.length} products
            </h1>
            {products.length === 0 ? (
              <p className="mt-8 text-muted">No products match this filter.</p>
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
