# AppStore Marketplace Design

**Date:** 2026-09-18  
**Status:** Approved  
**Figma UI:** [AppStore UI](https://www.figma.com/design/npivpYycBDVOsJcfQXd3Pd) (`fileKey` `npivpYycBDVOsJcfQXd3Pd`, page `0:1` AppStore UI)  
**FigJam:** [Architecture](https://www.figma.com/board/ObKdDkvM0Cz0WsiZmxnP36) (`fileKey` `ObKdDkvM0Cz0WsiZmxnP36`)

**Done:** `docker compose up` brings up the shopper + admin app on `:3000`, MySQL, Redis, Mailpit UI on `:8025`, with migrate + seed + Next.js dev. Visual target is a complete copy of the Figma frames.

## Goal

A production-looking electronics marketplace named **AppStore**: shopper browse/search/PDP/cart/checkout/wishlist/track/orders, admin listings and order fulfillment, guest checkout, mock payments, receipt email via Redis Streams + Mailpit.

## Architecture

Single Next.js 15 App Router monolith (shopper + admin) plus a small Node worker process in the same compose project.

```
Shopper Web ──HTTPS──┐
Admin Console ──HTTPS─┴── Next.js App Router
                         ├── Identity ──────── MySQL (users, sessions)
                         ├── Catalog ───────── MySQL (products, SKUs, categories)
                         │                      Redis (browse/search cache)
                         │                      data/products.json (seed import only)
                         ├── Admin ─────────── MySQL (listings, order status)
                         ├── Cart and Checkout ─ MySQL (carts, orders)
                         │                      MockPay authorize (in-process)
                         │                      produces Redis Stream `orders.placed`
                         └── Notifications ── consumes stream ── Mailpit SMTP
```

No live Croma (or any third-party catalog) API. Runtime catalog is MySQL only.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 with CSS variables mapped 1:1 to Figma tokens
- Prisma + MySQL 8
- Redis 7 (cache + Streams)
- Mailpit (SMTP + web UI)
- Vitest for the three domain test files only
- lucide-react icons matching the Figma 24px stroke set (navy `#0F2744`)
- Font: Inter

## Visual system (copy exactly)

Seven colors only:

| Token | Hex | Use |
| --- | --- | --- |
| canvas | `#F6F4F0` | Page background |
| surface | `#FFFFFF` | Cards, header bar, inputs |
| ink | `#12141A` | Primary text |
| muted | `#5C6470` | Secondary text, placeholders |
| line | `#E6E2DA` | Borders, dividers |
| navy | `#0F2744` | Primary CTA, footer, icon stroke |
| gold | `#C4A35A` | Sale price, accent |

Icons (24px stroke, navy): Search, Bag, Truck, Heart, Cart, User, Pin, Refresh, Shield, Support.

Desktop layout width **1440px** with 48px page gutters. Usable from ~768px (stack filters, collapse category overflow, keep header search). Motion: 150–250ms ease on card hover, navy button press, cart badge, toasts. No extra palette.

**Figma frames to implement (node ids):**

| Frame | Node | Routes |
| --- | --- | --- |
| Tokens | `1:2` | CSS variables |
| 01 Header | `1:33` | All shopper pages |
| 02 Category nav | `1:44` | Shopper pages |
| 03 Footer | `1:56` | All public pages |
| 04 Home | `1:70` | `/` |
| 05 Product | `2:2` | `/p/[slug]` |
| 06 Listing | `2:29` | `/c/[slug]`, `/search` |
| 07 Cart | `2:65` | `/cart` |
| 08 Wishlist | `3:2` | `/wishlist` |
| 09 Checkout | `3:31` | `/checkout` |
| 10 Track order | `3:53` | `/track` |
| 11 Order status | `3:69` | `/orders/[id]` |
| 12 Sign in | `4:2` | `/signin` |
| 13 Account orders | `4:19` | `/account/orders` |
| 14 Addresses | `4:41` | `/account/addresses` |
| 15 Admin products | `4:52` | `/admin/products` |
| 16 Admin product form | `4:76` | `/admin/products/new`, `/admin/products/[id]` |
| 17 Admin categories | `4:104` | `/admin/categories` |
| 18 Admin subcategory | `4:123` | `/admin/categories/sub` |
| 19 Admin orders | `4:139` | `/admin/orders` |
| Icons | `8:2` | Shared |

Header copy: logo **AppStore**, search placeholder **Search products**, chip **Free shipping over threshold**, nav **Track / Wishlist / Cart / Sign in** (admin sessions show **Admin**). Footer rail: **Free shipping / Easy returns / Secure payments / 24/7 support**.

Category nav: All, Mobiles, Laptops, Audio, TVs, Appliances, Computers, Cameras, Wearables, Accessories (max **10** top-level categories).

## Domain rules

### Money

Store and compute in **integer paise** (₹1 = 100). Format for UI as `₹ 79,900` (en-IN grouping, rupee prefix, space after symbol as in Figma).

```
shippingPaise(subtotalPaise) =
  subtotalPaise >= 50000 ? 0 : 4900

discountPaise(subtotalPaise, code) =
  normalize(code) === "SAVE20" ? Math.floor(subtotalPaise * 0.20) : 0

totalPaise = subtotalPaise - discountPaise + shippingPaise
```

- `SAVE20` is case-insensitive; trim whitespace.
- One discount code per cart; no stacking.
- Invalid or empty code → discount `0` (not an error).
- SAVE20 does **not** create free shipping; shipping uses **pre-discount** subtotal vs ₹500.
- Display lines: Subtotal, Discount, Shipping (Free over threshold or ₹ 49), Total.

### Stock

- PDP: **In stock** if `stockQty > 0`, else **Out of stock**. Out of stock disables Buy now / Add to cart.
- Add to cart does **not** decrement stock.
- **Place order** is the decrement point. If any line `qty > remaining stock`, reject the whole order, decrement nothing, show a toast.
- Successful place: `stockQty -= qty` per line inside a DB transaction.

### Cart, wishlist, guest checkout

- Guest cart and wishlist live in an HTTP cookie (`appstore_cart`, `appstore_wish`) as JSON `{ productId, qty }[]`.
- On login/register, merge cookie lines into the user’s MySQL cart/wishlist (sum qty, cap at stock for display only).
- Guest **checkout allowed**: email + shipping address, no account. Order stored with `userId` null and `guestEmail`.
- Signed-in checkout uses saved addresses; **Add address** on checkout writes Address then selects it.
- Cart actions from Figma: Remove, Save for later (moves line to wishlist, qty 1).
- Wishlist: **Move to cart**.

### Payments and email

- Checkout radios: **Bill Desk · Razorpay · UPI** — UI only; all call in-process `mockPay.authorize({ amountPaise, method })` which **always succeeds**.
- Place order: persist order `CONFIRMED`, decrement stock, clear purchased cart lines, `XADD orders.placed` with `{ orderId, email, totalPaise }`.
- Worker `BRPOP`/`XREAD` group `notifications` on `orders.placed`, sends SMTP to Mailpit: subject `AppStore receipt {orderId}`, body with line items and total. Mailpit UI `http://localhost:8025`.

### Auth

- Email + password, HTTP-only session cookie `appstore_session`.
- Roles: `BUYER`, `ADMIN`. Admin routes require `ADMIN`.
- Seeded users (password `AppStore!demo` for both):
  - `buyer@appstore.local`
  - `admin@appstore.local`
- Sign in screen also has Register (same page, Figma “Sign in · Register”).

### Orders

Guest or buyer can **Track** with order id (e.g. `ORD-0001`). Status pipeline: `CONFIRMED → PROCESSING → SHIPPED → DELIVERED`. Admin **Start processing** advances `CONFIRMED → PROCESSING`; further buttons advance one step each.

### Catalog seed

`data/products.json` is an array of products with name, slug, description, mrpPaise, pricePaise, stockQty, categorySlug, subcategorySlug, imageUrl (placeholder `#E6E2DA` tiles acceptable if URLs missing). Prisma seed inserts categories (≤10 top-level) then products. Runtime reads DB only.

Listing filters (Figma): Under ₹500, ₹500–₹2,000, ₹2,000–₹10,000, Above ₹10,000 (inclusive bounds on `pricePaise`).

Search: case-insensitive `name` / `description` contains; cached in Redis key `search:{normalized}` TTL 60s. Category listing cached `browse:{slug}:{filter}` TTL 60s. Admin product/category writes `DEL` matching keys (or `FLUSHDB` of cache prefix `appstore:`).

## Data model (Prisma)

- `User`: id, email unique, passwordHash, role enum BUYER|ADMIN, createdAt
- `Session`: id, userId, expiresAt
- `Category`: id, name, slug unique, parentId nullable, sortOrder
- `Product`: id, name, slug unique, description, mrpPaise, pricePaise, stockQty, imageUrl, categoryId, subcategoryId nullable, status ACTIVE|HIDDEN
- `Cart`: id, userId unique nullable, updatedAt
- `CartItem`: cartId, productId, qty
- `WishlistItem`: userId, productId (guests cookie-only)
- `Address`: id, userId nullable, name, line1, city, postal, guestEmail nullable
- `Order`: id (human `ORD-####`), userId nullable, guestEmail nullable, status, subtotalPaise, discountPaise, shippingPaise, totalPaise, discountCode nullable, paymentMethod, createdAt
- `OrderItem`: orderId, productId, nameSnapshot, unitPaise, qty

## Compose services

| Service | Image/build | Ports | Notes |
| --- | --- | --- | --- |
| mysql | mysql:8 | 3306 | DB `appstore`, user/pass `appstore` |
| redis | redis:7 | 6379 | cache + stream |
| mailpit | axllent/mailpit | 8025 HTTP, 1025 SMTP | |
| app | Dockerfile.dev Next | 3000 | wait for mysql, `prisma migrate deploy`, `prisma db seed`, `next dev --hostname 0.0.0.0` |
| worker | same image | — | `node worker/index.js` after migrate |

`.env`: `DATABASE_URL`, `REDIS_URL`, `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `SESSION_SECRET`.

## Testing (only this)

Three Vitest files, no UI/e2e TDD:

1. **Pricing** — shipping threshold, ₹49 below, free at/above ₹500, total composition.
2. **Stock** — reject when qty > stock; decrement on success; no partial decrement on multi-line failure.
3. **SAVE20** — 20% floor, case-insensitive, invalid code 0, does not change shipping rule.

## Out of scope

Live payment gateways, live catalog APIs, reviews, multi-vendor, inventory reservations at add-to-cart, mobile-native apps, extra colors/fonts.

## File layout

```
docker-compose.yml
Dockerfile
package.json
prisma/schema.prisma
prisma/seed.ts
data/products.json
worker/index.ts
src/app/**/page.tsx          # routes above
src/components/chrome/*      # Header, CategoryNav, Footer
src/lib/money.ts             # format + pricing + stock helpers
src/lib/db.ts
src/lib/redis.ts
src/lib/session.ts
src/lib/mock-pay.ts
tests/pricing.test.ts
tests/stock.test.ts
tests/save20.test.ts
```

## Parallel work (for the plan)

Task 1 (compose + Prisma + seed + tokens + chrome) is the only serial gate. After it: Catalog, Identity/account, and Admin can run in parallel. Cart/checkout shares `src/lib/money.ts` with tests. Worker can start once `orders.placed` is produced (or against a stub XADD). Review starts when any task’s deliverable lands.
