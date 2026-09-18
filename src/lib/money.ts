export function shippingPaise(subtotalPaise: number) {
  return subtotalPaise >= 50000 ? 0 : 4900;
}

export function discountPaise(subtotalPaise: number, code: string | null) {
  if (!code) return 0;
  return code.trim().toUpperCase() === "SAVE20"
    ? Math.floor(subtotalPaise * 0.2)
    : 0;
}

export function quoteCart(subtotalPaise: number, code: string | null) {
  const discount = discountPaise(subtotalPaise, code);
  const shipping = shippingPaise(subtotalPaise);
  return {
    discountPaise: discount,
    shippingPaise: shipping,
    totalPaise: subtotalPaise - discount + shipping,
  };
}

export function formatInr(paise: number) {
  const rupees = Math.round(paise / 100);
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}
