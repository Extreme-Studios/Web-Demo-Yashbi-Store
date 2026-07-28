const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith("http://127.0.0.1:4173") && response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  const productCount = await page.locator(".product-card").count();
  if (productCount !== 30) throw new Error(`Katalog tampil ${productCount}, seharusnya 30.`);
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 700) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(() => [...document.querySelectorAll(".product-card img")].every(image => image.complete && image.naturalWidth > 0));

  await page.screenshot({ path: path.join(__dirname, "desktop-home.png"), fullPage: true });
  await page.locator('[data-product-id="GW-001"]').click();
  await page.locator('[data-size="M"]').click();
  await page.locator("#addToCartButton").click();
  if ((await page.locator("#cartCount").textContent()).trim() !== "1") throw new Error("Produk gagal masuk keranjang.");

  await page.locator("#cartToggle").click();
  await page.locator("#checkoutOpen").click();
  await page.fill('[name="name"]', "Ayu Pembeli Demo");
  await page.fill('[name="phone"]', "081234567890");
  await page.fill('[name="email"]', "ayu@example.com");
  await page.fill('[name="address"]', "Jl. Pemuda No. 10");
  await page.fill('[name="city"]', "Surabaya");
  await page.fill('[name="postal"]', "60271");
  await page.selectOption('[name="courier"]', { index: 1 });
  await page.setInputFiles("#proofInput", path.resolve(__dirname, "../assets/images/yashbi-hero.png"));
  await page.locator(".consent input").check();
  await page.locator("#checkoutForm").getByRole("button", { name: "Buat Pesanan" }).click();
  await page.locator("#successModal.open").waitFor();
  const orderId = (await page.locator("#successOrderId").textContent()).trim();
  if (!/^YS-\d{6}-\d{3}$/.test(orderId)) throw new Error(`Nomor order tidak valid: ${orderId}`);

  await page.locator("#successModal [data-close-modal]").click();
  await page.locator("#trackOrderOpen").click();
  await page.fill('#trackForm [name="orderId"]', orderId);
  await page.fill('#trackForm [name="phone"]', "081234567890");
  await page.locator("#trackForm").getByRole("button", { name: "Lihat Status" }).click();
  await page.locator("#trackResult .status-pill").waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(__dirname, "mobile-home.png"), fullPage: true });

  if (errors.length) throw new Error(`Browser error: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, productCount, orderId, desktop: "tests/desktop-home.png", mobile: "tests/mobile-home.png" }));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
