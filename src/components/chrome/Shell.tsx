import { Header } from "./Header";
import { CategoryNav } from "./CategoryNav";
import { Footer } from "./Footer";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-ink">
      <Header />
      <CategoryNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
