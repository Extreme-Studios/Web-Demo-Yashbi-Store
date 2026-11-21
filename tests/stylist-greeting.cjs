const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = 'http://127.0.0.1:4173';
const GREETING = 'Hi! Welcome to Yashbi Store. Need help finding an outfit? Tell me the occasion or budget.';
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
    assert.equal(await desktop.locator('#stylistGreeting strong').innerText(), 'Yashbi Stylist \u00b7 Online');
    assert.equal(await desktop.locator('#stylistGreetingOpen span').innerText(), GREETING);
    assert.equal(await desktop.locator('#stylistUnread').innerText(), '1');
    assert.equal(await desktop.locator('#stylistUnread').isVisible(), true);
    assert.equal(await desktop.evaluate(() => window.audioProof.contexts), 0);
    assert.equal(await desktop.evaluate(key => sessionStorage.getItem(key), SESSION_KEY), '1');
    await assertAnchored(desktop);

    await desktop.locator('#stylistGreetingOpen').click();
    await desktop.locator('#chatDialog[open]').waitFor();
    assert.equal(await desktop.locator('#stylistGreeting').isVisible(), false);
    assert.equal(await desktop.locator('#stylistUnread').isVisible(), false);
    assert.equal(await desktop.locator('#chatInput').evaluate(node => document.activeElement === node), true);
    assert.deepEqual(await desktop.evaluate(() => window.audioProof.notes), []);

    // A successful response with the live API shape, isolated from network and quota.
    await desktop.route('**/api/chat', route => route.fulfill({ json: { reply: REPLY, recommendedSkus: [], actions: [] } }));
    await desktop.locator('#stylistStarters button').first().click();
    await desktop.locator('#chatMessages').getByText(REPLY, { exact: true }).waitFor();
    await desktop.waitForFunction(() => window.audioProof.notes.length === 2);
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
    await mobile.locator('#chatInput').fill('A summer wedding');
    await mobile.locator('#chatSend').tap();
    await mobile.locator('#chatMessages').getByText(REPLY, { exact: true }).waitFor();
    assert.equal(await mobile.evaluate(() => window.audioAttemptedWhileSuspended), undefined);

    assert.deepEqual(errors, []);
    console.log('PASS stylist greeting, session deduplication, desktop opening, touch dismissal, two-note audio, and suspended audio.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
