"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CheckoutStockToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const stockError = searchParams.get("error") === "stock";

  useEffect(() => {
    if (!stockError) return;
    setOpen(true);
    const hide = window.setTimeout(() => setOpen(false), 4500);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const qs = params.toString();
    router.replace(qs ? `/checkout?${qs}` : "/checkout", { scroll: false });
    return () => window.clearTimeout(hide);
  }, [stockError, searchParams, router]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-md border border-line bg-canvas px-4 py-3 text-sm text-ink shadow-sm"
    >
      Not enough stock for one or more items in your cart.
    </div>
  );
}
