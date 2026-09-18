# AppStore Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **As soon as any task finishes, start review of that task** — do not wait for the whole plan. No TDD except the pricing / stock / SAVE20 tests in Task 3.

**Goal:** Pixel-copy the Figma AppStore UI onto a Next.js marketplace that runs with `docker compose up`.

**Architecture:** Next.js 15 App Router monolith (shopper + admin) + Prisma/MySQL + Redis cache/streams + Mailpit worker. Catalog seed from JSON only. Guest checkout. MockPay always succeeds.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, Prisma, MySQL 8, Redis 7, Mailpit, Vitest, lucide-react, Inter.

**Spec:** `docs/superpowers/specs/2026-09-18-appstore-marketplace-design.md`  
**Figma:** `npivpYycBDVOsJcfQXd3Pd` (implement from `get_design_context` per screen; do not invent colors).  
**FigJam:** `ObKdDkvM0Cz0WsiZmxnP36`.

## Global Constraints

- Copy Figma frames 01–19 + tokens + 10 icons; only the seven hex tokens.
- Money is integer paise; UI format `₹ 79,900`.
- SAVE20 = 20% of subtotal (`Math.floor`), case-insensitive, no stacking, does not grant free shipping.
- Free shipping at subtotal ≥ 50000 paise; else 4900 paise. Shipping uses **pre-discount** subtotal.
- Stock decrements only on successful Place order; reject entire order if any line exceeds stock.
- Guest checkout allowed; guest cart/wishlist cookies; merge on login.
- MockPay always succeeds; receipt via Redis Stream `orders.placed` → worker → Mailpit.
- Tests: **only** `tests/pricing.test.ts`, `tests/stock.test.ts`, `tests/save20.test.ts`.
- Done = `docker compose up` serves `:3000` and Mailpit `:8025`.
- Empty repo: create all files listed. No extra features.



## Parallelism

```
Task 1 (foundation) ──┬── Task 2 Catalog UI
                      ├── Task 3 Cart/checkout + money tests
                      ├── Task 4 Identity / track / account
                      └── Task 5 Admin
Task 3 ─────────────── Task 6 Notifications worker
```

Task 1 must land first. Tasks 2–5 may run in parallel after Task 1. Task 6 after Task 3 produces `XADD orders.placed`. Review each finished task immediately.

## File map


| Path                                                    | Responsibility                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `docker-compose.yml`                                    | mysql, redis, mailpit, app, worker                                |
| `Dockerfile`                                            | Node 20 image for app + worker                                    |
| `package.json`                                          | next, prisma, ioredis, nodemailer, vitest, lucide-react, bcryptjs |
| `prisma/schema.prisma`                                  | All models                                                        |
| `prisma/seed.ts`                                        | Users + categories + `data/products.json`                         |
| `data/products.json`                                    | Seed catalog                                                      |
| `src/app/globals.css`                                   | Token CSS variables + Tailwind                                    |
| `src/lib/money.ts`                                      | `shippingPaise`, `discountPaise`, `quoteCart`, `formatInr`        |
| `src/lib/stock.ts`                                      | `assertAndDecrement`                                              |
| `src/components/chrome/{Header,CategoryNav,Footer}.tsx` | Figma chrome                                                      |
| `src/app/**/page.tsx`                                   | Routes in spec                                                    |
| `worker/index.ts`                                       | Stream consumer + SMTP                                            |
| `tests/*.test.ts`                                       | Pricing, stock, SAVE20 only                                       |


---



### Task 1: Foundation — compose, Prisma, tokens, chrome

**Files:**

- Create: `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `.env.example`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `prisma/schema.prisma`, `prisma/seed.ts`, `data/products.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/lib/db.ts`, `src/lib/redis.ts`, `src/components/chrome/Header.tsx`, `src/components/chrome/CategoryNav.tsx`, `src/components/chrome/Footer.tsx`, `src/components/chrome/Shell.tsx`

**Interfaces:**

- Consumes: nothing
- Produces: Prisma client `prisma`; `redis`; CSS vars `--canvas` etc.; `<Shell>` wrapping pages; compose services `mysql`, `redis`, `mailpit`, `app` (worker stub can `sleep infinity` until Task 6)

- [ ] **Step 1: Scaffold package.json and Next config**

```json
{
  "name": "appstore",
  "private": true,
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0 --port 3000",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:seed": "prisma db seed"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

Install: `next@15`, `react@19`, `react-dom@19`, `typescript`, `@types/node`, `@types/react`, `prisma`, `@prisma/client`, `ioredis`, `bcryptjs`, `@types/bcryptjs`, `nodemailer`, `@types/nodemailer`, `lucide-react`, `tsx`, `vitest`, `@tailwindcss/postcss`, `tailwindcss@4`.

`postcss.config.mjs`:

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 2: Prisma schema**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql" url = env("DATABASE_URL") }

enum Role { BUYER ADMIN }
enum ProductStatus { ACTIVE HIDDEN }
enum OrderStatus { CONFIRMED PROCESSING SHIPPED DELIVERED }

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  role         Role      @default(BUYER)
  sessions     Session[]
  carts        Cart[]
  wishlist     WishlistItem[]
  addresses    Address[]
  orders       Order[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}

model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  parentId  String?
  parent    Category?  @relation("CatTree", fields: [parentId], references: [id])
  children  Category[] @relation("CatTree")
  sortOrder Int        @default(0)
  products  Product[]  @relation("ProductCategory")
  subProducts Product[] @relation("ProductSubcategory")
}

model Product {
  id            String        @id @default(cuid())
  name          String
  slug          String        @unique
  description   String        @db.Text
  mrpPaise      Int
  pricePaise    Int
  stockQty      Int
  imageUrl      String        @default("")
  categoryId    String
  subcategoryId String?
  status        ProductStatus @default(ACTIVE)
  category      Category      @relation("ProductCategory", fields: [categoryId], references: [id])
  subcategory   Category?     @relation("ProductSubcategory", fields: [subcategoryId], references: [id])
  cartItems     CartItem[]
  wishItems     WishlistItem[]
  orderItems    OrderItem[]
}

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  cartId    String
  productId String
  qty       Int
  cart      Cart    @relation(fields: [cartId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
  @@id([cartId, productId])
}

model WishlistItem {
  userId    String
  productId String
  user      User    @relation(fields: [userId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
  @@id([userId, productId])
}

model Address {
  id         String  @id @default(cuid())
  userId     String?
  user       User?   @relation(fields: [userId], references: [id])
  guestEmail String?
  name       String
  line1      String
  city       String
  postal     String
}

model Order {
  id             String      @id
  userId         String?
  user           User?       @relation(fields: [userId], references: [id])
  guestEmail     String?
  status         OrderStatus @default(CONFIRMED)
  subtotalPaise  Int
  discountPaise  Int
  shippingPaise  Int
  totalPaise     Int
  discountCode   String?
  paymentMethod  String
  items          OrderItem[]
  createdAt      DateTime    @default(now())
}

model OrderItem {
  id            String  @id @default(cuid())
  orderId       String
  order         Order   @relation(fields: [orderId], references: [id])
  productId     String
  product       Product @relation(fields: [productId], references: [id])
  nameSnapshot  String
  unitPaise     Int
  qty           Int
}
```

- [ ] **Step 3: Seed data**

`data/products.json` — all products across Mobiles, Laptops, Audio, TVs, Appliances (enough for home mosaic). Example item:

```json
{
  "name": "Flagship smartphone 256GB",
  "slug": "flagship-smartphone-256gb",
  "description": "A concise product description. Easy returns within 30 days.",
  "mrpPaise": 8990000,
  "pricePaise": 7990000,
  "stockQty": 12,
  "categorySlug": "mobiles",
  "subcategorySlug": null,
  "imageUrl": ""
}
```

Include one `stockQty: 0` product for out-of-stock PDP. Include an item priced `1299000` (₹12,990) for cart mock.

`prisma/seed.ts`: bcrypt hash `AppStore!demo`; create `buyer@appstore.local` BUYER and `admin@appstore.local` ADMIN; upsert 10 categories (All is nav-only, not a row — rows: mobiles, laptops, audio, tvs, appliances, computers, cameras, wearables, accessories, and one extra only if needed — **max 10**); insert products.

- [ ] **Step 4: docker-compose.yml**

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: appstore
      MYSQL_USER: appstore
      MYSQL_PASSWORD: appstore
      MYSQL_ROOT_PASSWORD: root
    ports: ["3306:3306"]
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 20
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  mailpit:
    image: axllent/mailpit
    ports: ["8025:8025", "1025:1025"]
  app:
    build: .
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run dev"
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: mysql://appstore:appstore@mysql:3306/appstore
      REDIS_URL: redis://redis:6379
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
      SESSION_SECRET: dev-session-secret-change-me
    volumes: [".:/app", "/app/node_modules"]
    depends_on:
      mysql: { condition: service_healthy }
      redis: { condition: service_started }
      mailpit: { condition: service_started }
  worker:
    build: .
    command: npx tsx worker/index.ts
    environment:
      DATABASE_URL: mysql://appstore:appstore@mysql:3306/appstore
      REDIS_URL: redis://redis:6379
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
    depends_on:
      mysql: { condition: service_healthy }
      redis: { condition: service_started }
      mailpit: { condition: service_started }
```

Until Task 6, `worker/index.ts` is:

```ts
console.log("worker stub — Task 6 replaces this");
setInterval(() => {}, 1 << 30);
```

Dockerfile: `FROM node:20-alpine`, WORKDIR /app, copy, `npm install`, expose 3000.

- [ ] **Step 5: Tokens + chrome**

`src/app/globals.css`:

```css
@import "tailwindcss";
@theme {
  --color-canvas: #F6F4F0;
  --color-surface: #FFFFFF;
  --color-ink: #12141A;
  --color-muted: #5C6470;
  --color-line: #E6E2DA;
  --color-navy: #0F2744;
  --color-gold: #C4A35A;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
html, body { background: #F6F4F0; color: #12141A; }
```

Layout: Inter from `next/font/google`. Header: 1440 inner, logo bag mark + **AppStore**, search field + navy **Search** button, truck chip **Free shipping over threshold**, Pin **Track**, Heart **Wishlist**, Cart, User **Sign in**. CategoryNav links. Footer navy `#0F2744` four columns with icons. Home `/` can render Shell + empty mosaic placeholder.

Call `get_design_context` for nodes `1:33`, `1:44`, `1:56` if pixel doubt.

- [ ] **Step 6: Verify compose boots**

Run: `docker compose up --build`  
Expected: app logs migrate + seed; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` is `200`; Mailpit `http://localhost:8025` loads.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml Dockerfile package.json prisma data src
git commit -m "feat: scaffold AppStore compose, schema, tokens, and chrome"
```

---



### Task 2: Catalog — home, listing, search, PDP

**Files:**

- Create: `src/lib/catalog.ts`, `src/app/page.tsx` (replace placeholder), `src/app/c/[slug]/page.tsx`, `src/app/search/page.tsx`, `src/app/p/[slug]/page.tsx`, `src/components/catalog/ProductCard.tsx`, `src/components/catalog/PriceFilters.tsx`
- Modify: `src/lib/redis.ts` (cache helpers)

**Interfaces:**

- Consumes: `prisma`, `redis`, Figma home `1:70`, listing `2:29`, product `2:2`
- Produces: `getBrowse(slug, filter)`, `getSearch(q)`, `getProduct(slug)` returning `{ id, name, slug, pricePaise, mrpPaise, stockQty, imageUrl }[]`

- [ ] **Step 1: Cache + catalog queries**

```ts
export type PriceFilter = "u500" | "500-2000" | "2000-10000" | "a10000" | null;

export function priceWhere(f: PriceFilter) {
  if (f === "u500") return { pricePaise: { lt: 50000 } };
  if (f === "500-2000") return { pricePaise: { gte: 50000, lte: 200000 } };
  if (f === "2000-10000") return { pricePaise: { gte: 200000, lte: 1000000 } };
  if (f === "a10000") return { pricePaise: { gt: 1000000 } };
  return {};
}

export async function getBrowse(slug: string, filter: PriceFilter) {
  const key = `appstore:browse:${slug}:${filter ?? "all"}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", category: { slug }, ...priceWhere(filter) },
  });
  await redis.set(key, JSON.stringify(rows), "EX", 60);
  return rows;
}
```

Search: `name/description contains` insensitive; cache `appstore:search:{q}`. Invalidate prefix on admin writes in Task 5 (`SCAN appstore:*` or delete known keys).

- [ ] **Step 2: ProductCard + Home mosaic**

Figma home: one large card (420×392) + 2×3 grid of 200×288 cards. Image area `#E6E2DA` if no `imageUrl`. Price in **gold**. Heart overlay. Click → `/p/[slug]`. Header search submits GET `/search?q=`.

- [ ] **Step 3: Listing + PDP**

Listing: left **Filters** with the four INR bands; heading `{Category} · {n} products`. PDP: 560 photo, title, **In stock** / **Out of stock**, gold price, muted MRP, navy **Buy now**, outline **Add to cart** (wire to `/cart` actions in Task 3 — for now `form` POST that no-ops or links `/cart`). Description block as Figma.

- [ ] **Step 4: Verify**

Run: `docker compose up` → open `/`, `/c/mobiles`, `/search?q=phone`, `/p/flagship-smartphone-256gb`.  
Expected: mosaic + listing filters + PDP stock/price match Figma structure.

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalog.ts src/app src/components/catalog
git commit -m "feat: shopper catalog home, listing, search, and PDP"
```

---



### Task 3: Cart, wishlist, checkout, money tests, MockPay, stream produce

**Files:**

- Create: `src/lib/money.ts`, `src/lib/stock.ts`, `src/lib/mock-pay.ts`, `src/lib/cart-cookie.ts`, `src/app/cart/page.tsx`, `src/app/wishlist/page.tsx`, `src/app/checkout/page.tsx`, `src/app/actions/cart.ts`, `src/app/actions/checkout.ts`, `tests/pricing.test.ts`, `tests/stock.test.ts`, `tests/save20.test.ts`, `vitest.config.ts`
- Modify: PDP add-to-cart / buy-now to real actions

**Interfaces:**

- Consumes: Product ids from catalog; `prisma`; `redis`
- Produces:
  - `shippingPaise(subtotalPaise: number): number`
  - `discountPaise(subtotalPaise: number, code: string | null): number`
  - `quoteCart(subtotalPaise: number, code: string | null): { shippingPaise, discountPaise, totalPaise }`
  - `assertAndDecrement(tx, lines: { productId: string, qty: number }[]): Promise<void>`
  - `mockPay.authorize(input: { amountPaise: number, method: string }): Promise<{ ok: true }>`
  - `placeOrder` writes Order `CONFIRMED` and `XADD orders.placed`

- [ ] **Step 1: Write the three failing tests (only tests in this plan)**

`src/lib/money.ts` and `src/lib/stock.ts` may be empty exports first.

`tests/pricing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { shippingPaise, quoteCart } from "../src/lib/money";

describe("shipping", () => {
  it("charges 4900 below ₹500", () => {
    expect(shippingPaise(49900)).toBe(4900);
  });
  it("is free at ₹500", () => {
    expect(shippingPaise(50000)).toBe(0);
  });
  it("is free above ₹500", () => {
    expect(shippingPaise(1299000)).toBe(0);
  });
});

describe("quoteCart", () => {
  it("adds shipping to subtotal when below threshold", () => {
    expect(quoteCart(12990, null)).toEqual({
      discountPaise: 0,
      shippingPaise: 4900,
      totalPaise: 17890,
    });
  });
});
```

`tests/save20.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { discountPaise, quoteCart, shippingPaise } from "../src/lib/money";

describe("SAVE20", () => {
  it("takes 20% floor of subtotal", () => {
    expect(discountPaise(12990, "SAVE20")).toBe(2598);
  });
  it("is case-insensitive and trims", () => {
    expect(discountPaise(10000, " save20 ")).toBe(2000);
  });
  it("ignores unknown codes", () => {
    expect(discountPaise(10000, "SAVE10")).toBe(0);
  });
  it("does not grant free shipping", () => {
    const sub = 40000;
    expect(shippingPaise(sub)).toBe(4900);
    const q = quoteCart(sub, "SAVE20");
    expect(q.discountPaise).toBe(8000);
    expect(q.shippingPaise).toBe(4900);
    expect(q.totalPaise).toBe(36900);
  });
});
```

`tests/stock.test.ts` — test a **pure** helper used by `assertAndDecrement`:

```ts
import { describe, expect, it } from "vitest";
import { planStock } from "../src/lib/stock";

describe("stock", () => {
  it("rejects when qty exceeds remaining", () => {
    expect(() =>
      planStock([{ productId: "a", qty: 2, stockQty: 1 }]),
    ).toThrow(/insufficient/i);
  });
  it("returns decremented quantities on success", () => {
    expect(planStock([{ productId: "a", qty: 2, stockQty: 5 }])).toEqual([
      { productId: "a", next: 3 },
    ]);
  });
  it("does not decrement any line if one fails", () => {
    expect(() =>
      planStock([
        { productId: "a", qty: 1, stockQty: 5 },
        { productId: "b", qty: 3, stockQty: 2 },
      ]),
    ).toThrow(/insufficient/i);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run`  
Expected: FAIL — `shippingPaise` / `planStock` not defined or wrong.

- [ ] **Step 3: Implement money + stock**

```ts
// src/lib/money.ts
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
```

```ts
// src/lib/stock.ts
export function planStock(
  lines: { productId: string; qty: number; stockQty: number }[],
) {
  for (const l of lines) {
    if (l.qty > l.stockQty) throw new Error("Insufficient stock");
  }
  return lines.map((l) => ({ productId: l.productId, next: l.stockQty - l.qty }));
}

export async function assertAndDecrement(
  tx: { product: { update: Function } },
  planned: { productId: string; next: number }[],
) {
  for (const p of planned) {
    await tx.product.update({ where: { id: p.productId }, data: { stockQty: p.next } });
  }
}
```

```ts
// src/lib/mock-pay.ts
export async function authorize(_input: { amountPaise: number; method: string }) {
  return { ok: true as const };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run`  
Expected: all tests PASS.

- [ ] **Step 5: Cart cookie + pages**

Cookie `appstore_cart` JSON `[{productId, qty}]`. Server actions: add, remove, save-for-later (delete cart line, add wishlist cookie), apply code stored in cookie `appstore_code`. Cart page Figma: line, **Remove · Save for later**, summary Subtotal / Discount / Shipping / Total, **Discount code** input, navy **Checkout**.

Wishlist cookie `appstore_wish`; **Move to cart**.

Checkout: email field for guests; address block; payment radios Bill Desk / Razorpay / UPI; **Place order** calls `authorize`, transaction: `planStock` + decrement + create `Order` id `ORD-${n}` padded, `XADD orders.placed * orderId ... email ... totalPaise ...`, redirect `/orders/[id]`.

Buy now = add qty 1 + redirect checkout.

- [ ] **Step 6: Verify**

Run: add in-stock item, apply `save20`, subtotal < ₹500 shows ₹49 shipping + 20% off; place order; MySQL `stockQty` dropped; Redis `XLEN orders.placed` ≥ 1; out-of-stock place rejected.

- [ ] **Step 7: Commit**

```bash
git add src/lib/money.ts src/lib/stock.ts src/lib/mock-pay.ts src/app/cart src/app/wishlist src/app/checkout src/app/actions tests
git commit -m "feat: cart, checkout, SAVE20, stock decrement, and money tests"
```

---



### Task 4: Identity, addresses, orders, track

**Files:**

- Create: `src/lib/session.ts`, `src/app/signin/page.tsx`, `src/app/actions/auth.ts`, `src/app/account/orders/page.tsx`, `src/app/account/addresses/page.tsx`, `src/app/track/page.tsx`, `src/app/orders/[id]/page.tsx`
- Modify: Header Sign in vs account; merge cart cookies on login

**Interfaces:**

- Consumes: `User`, `Session`, `Address`, `Order`
- Produces: `getSession(): Promise<{ userId, role, email } | null>`, `login`, `register`, `logout`; merge guest cart/wish into MySQL on login

- [ ] **Step 1: Session cookie**

`appstore_session` HTTP-only, signed with `SESSION_SECRET` (HMAC payload `sessionId`). Lookup `Session` not expired. bcrypt verify on login.

- [ ] **Step 2: Sign in · Register page**

Figma `4:2`: two fields, navy submit, toggle register. Seeded `buyer@appstore.local` / `AppStore!demo`. After auth, merge cookies into `Cart` / `WishlistItem`.

- [ ] **Step 3: Account + track + status**

`/account/orders` table Order / Date / Total / Status. `/account/addresses` list + **Add address**. `/track` input + **Look up** → `/orders/[id]` (guest allowed by id). Status copy: **Confirmed → Processing → Shipped → Delivered** with current step emphasized.

- [ ] **Step 4: Verify**

Run: register, merge cart; sign in as buyer; track `ORD-0001` after a guest order; header still matches Figma.

- [ ] **Step 5: Commit**

```bash
git add src/lib/session.ts src/app/signin src/app/account src/app/track src/app/orders src/app/actions/auth.ts
git commit -m "feat: sessions, guest merge, addresses, orders, and track"
```

---



### Task 5: Admin listings and fulfillment

**Files:**

- Create: `src/app/admin/layout.tsx`, `src/app/admin/products/page.tsx`, `src/app/admin/products/new/page.tsx`, `src/app/admin/products/[id]/page.tsx`, `src/app/admin/categories/page.tsx`, `src/app/admin/categories/sub/page.tsx`, `src/app/admin/orders/page.tsx`, `src/app/actions/admin.ts`
- Modify: Header **Admin** when `role === ADMIN`; cache bust on product/category save

**Interfaces:**

- Consumes: `getSession` — require `ADMIN` else redirect `/signin`
- Produces: CRUD products (name, category, subcategory, price, image URL, status); categories max 10 top-level (reject 11th); subcategory with parent; `advanceOrder(id)` one step along Confirmed → Processing → Shipped → Delivered; first button label **Start processing**

- [ ] **Step 1: Guard + products table/form**

Match Figma 15–16. Price input rupees, save as paise `* 100`. After save `redis.keys("appstore:*")` then `del`.

- [ ] **Step 2: Categories + subcategory**

Heading **Categories · max 10 top-level**. Enforce count of `parentId === null` ≤ 10.

- [ ] **Step 3: Process orders**

List open orders; **Start processing** on CONFIRMED; later **Mark shipped** / **Mark delivered**.

- [ ] **Step 4: Verify**

Run: login `admin@appstore.local` / `AppStore!demo`; add product; appear on `/`; advance an order; buyer track page updates.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin src/app/actions/admin.ts
git commit -m "feat: admin product, category, and order fulfillment"
```

---



### Task 6: Notifications worker + Mailpit

**Files:**

- Modify: `worker/index.ts` (replace stub), `docker-compose.yml` if command needs wait-for-migrate
- Create: none required beyond worker

**Interfaces:**

- Consumes: Redis stream `orders.placed` fields `orderId`, `email`, `totalPaise`
- Produces: SMTP message to `email` via `SMTP_HOST:SMTP_PORT`, from `receipts@appstore.local`, subject `AppStore receipt {orderId}`

- [ ] **Step 1: Worker implementation**

```ts
import Redis from "ioredis";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const redis = new Redis(process.env.REDIS_URL);
const prisma = new PrismaClient();
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
});

async function ensureGroup() {
  try {
    await redis.xgroup("CREATE", "orders.placed", "notifications", "0", "MKSTREAM");
  } catch (e: any) {
    if (!String(e.message).includes("BUSYGROUP")) throw e;
  }
}

async function loop() {
  await ensureGroup();
  while (true) {
    const res = await redis.xreadgroup(
      "GROUP", "notifications", "mailer",
      "COUNT", 1, "BLOCK", 5000, "STREAMS", "orders.placed", ">",
    );
    if (!res) continue;
    for (const [, entries] of res as any) {
      for (const [id, fields] of entries) {
        const map: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) map[fields[i]] = fields[i + 1];
        const order = await prisma.order.findUnique({
          where: { id: map.orderId },
          include: { items: true },
        });
        if (order && map.email) {
          const lines = order.items
            .map((i) => `${i.nameSnapshot} × ${i.qty}`)
            .join("\n");
          await transport.sendMail({
            from: "receipts@appstore.local",
            to: map.email,
            subject: `AppStore receipt ${order.id}`,
            text: `${lines}\nTotal paise: ${order.totalPaise}`,
          });
        }
        await redis.xack("orders.placed", "notifications", id);
      }
    }
  }
}

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify done criteria**

Run: `docker compose up --build`  
Expected: `/` renders Figma home chrome; place a guest order; Mailpit `:8025` shows receipt; `npx vitest run` green.

- [ ] **Step 3: Commit**

```bash
git add worker/index.ts
git commit -m "feat: send order receipts through Redis Streams and Mailpit"
```

---



## Self-review

1. **Spec coverage:** Tokens, 19 frames, compose, Prisma, seed JSON, Redis cache + streams, MockPay, Mailpit, guest checkout, SAVE20, shipping ₹500/₹49, stock on place, admin CRUD + pipeline, tests-only-three — each has a task.
2. **Placeholders:** None; worker stub is explicit until Task 6.
3. **Types:** `quoteCart` / `planStock` / `authorize` names match across Task 3 and tests.



## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-18-appstore-marketplace.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, start review as soon as any task finishes.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch with checkpoints.

Which approach?