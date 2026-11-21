const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = 'http://127.0.0.1:4173';
const GREETING = "Hi there! I'm Alya, your personal stylist. Looking for something special today? Tap here and I'll walk you through the showroom.";
const OPENING = "Welcome to Yashbi Store! I'm Alya. Tell me what event you're dressing for—or just your vibe and rough budget—and I'll bring the best pieces right in front of you in 3D.";
const REPLY = 'Try a sand suit and brown loafers.';
const SESSION_KEY = 'yashbi-stylist-greeting-seen';

async function load(page, seen = false) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.YASHBI_3D?.engine?.ready);
  const greeting = page.locator('#stylistGreeting');
  if (seen) {
    // Check past the full notification window after the engine reported ready.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));
    assert.equal(await greeting.isVisible(), false);
    assert.equal(await page.locator('#stylistUnread').isVisible(), false);
  } else {
    await greeting.waitFor({ state: 'visible' });
  }
}

async function assertAnchored(page) {
  const greeting = await page.locator('#stylistGreeting').boundingBox();
  const launcher = await page.locator('#chatOpen').boundingBox();
  assert.ok(greeting.y + greeting.height <= launcher.y);
  assert.ok(greeting.x >= 0 && greeting.x + greeting.width <= page.viewportSize().width);
  const hud = await page.locator('.product-hud').boundingBox();
  assert.ok(greeting.x >= hud.x + hud.width || greeting.x + greeting.width <= hud.x ||
    greeting.y >= hud.y + hud.height || greeting.y + greeting.height <= hud.y);
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
        errors.push(message.text());
      }
    });
  };
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    watch(desktop);
    await desktop.addInitScript(() => {
      window.audioProof = { contexts: 0, notes: [] };
      const NativeAudio = window.AudioContext;
      window.AudioContext = class extends NativeAudio {
        constructor() {
          super();
          window.audioProof.contexts += 1;
        }
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
    await load(desktop);
    assert.equal(await desktop.locator('#stylistGreeting strong').innerText(), 'Alya — Yashbi Stylist');
    assert.equal(await desktop.locator('#stylistGreetingOpen .stylist-greeting-copy').innerText(), GREETING);
    assert.equal(await desktop.locator('#stylistUnread').innerText(), '1');
    assert.equal(await desktop.locator('#stylistUnread').isVisible(), true);
    assert.equal(await desktop.evaluate(() => window.audioProof.contexts), 0);
    assert.equal(await desktop.evaluate(key => sessionStorage.getItem(key), SESSION_KEY), '1');
    await assertAnchored(desktop);

    await desktop.locator('#stylistGreetingOpen').click();
    await desktop.locator('#chatDialog[open]').waitFor();
    assert.equal(await desktop.locator('#chatDialogTitle').innerText(), 'Alya — Yashbi Stylist');
    assert.equal(await desktop.locator('#chatStatus').innerText(), 'Personal Showroom Stylist · Online');
    assert.equal(await desktop.locator('#chatMessages .assistant').first().innerText(), OPENING);
    assert.equal(await desktop.locator('#chatDialog .stylist-avatar').innerText(), 'A');
    assert.deepEqual(await desktop.locator('#stylistStarters button').allTextContents(), [
      'Style a wedding look with a sand suit',
      'Find an evening dress under Rp 2M',
      'Show me the fabric close-up',
    ]);
    await assertChatLayout(desktop);

    assert.equal(await desktop.locator('#stylistGreeting').isVisible(), false);
    assert.equal(await desktop.locator('#stylistUnread').isVisible(), false);
    assert.equal(await desktop.locator('#chatInput').evaluate(node => document.activeElement === node), true);
    assert.deepEqual(await desktop.evaluate(() => window.audioProof.notes), []);

    // A successful response with the live API shape, isolated from network and quota.
    await desktop.route('**/api/chat', route => route.fulfill({ json: { reply: REPLY, recommendedSkus: [], actions: [] } }));
    await desktop.locator('#stylistStarters button').first().click();
    await desktop.locator('#chatMessages').getByText(REPLY, { exact: true }).waitFor();
    await desktop.waitForFunction(() => window.audioProof.notes.length === 2);
    await assertChatLayout(desktop);
    const { contexts, notes } = await desktop.evaluate(() => window.audioProof);
    assert.equal(contexts, 1);
    assert.deepEqual(notes.map(note => Math.round(note.frequency)), [659, 880]);
    assert.ok(notes.every(note => note.state === 'running') && notes[0].when < notes[1].when);
    await desktop.keyboard.press('Escape');
    assert.equal(await desktop.locator('#chatOpen').evaluate(node => document.activeElement === node), true);
    await load(desktop, true);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    watch(mobile);
    await mobile.addInitScript(() => {
      window.AudioContext = class {
        state = 'suspended';
        resume() { return Promise.reject(new Error('Audio suspended')); }
        createOscillator() {
          window.audioAttemptedWhileSuspended = true;
          throw new Error('Audio suspended');
        }
      };
    });
    await load(mobile);
    await assertAnchored(mobile);
    await mobile.locator('#stylistGreetingDismiss').tap();
    assert.equal(await mobile.locator('#chatDialog').evaluate(node => node.open), false);
    assert.equal(await mobile.locator('#stylistGreeting').isVisible(), false);
    assert.equal(await mobile.locator('#stylistUnread').isVisible(), false);
    await load(mobile, true);
    await mobile.route('**/api/chat', route => route.fulfill({ json: { reply: REPLY, recommendedSkus: [], actions: [] } }));
    await mobile.locator('#chatOpen').tap();
    await assertChatLayout(mobile);
    await mobile.locator('#chatInput').fill('A summer wedding');
    await mobile.locator('#chatSend').tap();
    await mobile.locator('#chatMessages').getByText(REPLY, { exact: true }).waitFor();
    assert.equal(await mobile.evaluate(() => window.audioAttemptedWhileSuspended), undefined);

    await mobile.close();

    for (const viewport of [{ width: 1366, height: 768 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      watch(page);
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.locator('#chatOpen').click();
      await assertChatLayout(page);

      const longReply = Array.from({ length: 28 }, (_, index) => `Look ${index + 1}. A softly tailored suit goes well with brown loafers.`).join('\n');
      await page.route('**/api/chat', route => route.fulfill({
        json: { reply: longReply, recommendedSkus: [], actions: [], simulation: true },
      }));
      await page.locator('#chatInput').fill('How would you style a sand suit?');
      await page.locator('#chatInput').press('Enter');
      await page.locator('#chatMessages .assistant').filter({ hasText: 'Look 28.' }).waitFor();
      const afterReply = await assertChatLayout(page);
      assert.equal(afterReply.canScroll, true, 'A long thread scrolls independently of the header and composer');
      if (viewport.height === 390) {
        // Model the visual viewport shrinking and panning when a soft keyboard opens.
        await page.evaluate(() => {
          const visible = window.visualViewport;
          Object.defineProperties(visible, { height: { value: 174 }, offsetTop: { value: 20 } });
          visible.dispatchEvent(new Event('resize'));
        });
        await assertChatLayout(page);
      }
      await page.close();
    }

    assert.deepEqual(errors, []);
    console.log('PASS stylist greeting, session deduplication, fixed composer, desktop and mobile layout, touch dismissal, two-note audio, and suspended audio.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
