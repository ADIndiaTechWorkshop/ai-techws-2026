import { Truck, RefreshCw, Shield, Headphones } from "lucide-react";

const COLUMNS = [
  {
    icon: Truck,
    title: "Free shipping",
    body: "On orders over the threshold. Fast delivery to your door.",
  },
  {
    icon: RefreshCw,
    title: "Easy returns",
    body: "Hassle-free returns within 30 days on eligible items.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    body: "Your payment information is protected at checkout.",
  },
  {
    icon: Headphones,
    title: "24/7 support",
    body: "We're here whenever you need help with your order.",
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-12 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <col.icon className="h-6 w-6 stroke-[1.5] text-gold" aria-hidden />
            <h2 className="text-base font-semibold">{col.title}</h2>
            <p className="text-sm leading-relaxed text-white/75">{col.body}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-12 py-6 text-center text-sm text-white/60">
        © {new Date().getFullYear()} AppStore. All rights reserved.
      </div>
    </footer>
  );
}
