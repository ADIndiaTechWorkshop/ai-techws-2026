import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveProduct } from "@/app/actions/admin";
import { ProductForm } from "../_ProductForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, subcategory: true },
  });
  if (!product) notFound();

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
  const subcategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { name: "asc" },
  });

  async function updateProduct(formData: FormData) {
    "use server";
    formData.set("id", id);
    const result = await saveProduct(undefined, formData);
    if (!result.ok) {
      redirect(
        `/admin/products/${id}?error=${encodeURIComponent(result.error)}`,
      );
    }
    redirect("/admin/products");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-navy hover:underline">
          ← Products
        </Link>
      </div>
      <h2 className="text-xl font-semibold text-ink">Edit product</h2>
      <ProductForm
        action={updateProduct}
        categories={categories}
        subcategories={subcategories}
        product={product}
        error={error}
      />
    </div>
  );
}
