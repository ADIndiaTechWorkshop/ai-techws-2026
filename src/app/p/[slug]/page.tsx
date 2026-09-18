import { notFound } from "next/navigation";
import { Shell } from "@/components/chrome/Shell";
import { ProductPurchaseForms } from "@/components/catalog/ProductPurchaseForms";
import { formatInrPaise, getProduct } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const inStock = product.stockQty > 0;

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div
            className="h-[560px] w-full max-w-[560px] shrink-0 overflow-hidden rounded-lg border border-line bg-line"
          >
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-ink">{product.name}</h1>
            <p
              className={`mt-3 text-sm font-medium ${inStock ? "text-ink" : "text-muted"}`}
            >
              {inStock ? "In stock" : "Out of stock"}
            </p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold text-gold">
                {formatInrPaise(product.pricePaise)}
              </span>
              {product.mrpPaise > product.pricePaise ? (
                <span className="text-lg text-muted line-through">
                  {formatInrPaise(product.mrpPaise)}
                </span>
              ) : null}
            </div>

            <ProductPurchaseForms productId={product.id} inStock={inStock} />

            <section className="mt-12 border-t border-line pt-8">
              <h2 className="text-lg font-semibold text-ink">Description</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
