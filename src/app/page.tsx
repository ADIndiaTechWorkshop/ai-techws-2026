import { Shell } from "@/components/chrome/Shell";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getHomeFeatured } from "@/lib/catalog";

export default async function HomePage() {
  const products = await getHomeFeatured();
  const [featured, ...rest] = products;

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Featured products</h1>
        {products.length === 0 ? (
          <p className="mt-8 text-muted">No products yet.</p>
        ) : (
          <div className="mt-8 flex flex-wrap gap-4 lg:flex-nowrap">
            {featured ? <ProductCard product={featured} variant="featured" /> : null}
            <div className="grid grid-cols-2 grid-rows-3 gap-4">
              {rest.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
