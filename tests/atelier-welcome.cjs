const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = 'http://127.0.0.1:4173';
const SESSION_KEY = 'yashbi-atelier-welcome-seen';
const VIEWPORTS = [
  [1440, 1000], [1366, 768], [1228, 610], [1024, 768],
  [1920, 1080], [390, 844], [360, 800], [844, 390],
];
const PROMPTS = [
  'Style a wedding look with a sand suit',
  'Find an evening dress under Rp 2M',
  'Show me the fabric close-up',
];

async function loadWelcome(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('dialog', { name: 'Welcome to Yashbi.' }).waitFor();
  assert.equal(await page.locator('#stylistGreeting, .stylist-greeting, #stylistUnread, .stylist-unread').count(), 0);
  assert.equal(await page.locator('.atelier-welcome-heading p').innerText(), 'THE YASHBI ATELIER · PERSONAL STYLING');
  assert.equal(await page.locator('.atelier-welcome-stylist').innerText(), 'Alya — Your 3D Showroom Stylist');
  assert.equal(await page.locator('#atelierWelcomeCopy').innerText(), "Tell me the occasion, vibe, or budget—I'll glide the 3D showroom straight to your look.");
  assert.equal(await page.locator('#chatDialog .stylist-avatar').innerText(), 'A');
  assert.deepEqual(await page.locator('#stylistStarters button').allTextContents(), PROMPTS);
  assert.equal(await page.locator('#chatInput').getAttribute('placeholder'), 'What are you dressing for?');
  assert.equal(await page.locator('#chatInput').evaluate(input => document.activeElement === input), false);
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), SESSION_KEY), '1');
}

async function assertWelcomeLayout(page) {
  const issues = await page.locator('#chatDialog').evaluate(dialog => {
    const bounds = dialog.getBoundingClientRect();
    const selectors = ['.atelier-welcome-heading p', '#atelierWelcomeTitle', '.chat-identity',
      '#atelierWelcomeCopy', '.dialog-close', '#chatInput', '#chatSend', '#browseShowroom'];
    const controls = [
      ...selectors.map(selector => dialog.querySelector(selector)),
      ...dialog.querySelectorAll('#stylistStarters button'),
    ];
    const boxes = controls.map(control => ({ name: control.textContent.trim() || control.id, box: control.getBoundingClientRect() }));
    const issues = [];
    if (dialog.scrollHeight > dialog.clientHeight || dialog.scrollTop) issues.push('welcome requires vertical scrolling');
    if (bounds.top < 0 || bounds.bottom > innerHeight || bounds.left < 0 || bounds.right > innerWidth) {
      issues.push('welcome shell is outside the viewport');
    }
    const dock = dialog.querySelector('.chat-dock').getBoundingClientRect();
    if (bounds.bottom - dock.bottom > 3) issues.push('welcome shell extends past its footer');
    for (const [i, item] of boxes.entries()) {
      const { box } = item;
      if (!box.height || box.top < bounds.top || box.bottom > bounds.bottom || box.left < bounds.left || box.right > bounds.right) {
        issues.push(item.name + ' does not fit in the welcome');
      }
      for (const other of boxes.slice(i + 1)) {
        if (Math.min(box.right, other.box.right) - Math.max(box.left, other.box.left) > 1 &&
            Math.min(box.bottom, other.box.bottom) - Math.max(box.top, other.box.top) > 1) {
          issues.push(item.name + ' overlaps ' + other.name);
        }
      }
    }
    for (const starter of dialog.querySelectorAll('#stylistStarters button')) {
      if (parseFloat(getComputedStyle(starter).borderTopLeftRadius) > 2) issues.push('starter has rounded corners');
    }
    return issues;
  });
  const { width, height } = page.viewportSize();
  assert.deepEqual(issues, [], width + 'x' + height + ' welcome layout');
}

async function assertChatLayout(page) {
  const result = await page.locator('#chatDialog').evaluate(dialog => {
    const thread = dialog.querySelector('#chatMessages');
    const header = dialog.querySelector('.chat-header');
    const dock = dialog.querySelector('.chat-dock');
    const input = dialog.querySelector('#chatInput');
    const send = dialog.querySelector('#chatSend');
    const visible = window.visualViewport;
    const viewportTop = visible?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (visible?.height ?? innerHeight);
    const viewportRight = (visible?.offsetLeft ?? 0) + (visible?.width ?? innerWidth);
    const room = dialog.getBoundingClientRect();
    const inside = element => {
      const box = element.getBoundingClientRect();
      return box.top >= Math.max(room.top, viewportTop) && box.bottom <= Math.min(room.bottom, viewportBottom) &&
        box.left >= room.left && box.right <= Math.min(room.right, viewportRight) &&
        document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element;
    };
    const getPosition = element => element.getBoundingClientRect().top;
    const frame = [getPosition(header), getPosition(dock), getPosition(input), getPosition(send)];
    const initial = { dialogScroll: dialog.scrollTop, visible: inside(input) && inside(send) };
    thread.scrollTop = 0;
    thread.scrollTop = thread.scrollHeight;
    const canScroll = thread.scrollTop > 0;
    return {
      ...initial,
      canScroll,
      frameStaysPut: frame.every((top, index) => top === getPosition([header, dock, input, send][index])),
      dialogCanScroll: dialog.scrollHeight > dialog.clientHeight,
      visibleAfterScroll: inside(input) && inside(send),
      height: room.height,
      threadHeight: thread.clientHeight,
    };
  });
  const viewport = page.viewportSize();
  const label = `${viewport.width}×${viewport.height}`;
  assert.equal(result.visible, true, `${label} composer fully visible on open`);
  assert.equal(result.visibleAfterScroll, true, `${label} composer fully visible after scrolling`);
  assert.equal(result.dialogScroll, 0, `${label} dialog starts at rest`);
  assert.equal(result.dialogCanScroll, false, `${label} dialog fits its own content`);
  assert.equal(result.frameStaysPut, true, `${label} header and dock stay fixed`);
  assert.ok(result.threadHeight > 0, `${label} thread has space`);
  if (viewport.width > 600) {
    assert.ok(result.height <= Math.min(0.82 * viewport.height, 620) + 1, `${label} desktop max height`);
  }
  return result;
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const watch = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' ||
          (message.type() === 'warning' && /audio|autoplay/i.test(message.text()))) {
        errors.push(message.location().url + " " + message.text());
      }
    });
  };
  try {
    for (const [width, height] of VIEWPORTS) {
      const mobile = width < 800 || height < 500;
      const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      watch(page);
      if (width === 390) {
        await page.addInitScript(() => {
          window.AudioContext = class {
            state = 'suspended';
            resume() { return Promise.reject(new Error('Audio suspended')); }
            createOscillator() {
              window.audioAttemptedWhileSuspended = true;
              throw new Error('Audio suspended');
            }
          };
        });
      }
      await loadWelcome(page);
      await page.evaluate(() => document.fonts.ready);
      await assertWelcomeLayout(page);

      if (width === 1366 || width === 390) {
        const browse = page.getByRole('button', { name: 'Browse Showroom Myself' });
        if (mobile) await browse.tap();
        else await browse.click();
        assert.equal(await page.locator('#chatDialog').evaluate(dialog => dialog.open), false);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.YASHBI_3D?.engine?.ready);
        assert.equal(await page.locator('#chatDialog').evaluate(dialog => dialog.open), false);
        await page.getByRole('button', { name: 'Open Yashbi Stylist' }).click();
        await page.getByRole('dialog', { name: 'Alya — Yashbi Stylist' }).waitFor();
        assert.equal(await page.locator('#browseShowroom').isVisible(), false);
        await assertChatLayout(page);
        if (mobile) {
          await page.route('**/api/chat', route => route.fulfill({
            json: { reply: 'Try a sand suit.', recommendedSkus: [], actions: [] },
          }));
          await page.locator('#chatInput').fill('A summer wedding');
          await page.locator('#chatSend').tap();
          await page.getByText('Try a sand suit.', { exact: true }).waitFor();
          assert.equal(await page.evaluate(() => window.audioAttemptedWhileSuspended), undefined);
        }
      }
      if (width === 360) {
        await page.route('**/api/chat', route => route.fulfill({
          json: { reply: 'I can help with that.', recommendedSkus: [], actions: [], simulation: true },
        }));
        await page.locator('#chatInput').fill('An outfit for a garden party');
        await page.locator('#chatSend').tap();
        await page.getByRole('dialog', { name: 'Alya — Yashbi Stylist' }).waitFor();
        await page.getByText('I can help with that.', { exact: true }).waitFor();
      }
      if (width === 844) {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Open Yashbi Stylist' }).click();
        await assertChatLayout(page);
        await page.evaluate(() => {
          const visible = window.visualViewport;
          Object.defineProperties(visible, { height: { value: 174 }, offsetTop: { value: 20 } });
          visible.dispatchEvent(new Event('resize'));
        });
        await assertChatLayout(page);
      }
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    watch(page);
    await page.addInitScript(() => {
      window.audioProof = { contexts: 0, notes: [] };
      const NativeAudio = window.AudioContext;
      window.AudioContext = class extends NativeAudio {
        constructor() { super(); window.audioProof.contexts += 1; }
        createOscillator() {
          const note = super.createOscillator();
          const start = note.start.bind(note);
          note.start = when => {
            start(when);
            window.audioProof.notes.push({ frequency: note.frequency.value, state: this.state, when });
          };
          return note;
        }
      };
    });
    await loadWelcome(page);
    assert.equal(await page.evaluate(() => window.audioProof.contexts), 0, 'auto-open stays silent');
    await page.waitForFunction(() => window.YASHBI_3D?.engine?.ready);
    const before = await page.evaluate(() => YASHBI_3D.engine.camera.position.toArray());
    const reply = 'Try a sand suit and brown loafers.';
    await page.route('**/api/chat', route => route.fulfill({
      json: { reply, recommendedSkus: ['JP-001'], actions: [{ type: 'focusProduct', sku: 'JP-001', detailView: false }] },
    }));
    const request = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/api/chat'));
    await page.getByRole('button', { name: PROMPTS[0] }).click();
    assert.equal((await request).postDataJSON().message, PROMPTS[0]);
    await page.waitForFunction(initial => {
      const engine = YASHBI_3D.engine;
      const offset = Math.hypot(...engine.camera.position.toArray().map((value, i) => value - initial[i]));
      return engine.mode === 'focus' && engine.selectedProduct.id === 'JP-001' && offset > 0.2;
    }, before);
    assert.equal(await page.locator('#chatDialog').evaluate(dialog => dialog.open), false);
    await page.waitForFunction(() => window.audioProof.notes.length === 2);
    const { contexts, notes } = await page.evaluate(() => window.audioProof);
    assert.equal(contexts, 1);
    assert.deepEqual(notes.map(note => Math.round(note.frequency)), [659, 880]);
    assert.ok(notes.every(note => note.state === 'running') && notes[0].when < notes[1].when);
    await page.getByRole('button', { name: 'Open Yashbi Stylist' }).click();
    await page.getByRole('dialog', { name: 'Alya — Yashbi Stylist' }).waitFor();
    await page.locator('#chatMessages').getByText(reply, { exact: true }).waitFor();
    assert.equal(await page.locator('#browseShowroom').isVisible(), false);

    const longReply = 'A softly tailored suit goes well with brown loafers. '.repeat(32);
    await page.unroute('**/api/chat');
    await page.route('**/api/chat', route => route.fulfill({ json: {
      reply: longReply, recommendedSkus: [], actions: [], simulation: true,
    } }));
    await page.locator('#chatInput').fill('How would you style a sand suit?');
    await page.locator('#chatInput').press('Enter');
    await page.locator('#chatMessages .assistant').filter({ hasText: 'softly tailored' }).waitFor();
    assert.equal((await assertChatLayout(page)).canScroll, true, 'the active thread scrolls separately');

    assert.deepEqual(errors, []);
    console.log('PASS Atelier Welcome on eight viewports, one per session, browse and reload, live-shaped starter camera flight, retained thread, and gesture-gated chime.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
