import { Shell } from "@/components/chrome/Shell";

export default function HomePage() {
  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Featured products</h1>
        <p className="mt-2 text-muted">Home mosaic — coming in Task 2.</p>
        <div
          className="mt-8 grid min-h-[320px] place-items-center rounded-lg border border-dashed border-line bg-surface text-sm text-muted"
          aria-hidden
        >
          Product mosaic placeholder
        </div>
      </div>
    </Shell>
  );
}
