# Existing system audit — 13 November 2026

This document records source inspection before the storefront redesign. It does not assert that remote integrations have been tested. The main implementation agent separately audits `index.html`, `assets/app.js`, `assets/styles.css`, product data, and image contents.

## Repository and inspected files

Source checkout: `Extreme-Studios/Web-Demo-Yashbi-Store`, starting HEAD `519d00e4b2c6e89490acdbccb726502d4534a526`.

Ancillary source inspection covered every file in these groups:

- `README.md`, `vercel.json`, `.gitignore`, `.env.example`, `.clasp.json`.
- `backend/Code.gs`, `backend/ImportCatalog.gs`, `backend/appsscript.json`.
- `api/chat.js`.
- `admin.html`, `assets/admin.js`, `assets/admin.css`, `assets/admin-biteship.js`, `assets/admin-email.js`, `assets/admin-invoice-link.js`.
- `assets/config.js`, `assets/chat-widget.js`.
- `tests/smoke.cjs`, `tools/slice_catalog.py`.

At the starting revision this is a static HTML/CSS/JavaScript site, with one Vercel serverless chat handler and a separately deployed Google Apps Script backend. There is no application package manifest or build step in the original repository. The `.clasp.json` binds the existing Apps Script project; it is not a reason to deploy backend changes during a visual redesign. `.env.example` contains only the server-side Gemini environment-variable placeholder. No secret value is copied into this report.

## Existing contracts to preserve

### Store configuration and deployment

`assets/config.js` already contains a Google Apps Script deployment URL. Contrary to the conditional setup wording in the README, local checkout activity must not assume the backend is inactive. Preserve the production endpoint and isolate localhost testing instead of replacing the real store configuration with a mock endpoint for all hosts.

The Vercel configuration uses clean URLs, no trailing slash, security response headers, and year-long immutable caching for `/assets/*`. Changed scripts/styles should use a new version query or a versioned URL on a later authorized deployment. The production host is declared by the README, but this audit does not verify current DNS, deployment, or service health.

### Google backend

GET actions:

| Action | Contract |
| --- | --- |
| `health` / unknown action | `{ ok, service, time }` health result |
| `products` | `{ ok, products }`; product IDs, prices, original prices, category, colors, sizes, stock, image, alternate image, description, badge |
| `catalog-images` | `{ ok, images }`; uppercase IDs and primary/alternate image URLs |
| `track` | Requires order ID and WhatsApp; returns status, timestamps, courier, tracking, and Biteship state |
| `admin-dashboard` | Requires cached admin token; returns visitors, orders, items, and counts |

POST actions:

| Action | Behavior |
| --- | --- |
| `createOrder` / `syncOrder` | Stores order and items, saves proof image, attempts PDF invoice and buyer email |
| `upsertVisitor` | Writes visitor name, session, status, and optional order ID |
| `adminLogin` | Returns six-hour cached token, role, display name |
| `updateOrder` | Saves status, email, expedition, tracking; regenerates invoice for shipment states |
| `sendInvoiceEmail` | Authenticated invoice-link email; shipment/tracking gate enforced |
| `generateInvoice` | Authenticated Drive PDF creation |
| `readyForBiteshipPickup` | Authenticated packing-to-sandbox-pickup transition |
| `createBiteshipShipment` | Authenticated sandbox shipment creation, idempotent if shipment ID exists |
| `biteshipSandboxStatus` | Authenticated readiness metadata, no key returned |
| `biteshipWebhook` | Shared webhook-token verification, shipment status synchronization |
| `clearDemoOrderData` | OWNER-only operational-row reset; must not be invoked for local QA |

The spreadsheet schema includes Products, Orders, Order Items, Settings, Visitors, and Admin tables. Preserve field names and the existing Apps Script request/response shape. Apps Script errors use `{ ok: false, error }` JSON rather than necessarily returning a non-200 HTTP status.

Order payload requirements are `customer`, nonempty `items`, `clientOrderId`, source, payment method, proof data URL, subtotal, and shipping. The customer includes name, phone, email, address, city, postal code, and courier. Item records include `productId`, name, color, size, quantity, and unit price. `clientOrderId` deduplicates a repeated synchronization. Server order IDs use `YS-YYMMDD-NNN`, Asia/Jakarta; WhatsApp normalization maps Indonesian `62`/`8` prefixes to leading `0` for matching.

Proof storage accepts `data:image/jpeg;base64,...`, PNG, or WebP. It creates monthly proof subfolders in Drive. Invoice generation creates a Google Doc archive and a PDF in Drive, attempts link sharing, and returns view/download URLs. Successful order creation can immediately send invoice email when an email is supplied. Later admin invoice notification is separately gated by shipment status and tracking.

Biteship is deliberately sandbox-only: backend requires `BITESHIP_ENV=sandbox` and a test-prefixed server-side Script Property key. It requires `Diproses` before Ready, creates one shipment with a real sandbox response/waybill, rolls Ready back on failure, and maps delivery status to storefront status. No carrier action is required to verify the local redesign.

### Admin page dependency

`admin.html` loads `assets/styles.css` before its own stylesheet. The redesign must retain the shared font/token and primitive contracts (`--serif`, `--ink`, brand, button, field, close button, toast, status styles) or scope new storefront styling so the operations page stays usable. Admin login and writes use the same configured Apps Script endpoint and sessionStorage token. No admin login, shipping, notification, credential reset, or operational cleanup should be triggered by visual QA.

The admin scripts wrap shared global functions in a deliberate load order: `admin.js`, email helper, invoice lock, then Biteship helper. Keep that order. Shipping/Selesai require expedition and tracking. WhatsApp/email invoice actions are locked until pickup/tracking is available.

### Sahabat Yashbi

Preserve the widget root and hooks: `#yashbiChat`, `[data-chat-panel]`, `[data-chat-toggle]`, `[data-chat-close]`, `[data-chat-messages]`, `[data-chat-remaining]`, and `[data-chat-send]`, its form and input. Toggle state uses `hidden` and `aria-expanded`. Messages are inserted with `textContent`.

The widget POSTs `{ message, catalog }` to same-origin `/api/chat`; catalog is derived from the frontend `PRODUCTS` global. Success is `{ reply }`, errors `{ error }`. It has a browser-only twelve-successful-chats daily counter and sends no prior conversation history. The date key uses UTC. These are existing behavior/limitations, not proof of a server-enforced quota.

`api/chat.js` permits POST only, limits a message to 800 characters, reads `GEMINI_API_KEY` server-side, and calls Gemini. It prefers the supplied frontend catalog, otherwise fetches the configured catalog with a seven-second timeout. A missing key returns 503; upstream failure returns 502. Never expose the API key in static assets or use a hosted model request merely to test chat open/close behavior. A plain Python static server cannot execute this handler, so localhost needs a compatible local handler/fallback or an explicit test interception for chat response testing.

## Findings and redesign implications

1. **Existing smoke test has remote side effects.** `tests/smoke.cjs` creates an order with a buyer email and uploads an existing hero image as payment proof. With current config, that can write Sheets/Drive and send email. Its tracking then requests the same remote endpoint. Run it only after request isolation or adapt it to the local preview mode. Never run setup, cleanup, catalog import, or credential helper functions for this redesign.
2. **Static preview alone does not execute chat.** Python's server produces a POST failure for `/api/chat`; opening the widget can be tested without submission, but a full local chat flow needs an actual local handler or a clearly labeled deterministic fallback.
3. **The repository contains more image files than active products.** Catalog import helpers and `tools/slice_catalog.py` target 32 SKU images (eight per category). Preserve the active 30-product catalog from frontend source; do not create two extra products merely because files exist.
4. **Do not fabricate image semantics.** Backend primary/alternate URLs can be identical. A second filename is not automatically a real back-view photograph. Front/back presentation must distinguish an available reference image from an actual separate back view.
5. **Original smoke selectors assume a product grid.** The test expects 30 `.product-card` elements and old modal controls. Preserve compatible hooks or replace assertions with meaningful rack/shelf and catalog-count checks. A new UI failing an obsolete selector does not prove a feature regression; an updated selector passing does not prove checkout/PDF correctness by itself.
6. **Current backend trusts frontend commerce totals.** It does not recalculate subtotal from authoritative product prices, validate SKU/color/size choices against the product sheet, decrement stock, or enforce a proof file-size limit server-side. These are pre-existing backend limits, not repaired or certified by a local visual redesign. Keep pricing and product IDs intact and do not describe local QA as a payment/security audit.
7. **Admin implementation has legacy limits.** Malformed stored session JSON is not caught. Opening order detail repeatedly attaches repeated capture submit validation listeners. These are pre-existing code concerns outside the requested storefront redesign; verify the admin login view still renders without changing workflow behavior.
8. **Chat quota/catalog input are client-controlled.** The browser quota is not a server rate limit, and the server can accept the browser-supplied catalog. Preserve function; do not claim stronger guarantees.
9. **Asset regeneration is not necessary.** `tools/slice_catalog.py` references historical local generated-image paths and overwrites product crops. Do not run it during the redesign. Existing product image files remain the source assets.

## Safe and meaningful local verification

1. Enable localhost-only isolation before any browser checkout test. Block all Google Apps Script writes, visitor writes, invoice email, and shipping calls in automated tests. Assert that no production write request occurred. Keep live integration status separate from local test results.
2. Verify all 30 product IDs, prices, category assignment, image existence, color/size choices, and stock display against original frontend data. Load the complete page and all rack/shelf categories; report failed resources and browser exceptions, including chat submission behavior if tested.
3. Exercise rack click, arrows, keyboard, scroll/wheel, pointer drag/swipe; inspect focus blur, swatches, front/back control, size selection, and quick add. Exercise shoes overview, focus animation, adjacent peeks, color/size selection, cart, and Escape return. Check reduced-motion and touch behavior.
4. Test cart subtotal and quantity with known product prices. Checkout with a generated tiny PNG proof fixture and clearly synthetic local customer data. Verify payment choice, validation, order creation, persistent purchase record, and tracking by order ID plus WhatsApp; assert a mismatched WhatsApp cannot expose the local order.
5. Trigger the actual frontend PDF invoice download in local mode. Assert a nonempty `.pdf` file beginning with `%PDF-`, and inspect the parsed document or rendered pages for product, variants, quantity, subtotal, shipping, total, buyer, order ID, and status. A button click alone is insufficient. Backend Drive PDF and outbound email remain unverified unless separately authorized and actually exercised.
6. Verify four distinct footer information dialogs and nonblocking first-visit nickname greeting. Open/close Sahabat Yashbi, submit a local preview message when a fallback exists, and inspect truthful unavailable/demo status.
7. Repeat core navigation/cart/checkout and inspect viewport overflow at desktop and `390×844`. Confirm all dialogs remain scrollable, touch controls reachable, focus visible, Escape closes the relevant surface, and opening/closing focus modes restores page scrolling.
8. Verify `admin.html` login view renders without JS errors; do not authenticate or change remote state.

Actual implementation checks and results belong in the final preview report. No production deployment, Git push, Google backend deployment, or external customer notification was performed by this audit.
