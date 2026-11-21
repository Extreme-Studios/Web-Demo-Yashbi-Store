const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

async function run() {
  const { default: handler } = await import(pathToFileURL(require.resolve('../api/chat.js')).href);
  const { clientIp, createChatLimiter } = require('../server/chat-rate-limit.cjs');
  let time = 0;
  const limit = createChatLimiter({ now: () => time, limit: 2, windowMs: 60000 });
  assert.equal(limit('a'), 0);
  time = 40000;
  assert.equal(limit('a'), 0);
  assert.equal(limit('a'), 20);
  assert.equal(limit('b'), 0);
  time = 60000;
  assert.equal(limit('a'), 0);
  assert.equal(limit('a'), 40);
  assert.equal(clientIp({ headers: { 'x-vercel-forwarded-for': '203.0.113.5', 'x-forwarded-for': '192.0.2.3' } }, true), '203.0.113.5');
  assert.equal(clientIp({ headers: { 'x-vercel-forwarded-for': '192.0.2.3' }, socket: { remoteAddress: '::ffff:127.0.0.1' } }, false), '127.0.0.1');
  assert.equal(clientIp({ headers: { 'x-vercel-forwarded-for': '203.0.113.1, 192.0.2.3' } }, true), 'unknown');
  const invoke = async (body, method = 'POST', ip = '198.51.100.21') => {
    const response = { status(n) { this.code = n; return this; }, json(data) { this.body = data; }, headers: {}, setHeader(k, v) { this.headers[k] = v; } };
    await handler({ method, body, headers: { 'x-vercel-forwarded-for': ip }, socket: { remoteAddress: ip } }, response);
    return response;
  };
  const catalog = [{ id: 'JP-001', name: 'Alden Sand Tailored Suit' }, { id: 'SP-002', name: 'Bromley Black Derby' }];
  const originalFetch = global.fetch;
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  try {
    process.env.GEMINI_API_KEY = 'fixture-key';
    const request = { catalog, message: 'Can you show the fabric?', history: [
      ...Array.from({ length: 4 }, (_,i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: 'Old message ' + i })),
      { role: 'system', content: 'Invalid role' },
      { role: 'user', content: 'Wedding. Rp 3 million.\u0000 Size M.' },
      { role: 'assistant', content: 'Try a sand suit and black shoes.' },
    ] };
    const calls = [];
    process.env.GEMINI_MODEL = 'custom-model';
    global.fetch = async (url, options) => {
      calls.push({ url, headers: options.headers, body: JSON.parse(options.body) });
      if (calls.length === 1) return Response.json({ error: { message: 'This model is not supported for generateContent.' } }, { status: 400 });
      const data = { reply: 'Here is the suit fabric.', recommendedSkus: ['jp-001', 'SP-999', 'JP-001', 'SP-002'],
        actions: [
          { type: 'placeOrder', sku: 'JP-001' },
          { type: 'focusProduct', sku: 'SP-999', detailView: true },
          { type: 'focusProduct', sku: 'JP-001', detailView: true },
          { type: 'focusProduct', sku: 'SP-002', detailView: true },
        ] };
      const fenced = '\x60\x60\x60json\n' + JSON.stringify(data) + '\n\x60\x60\x60';
      return Response.json({ candidates: [{ content: { parts: [{ text: 'thought', thought: true }, { text: fenced }] } }] });
    };
    const result = await invoke(request);
    assert.equal(result.code, 200);
    assert.deepEqual(result.body, { reply: 'Here is the suit fabric.', recommendedSkus: ['JP-001', 'SP-002'],
      actions: [{ type: 'focusProduct', sku: 'JP-001', detailView: true }, { type: 'focusProduct', sku: 'SP-002', detailView: false }] });
    assert.match(calls[0].url, /custom-model:generateContent$/);
    assert.match(calls[1].url, /gemini-2\.5-flash:generateContent$/);
    assert.equal(calls[0].headers['x-goog-api-key'], calls[1].headers['x-goog-api-key']);
    const sent = calls[1].body;
    assert.equal(sent.generationConfig.responseMimeType, 'application/json');
    assert.deepEqual(sent.generationConfig.responseJsonSchema.required, ['reply', 'recommendedSkus', 'actions']);
    assert.deepEqual(sent.contents.slice(-3).map(turn => [turn.role, turn.parts[0].text]), [
      ['user', 'Wedding. Rp 3 million. Size M.'], ['model', 'Try a sand suit and black shoes.'], ['user', request.message],
    ]);
    assert.ok(!JSON.stringify(sent.contents).includes('Invalid role'));
    delete process.env.GEMINI_MODEL;
    let attempts = 0;
    global.fetch = async (url, options) => {
      attempts++;
      assert.match(url, /gemini-3\.1-flash-lite:generateContent$/);
      const contents = JSON.parse(options.body).contents;
      assert.equal(contents.length, 9);
      assert.equal(contents[0].parts[0].text, 'Turn 4');
      return Response.json({ candidates: [{ content: { parts: [{ text: 'What shoe size do you wear?' }] } }] });
    };
    const longHistory = Array.from({ length: 12 }, (_,i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: 'Turn ' + i }));
    const plain = await invoke({ ...request, history: longHistory });
    assert.deepEqual(plain.body, { reply: 'What shoe size do you wear?', recommendedSkus: [], actions: [] });
    assert.equal(attempts, 1);
    global.fetch = async () => {
      attempts++;
      return Response.json({ error: { status: 'RESOURCE_EXHAUSTED' } }, { status: 429 });
    };
    assert.equal((await invoke(request)).code, 502);
    assert.equal(attempts, 2, 'Quota errors must not trigger the model fallback');
    assert.equal((await invoke({ message: 'x'.repeat(801) })).code, 400);
    assert.equal((await invoke(request, 'GET')).code, 405);
    global.fetch = async () => { attempts++; return Response.json({ candidates: [{ content: { parts: [{ text: 'A sample reply.' }] } }] }); };
    for (let i = 0; i < 8; i++) assert.equal((await invoke(request, 'POST', '198.51.100.22')).code, 200);
    const beforeLimit = attempts;
    const throttled = await invoke(request, 'POST', '198.51.100.22');
    assert.equal(throttled.code, 429);
    assert.equal(throttled.body.code, 'RATE_LIMITED');
    assert.ok(Number(throttled.headers['Retry-After']) > 0);
    assert.equal(attempts, beforeLimit);
    assert.equal((await invoke(request, 'POST', '198.51.100.23')).code, 200);
    delete process.env.GEMINI_API_KEY;
    assert.equal((await invoke(request)).code, 503);
    console.log('Stylist API: history and bounds, model override and fallback, structured output, action allowlist, text fallback, per-IP rolling quota, Retry-After, and error responses passed.');
  } finally {
    global.fetch = originalFetch;
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (model === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = model;
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
