import { createStylistChime } from './stylist-chime.js';
import { productDescription } from './catalog-copy-en.js';
const HISTORY_LIMIT = 8;
const WELCOME_SESSION = 'yashbi-atelier-welcome-seen';

export function bindStylist({ $, products, money, openDialog, onStylistFocus, notifyLayout }) {
  const dialog = $('chatDialog');
  const launcher = $('chatOpen');
  const chime = createStylistChime();
  let welcomeSeen = false;
  try { welcomeSeen = sessionStorage.getItem(WELCOME_SESSION) === '1'; } catch { /* Use page memory. */ }

  function markWelcomeSeen() {
    welcomeSeen = true;
    try { sessionStorage.setItem(WELCOME_SESSION, '1'); } catch { /* Use page memory. */ }
  }

  function setChatMode(mode) {
    dialog.dataset.mode = mode;
    const welcome = mode === 'welcome';
    dialog.setAttribute('aria-labelledby', welcome ? 'atelierWelcomeTitle' : 'chatDialogTitle');
    dialog.setAttribute('aria-describedby', welcome ? 'atelierWelcomeCopy' : 'chatStatus');
  }

  const messages = $('chatMessages');
  const tray = $('stylistLook');
  const items = $('stylistLookItems');
  const catalog = products.map(product => {
    const { id, name, category, price, colors, sizes, stock } = product;
    return { id, name, category, price, colors, sizes, stock, desc: productDescription(product) };
  });
  const bySku = new Map(products.map(product => [product.id, product]));
  const history = [];
  let pending = false;
  let activeSku = '';

  function addMessage(role, content) {
    const node = document.createElement('div');
    node.className = 'chat-message ' + role;
    node.textContent = content;
    node.dir = 'auto';
    messages.append(node);
    messages.scrollTop = messages.scrollHeight;
    return node;
  }

  const chatViewport = window.visualViewport;

  function fitChatViewport() {
    if (!dialog.open || !chatViewport) return;
    const { offsetTop, height } = chatViewport;
    const coveredBottom = Math.max(0, document.documentElement.clientHeight - height - offsetTop);
    dialog.style.setProperty('--chat-viewport-top', offsetTop + 'px');
    dialog.style.setProperty('--chat-viewport-bottom', coveredBottom + 'px');
    dialog.style.setProperty('--chat-viewport-height', height + 'px');
  }

  chatViewport?.addEventListener('resize', fitChatViewport);
  chatViewport?.addEventListener('scroll', fitChatViewport);

  function startWelcome() {
    if (welcomeSeen || document.querySelector('dialog[open]')) return;
    setChatMode('welcome');
    openDialog('chatDialog');
    if (dialog.open) {
      fitChatViewport();
      $('atelierWelcomeTitle').focus({ preventScroll: true });
      markWelcomeSeen();
    }
  }

  function openChat(event) {
    chime.unlock(event);
    setChatMode('chat');
    openDialog('chatDialog');
    if (dialog.open) {
      fitChatViewport();
      $('chatInput').focus({ preventScroll: true });
      markWelcomeSeen();
    }
  }

  dialog.addEventListener('close', () => {
    if (document.activeElement === document.body) launcher.focus({ preventScroll: true });
  });

  function select(sku) {
    activeSku = sku;
    for (const button of items.querySelectorAll('button')) {
      button.setAttribute('aria-current', String(button.dataset.sku === sku));
    }
  }

  function showLook({ recommendedSkus, actions }, messageNode) {
    const requested = Array.isArray(recommendedSkus) ? recommendedSkus.slice(0, 12) : [];
    const skus = [...new Set(requested.filter(sku => bySku.has(sku)))].slice(0, 3);
    if (!skus.length) return;
    const validActions = (Array.isArray(actions) ? actions.slice(0, 12) : [])
      .filter(action => action?.type === 'focusProduct' && skus.includes(action.sku));
    $('stylistNotes').textContent = messageNode.textContent;
    tray.querySelector('details').open = false;
    const buttons = document.createElement('div');
    buttons.className = 'stylist-items';
    items.replaceChildren();

    function focus(sku, detailView, fromChat) {
      if (fromChat && !dialog.open) return;
      if (!onStylistFocus(sku, detailView)) return;
      if (dialog.open) dialog.close();
      select(sku);
      tray.closest('.product-hud').scrollTop = 0;
      $('stylistContinue').focus({ preventScroll: true });
    }

    for (const sku of skus) {
      const product = bySku.get(sku);
      const detailView = validActions.find(action => action.sku === sku)?.detailView === true;
      const makeButton = fromChat => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.sku = sku;
        button.textContent = product.name;
        button.title = product.name + ' · ' + money(product.price);
        if (!fromChat) button.setAttribute('aria-current', String(activeSku === sku));
        button.addEventListener('click', () => focus(sku, detailView, fromChat));
        return button;
      };
      items.append(makeButton(false));
      buttons.append(makeButton(true));
    }
    messageNode.after(buttons);
    tray.hidden = false;
    notifyLayout();
    const lead = validActions[0];
    if (lead && dialog.open) focus(lead.sku, lead.detailView === true, true);
  }

  launcher.addEventListener('click', openChat);
  $('stylistContinue').addEventListener('click', openChat);
  const input = $('chatInput');
  const starters = $('stylistStarters');
  const chips = [...starters.querySelectorAll('button')];
  async function sendMessage(message) {
    if (!message || pending) return;
    pending = true;
    if (dialog.dataset.mode === 'welcome') {
      setChatMode('chat');
      // Keep focus in the dialog before the clicked prompt is disabled.
      messages.focus({ preventScroll: true });
    }
    chips.forEach(chip => chip.disabled = true);
    $('chatSend').disabled = true;
    input.value = '';
    addMessage('user', message);
    const replyNode = addMessage('assistant', 'I’m putting a look together for you…');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, catalog }), signal: AbortSignal.timeout(25000),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        const retry = Number(response.headers.get('Retry-After') || data.retryAfter);
        throw new Error(retry > 0 ? 'The stylist is busy. Try again in ' + retry + ' seconds.' : 'The stylist is busy. Please try again in a moment.');
      }
      if (!response.ok) throw new Error(data.error || 'Could not reach the stylist.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The stylist returned an empty reply.');
      replyNode.textContent = data.reply;
      history.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
      if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
      if (!data.simulation) chime.play();
      showLook(data, replyNode);
    } catch (error) {
      replyNode.textContent = error.name === 'TimeoutError' ? 'The stylist timed out. Please try again.' : error.message;
      if (!input.value) input.value = message;
    } finally {
      pending = false;
      $('chatSend').disabled = false;
      chips.forEach(chip => chip.disabled = false);
      messages.scrollTop = messages.scrollHeight;
    }
  }
  $('chatForm').addEventListener('submit', event => {
    event.preventDefault();
    chime.unlock(event);
    void sendMessage(input.value.trim());
  });
  for (const chip of chips) chip.addEventListener('click', event => {
    chime.unlock(event);
    const garment = /^(GW|JP)-/.test(activeSku) ? bySku.get(activeSku) : bySku.get('JP-001');
    const message = chip.dataset.stylistPrompt === 'fabric' && garment
      ? 'Zoom in on the fabric detail of ' + garment.name + ' (' + garment.id + ').'
      : chip.textContent.trim();
    void sendMessage(message);
  });
  return { select, startWelcome };
}
