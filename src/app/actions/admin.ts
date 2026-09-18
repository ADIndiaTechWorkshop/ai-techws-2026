"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { requireAdmin } from "@/app/admin/_session";

async function bustAppstoreCache(): Promise<void> {
  const keys = await redis.keys("appstore:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function parseRupeesToPaise(value: FormDataEntryValue | null): number | null {
  if (value == null || String(value).trim() === "") return null;
  const rupees = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveProduct(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const subcategoryRaw = String(formData.get("subcategoryId") ?? "").trim();
  const subcategoryId = subcategoryRaw || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "ACTIVE");
  const status =
    statusRaw === "HIDDEN" ? ProductStatus.HIDDEN : ProductStatus.ACTIVE;
  const description =
    String(formData.get("description") ?? "").trim() ||
    "A concise product description. Easy returns within 30 days.";
  const stockQty = Math.max(0, Number(formData.get("stockQty") ?? 0) || 0);
  const pricePaise = parseRupeesToPaise(formData.get("priceRupees"));
  const mrpPaise =
    parseRupeesToPaise(formData.get("mrpRupees")) ?? pricePaise ?? null;

  if (!name || !categoryId || pricePaise == null) {
    return { ok: false, error: "Name, category, and price are required." };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { ok: false, error: "Invalid category." };
  }

  if (subcategoryId) {
    const sub = await prisma.category.findUnique({
      where: { id: subcategoryId },
    });
    if (!sub || sub.parentId == null) {
      return { ok: false, error: "Subcategory must belong to a parent." };
    }
    if (sub.parentId !== categoryId) {
      return {
        ok: false,
        error: "Subcategory must belong to the selected category.",
      };
    }
  }

  if (id) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Product not found." };

    await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        subcategoryId,
        pricePaise,
        mrpPaise: mrpPaise ?? pricePaise,
        stockQty,
        imageUrl,
        status,
      },
    });
  } else {
    let slug = slugify(name) || "product";
    let suffix = 2;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${slugify(name) || "product"}-${suffix}`;
      suffix += 1;
    }

    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        subcategoryId,
        pricePaise,
        mrpPaise: mrpPaise ?? pricePaise,
        stockQty,
        imageUrl,
        status,
      },
    });
  }

  await bustAppstoreCache();
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!productId) return { ok: false, error: "Missing product id." };

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    return { ok: false, error: "Could not delete product." };
  }

  await bustAppstoreCache();
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function saveTopLevelCategory(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const count = await prisma.category.count({ where: { parentId: null } });
  if (count >= 10) {
    return { ok: false, error: "Maximum of 10 top-level categories reached." };
  }

  let slug = slugify(name);
  if (!slug) slug = "category";
  let suffix = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugify(name) || "category"}-${suffix}`;
    suffix += 1;
  }

  const maxSort = await prisma.category.aggregate({
    where: { parentId: null },
    _max: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      name,
      slug,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  await bustAppstoreCache();
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function saveSubcategory(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim();
  if (!name || !parentId) {
    return { ok: false, error: "Name and parent category are required." };
  }

  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent || parent.parentId != null) {
    return { ok: false, error: "Choose a top-level parent category." };
  }

  let slug = slugify(name);
  if (!slug) slug = "subcategory";
  let suffix = 2;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugify(name) || "subcategory"}-${suffix}`;
    suffix += 1;
  }

  await prisma.category.create({
    data: { name, slug, parentId },
  });

  await bustAppstoreCache();
  revalidatePath("/admin/categories/sub");
  return { ok: true };
}

const ORDER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: OrderStatus.PROCESSING,
  PROCESSING: OrderStatus.SHIPPED,
  SHIPPED: OrderStatus.DELIVERED,
};

export async function advanceOrder(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!orderId) return { ok: false, error: "Missing order id." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  const next = ORDER_NEXT[order.status];
  if (!next) {
    return { ok: false, error: "Order cannot be advanced further." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: next },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/track");
  return { ok: true };
}
