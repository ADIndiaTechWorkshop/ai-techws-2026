import { addToCart, buyNow } from "@/app/actions/cart";

type ProductPurchaseFormsProps = {
  productId: string;
  inStock: boolean;
};

export function ProductPurchaseForms({
  productId,
  inStock,
}: ProductPurchaseFormsProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <form action={buyNow.bind(null, productId)}>
        <button
          type="submit"
          disabled={!inStock}
          className="rounded-md bg-navy px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy now
        </button>
      </form>
      <form action={addToCart.bind(null, productId, 1)}>
        <button
          type="submit"
          disabled={!inStock}
          className="rounded-md border border-navy bg-surface px-8 py-3 text-sm font-medium text-navy transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
      </form>
    </div>
  );
}
