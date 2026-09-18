import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import catalog from "../data/products.json";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "AppStore!demo";

const CATEGORIES: { name: string; slug: string; sortOrder: number }[] = [
  { name: "Mobiles", slug: "mobiles", sortOrder: 1 },
  { name: "Laptops", slug: "laptops", sortOrder: 2 },
  { name: "Audio", slug: "audio", sortOrder: 3 },
  { name: "TVs", slug: "tvs", sortOrder: 4 },
  { name: "Appliances", slug: "appliances", sortOrder: 5 },
  { name: "Computers", slug: "computers", sortOrder: 6 },
  { name: "Cameras", slug: "cameras", sortOrder: 7 },
  { name: "Wearables", slug: "wearables", sortOrder: 8 },
  { name: "Accessories", slug: "accessories", sortOrder: 9 },
];

type CromaProduct = {
  sku: string;
  name: string;
  brand?: string;
  priceInr: number;
  mrpInr?: number;
  imageUrl?: string;
  summary?: string;
  stockQty?: number;
};

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function categorySlugForProduct(name: string): string {
  const n = name.toLowerCase();
  if (
    /\b(iphone|galaxy|pixel|mobile|smartphone|phone)\b/.test(n) &&
    !/\b(laptop|tab|watch)\b/.test(n)
  ) {
    return "mobiles";
  }
  if (/\b(laptop|macbook|notebook|chromebook)\b/.test(n)) return "laptops";
  if (/\b(headphone|earbud|speaker|soundbar|audio|neckband)\b/.test(n))
    return "audio";
  if (/\b(tv|television|oled|qled)\b/.test(n)) return "tvs";
  if (
    /\b(refrigerator|washing|microwave|air conditioner|appliance|dishwasher|vacuum)\b/.test(
      n,
    )
  ) {
    return "appliances";
  }
  if (/\b(desktop|imac|computer|pc|monitor)\b/.test(n)) return "computers";
  if (/\b(camera|dslr|gopro|lens)\b/.test(n)) return "cameras";
  if (/\b(watch|wearable|fitness band|smartwatch)\b/.test(n))
    return "wearables";
  return "accessories";
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: "buyer@appstore.local" },
    update: { passwordHash, role: Role.BUYER },
    create: {
      email: "buyer@appstore.local",
      passwordHash,
      role: Role.BUYER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@appstore.local" },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: "admin@appstore.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const categoryBySlug = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryBySlug.set(cat.slug, row.id);
  }

  const products = (catalog as { products: CromaProduct[] }).products;
  const usedSlugs = new Set<string>();
  let outOfStockAssigned = false;

  for (const [index, item] of products.entries()) {
    const baseSlug = slugify(item.name);
    let slug = baseSlug || `product-${item.sku}`;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    const pricePaise = Math.round(item.priceInr * 100);
    const mrpPaise = Math.round((item.mrpInr ?? item.priceInr) * 100);
    const categorySlug = categorySlugForProduct(item.name);
    const categoryId = categoryBySlug.get(categorySlug)!;

    let stockQty = item.stockQty ?? 8 + (index % 40);
    if (!outOfStockAssigned && index === 0) {
      stockQty = 0;
      outOfStockAssigned = true;
    }

    const name = truncate(item.name, 191);
    const description =
      item.summary ??
      `${name}. A concise product description. Easy returns within 30 days.`;

    await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description,
        mrpPaise,
        pricePaise,
        imageUrl: item.imageUrl ?? "",
        categoryId,
        status: "ACTIVE",
      },
      create: {
        name,
        slug,
        description,
        mrpPaise,
        pricePaise,
        stockQty,
        imageUrl: item.imageUrl ?? "",
        categoryId,
        status: "ACTIVE",
      },
    });
  }

  const cartMock = await prisma.product.findFirst({
    where: { pricePaise: 1_299_000 },
  });
  if (!cartMock) {
    const accessoriesId = categoryBySlug.get("accessories")!;
    await prisma.product.upsert({
      where: { slug: "cart-mock-12990" },
      update: {
        name: "Wireless earbuds — cart mock",
        pricePaise: 1_299_000,
        mrpPaise: 1_499_000,
        categoryId: accessoriesId,
      },
      create: {
        name: "Wireless earbuds — cart mock",
        slug: "cart-mock-12990",
        description:
          "A concise product description. Easy returns within 30 days.",
        pricePaise: 1_299_000,
        mrpPaise: 1_499_000,
        stockQty: 25,
        imageUrl: "",
        categoryId: accessoriesId,
      },
    });
  }

  console.log(`Seeded ${products.length} products and ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
