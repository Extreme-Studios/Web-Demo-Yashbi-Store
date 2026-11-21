# Yashbi Store

**Live concept showcase:** [demo-yashbi-store.vercel.app](https://demo-yashbi-store.vercel.app/)

Yashbi Store is an interactive fashion showroom demo for dresses, menswear, and shoes. Open **Yashbi Stylist** and tap a starter prompt to see the camera inspect a recommended look. The storefront defaults to English, while the stylist follows the shopper’s language.

## Architecture

| Layer | Implementation |
| --- | --- |
| Virtual showroom | Three.js 0.187.0, a perspective camera, alpha-aware raycasting for transparent product imagery, lookbooks, and garment detail zoom. The showroom recovers from WebGL context loss and clears the recovery notice after rendering resumes. |
| Spatial AI stylist | `POST /api/chat` sends up to eight recent conversation messages to Gemini and returns structured JSON with `reply`, `recommendedSkus`, and allowlisted `focusProduct` actions. The first action moves the live Three.js camera, and the look panel lets the shopper inspect other pieces. |
| Commerce | Cart, manual payment proof, order history, tracking, and invoices. Google Apps Script validates SKU, variant, and aggregate quantity against the server catalog, then recalculates line totals, subtotal, allowlisted shipping, and order total before writing to Google Sheets or preparing invoices. |
| Catalog | Fully configured active Sheets rows take priority. An active, unconfigured placeholder for a known SKU uses the approved server-owned snapshot in `backend/OrderCatalog.gs` for price and variants. Stock still comes from Sheets. Inactive, missing, or partly configured entries are rejected. |
| Chat protection | The Vercel function limits each client IP to eight accepted requests per rolling 60 seconds within a warm instance, returning HTTP 429 and `Retry-After`. In-memory counters are reset by cold starts and are separate across instances. The production Vercel Firewall rule provides a shared backstop of 12 POST requests per IP per 60-second fixed window. |

## Local setup

Use Node.js 20+ and Google Chrome for the browser suites.

```sh
npm ci
npm run build
npm run preview
```

Open [localhost:4173](http://localhost:4173/). The local preview uses deterministic chat and simulates checkout, tracking, and invoice PDFs. It does not make payments or write to production services.

For the Vercel chat function, configure these server-side variables:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for live Gemini responses. Store it in the Vercel environment. |
| `GEMINI_MODEL` | Optional model override. Defaults to `gemini-3.1-flash-lite`. The handler retries unsupported or missing models once with `gemini-2.5-flash`. |

With the local preview running, execute:

```sh
npm test
npm run test:layout
node tests/garment-zoom.cjs
```

The suites cover Apps Script order pricing, idempotent retries, structured Gemini responses with mocked upstream calls, rate limiting, camera interactions, WebGL recovery, touch layout, and simulated commerce. Shop prices in the browser are display values. Staff verify actual payments against the authoritative order totals.

## Deployment

Vercel builds the storefront into `dist/` and publishes the chat function. The commerce backend is a separately versioned Google Apps Script web app. Deploy changes under `backend/` to the existing web app deployment to preserve its URL and make commerce protections effective. Do not commit local environment files or credentials.

**Author:** Mochammad Fajar Adi — Extreme Studios / Extreme Studios AI
