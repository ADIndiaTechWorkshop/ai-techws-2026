import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveProduct } from "@/app/actions/admin";
import { ProductForm } from "../_ProductForm";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewProductPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
  const subcategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { name: "asc" },
  });

  async function createProduct(formData: FormData) {
    "use server";
    const result = await saveProduct(undefined, formData);
    if (!result.ok) {
      redirect(`/admin/products/new?error=${encodeURIComponent(result.error)}`);
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
      <h2 className="text-2xl font-bold text-ink">Add product</h2>
      <ProductForm
        action={createProduct}
        categories={categories}
        subcategories={subcategories}
        error={error}
      />
    </div>
  );
}
