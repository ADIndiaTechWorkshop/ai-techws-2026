import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Truck,
  MapPin,
  Heart,
  ShoppingCart,
  User,
} from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-12 py-4">
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-ink">
            <ShoppingBag className="h-6 w-6 stroke-[1.5] text-navy" aria-hidden />
            <span className="text-xl font-semibold tracking-tight">AppStore</span>
          </Link>

          <form className="flex min-w-0 flex-1 items-stretch gap-0" action="/search">
            <input
              type="search"
              name="q"
              placeholder="Search products"
              className="min-w-0 flex-1 rounded-l-md border border-line border-r-0 bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-r-md bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            >
              <Search className="h-5 w-5" aria-hidden />
              Search
            </button>
          </form>

          <div className="hidden items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink md:flex">
            <Truck className="h-4 w-4 text-navy" aria-hidden />
            Free shipping over threshold
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center justify-end gap-4 text-sm font-medium text-ink sm:gap-6"
          aria-label="Account"
        >
          <Link href="/track" className="flex items-center gap-1.5 hover:text-navy">
            <MapPin className="h-5 w-5 text-navy" aria-hidden />
            Track
          </Link>
          <Link href="/wishlist" className="flex items-center gap-1.5 hover:text-navy">
            <Heart className="h-5 w-5 text-navy" aria-hidden />
            Wishlist
          </Link>
          <Link href="/cart" className="flex items-center gap-1.5 hover:text-navy">
            <ShoppingCart className="h-5 w-5 text-navy" aria-hidden />
            Cart
          </Link>
          <Link href="/signin" className="flex items-center gap-1.5 hover:text-navy">
            <User className="h-5 w-5 text-navy" aria-hidden />
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
