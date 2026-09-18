import Link from "next/link";
import { Heart } from "lucide-react";
import { CatalogProduct, formatInrPaise } from "@/lib/catalog";

type ProductCardProps = {
  product: CatalogProduct;
  variant?: "featured" | "compact";
};

export function ProductCard({ product, variant = "compact" }: ProductCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/p/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-md ${
        isFeatured ? "h-[392px] w-[420px]" : "h-[288px] w-[200px]"
      }`}
    >
      <div
        className={`relative shrink-0 bg-line ${
          isFeatured ? "h-[280px]" : "h-[180px]"
        }`}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <span
          className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/90 text-navy opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        >
          <Heart className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <p
          className={`line-clamp-2 text-ink ${isFeatured ? "text-base font-medium" : "text-sm"}`}
        >
          {product.name}
        </p>
        <p className="mt-2 text-sm font-semibold text-gold">
          {formatInrPaise(product.pricePaise)}
        </p>
      </div>
    </Link>
  );
}
