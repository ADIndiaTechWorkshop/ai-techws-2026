import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export type PriceFilter = "u500" | "500-2000" | "2000-10000" | "a10000" | null;

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  pricePaise: number;
  mrpPaise: number;
  stockQty: number;
  imageUrl: string;
};

export type CatalogProductDetail = CatalogProduct & {
  description: string;
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  pricePaise: true,
  mrpPaise: true,
  stockQty: true,
  imageUrl: true,
} as const;

export function formatInrPaise(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}

export function priceWhere(f: PriceFilter) {
  if (f === "u500") return { pricePaise: { lt: 50000 } };
  if (f === "500-2000") return { pricePaise: { gte: 50000, lte: 200000 } };
  if (f === "2000-10000") return { pricePaise: { gte: 200000, lte: 1000000 } };
  if (f === "a10000") return { pricePaise: { gt: 1000000 } };
  return {};
}

export function parsePriceFilter(value: string | undefined): PriceFilter {
  if (
    value === "u500" ||
    value === "500-2000" ||
    value === "2000-10000" ||
    value === "a10000"
  ) {
    return value;
  }
  return null;
}

export async function getBrowse(
  slug: string,
  filter: PriceFilter,
): Promise<CatalogProduct[]> {
  const key = `appstore:browse:${slug}:${filter ?? "all"}`;
  const hit = await cacheGet<CatalogProduct[]>(key);
  if (hit) return hit;

  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", category: { slug }, ...priceWhere(filter) },
    select: productSelect,
    orderBy: { name: "asc" },
  });
  await cacheSet(key, rows);
  return rows;
}

export async function getSearch(q: string): Promise<CatalogProduct[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const key = `appstore:search:${trimmed.toLowerCase()}`;
  const hit = await cacheGet<CatalogProduct[]>(key);
  if (hit) return hit;

  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: trimmed } },
        { description: { contains: trimmed } },
      ],
    },
    select: productSelect,
    orderBy: { name: "asc" },
  });
  await cacheSet(key, rows);
  return rows;
}

export async function getProduct(
  slug: string,
): Promise<CatalogProductDetail | null> {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { ...productSelect, description: true },
  });
}

export async function getCategoryName(slug: string): Promise<string | null> {
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });
  return cat?.name ?? null;
}

export async function getHomeFeatured(): Promise<CatalogProduct[]> {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: productSelect,
    orderBy: { pricePaise: "desc" },
    take: 7,
  });
}
