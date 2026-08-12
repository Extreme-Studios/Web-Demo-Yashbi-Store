/* Sahabat Yashbi: same compact conversation pattern as Sahabat Rin. */
(function () {
  const DAILY_LIMIT = 12;
  const storageKey = "yashbi-sahabat-yashbi-usage";
  const root = document.getElementById("yashbiChat");
  if (!root) return;
  const panel = root.querySelector("[data-chat-panel]");
  const toggle = root.querySelector("[data-chat-toggle]");
  const close = root.querySelector("[data-chat-close]");
  const form = root.querySelector("form");
  const input = root.querySelector("input");
  const messages = root.querySelector("[data-chat-messages]");
  const remaining = root.querySelector("[data-chat-remaining]");
  const send = root.querySelector("[data-chat-send]");
  let loading = false;

  function available() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return saved.date === today ? Math.max(0, DAILY_LIMIT - (saved.count || 0)) : DAILY_LIMIT;
    } catch (error) { return DAILY_LIMIT; }
  }
  function consume() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const count = saved.date === today ? (saved.count || 0) + 1 : 1;
      localStorage.setItem(storageKey, JSON.stringify({ date: today, count }));
      return Math.max(0, DAILY_LIMIT - count);
    } catch (error) { return 0; }
  }
  function setRemaining() { remaining.textContent = `${available()} chat tersisa hari ini`; }
  function addMessage(role, text) {
    const item = document.createElement("div");
    item.className = `yashbi-chat-message ${role}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
  }
  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("span").textContent = open ? "Tutup" : "Sahabat Yashbi";
    if (open) input.focus();
  }

  setRemaining();
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || loading) return;
    if (available() <= 0) {
      addMessage("assistant", "Batas chat hari ini sudah tercapai. Kamu tetap bisa melihat koleksi atau hubungi toko ya, Kak.");
      return;
    }
    loading = true;
    send.disabled = true;
    input.value = "";
    addMessage("user", message);
    const typing = document.createElement("div");
    typing.className = "yashbi-chat-message assistant typing";
    typing.textContent = "Sahabat Yashbi sedang mengetik...";
    messages.append(typing);
    try {
      const catalog = typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS) ? PRODUCTS.map((product) => ({ id: product.id, name: product.name, category: product.category, price: product.price, colors: product.colors, sizes: product.sizes, stock: product.stock, desc: product.desc })) : [];
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, catalog }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sahabat Yashbi belum dapat dihubungi.");
      typing.remove();
      addMessage("assistant", data.reply);
      consume();
      setRemaining();
    } catch (error) {
      typing.remove();
      addMessage("assistant", `${error.message || "Sahabat Yashbi sedang gangguan."} Kamu bisa lanjut melihat koleksi dulu ya.`);
    } finally {
      loading = false;
      send.disabled = false;
    }
  });
}());
