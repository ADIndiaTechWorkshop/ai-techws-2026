import Link from "next/link";

const NAV_ITEMS = [
  { label: "All", href: "/" },
  { label: "Mobiles", href: "/c/mobiles" },
  { label: "Laptops", href: "/c/laptops" },
  { label: "Audio", href: "/c/audio" },
  { label: "TVs", href: "/c/tvs" },
  { label: "Appliances", href: "/c/appliances" },
  { label: "Computers", href: "/c/computers" },
  { label: "Cameras", href: "/c/cameras" },
  { label: "Wearables", href: "/c/wearables" },
  { label: "Accessories", href: "/c/accessories" },
];

export function CategoryNav() {
  return (
    <nav
      className="border-b border-line bg-surface"
      aria-label="Categories"
    >
      <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-12 py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-navy"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
