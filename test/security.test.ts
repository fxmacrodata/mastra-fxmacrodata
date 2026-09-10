import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { redactSecrets } from '../src/redaction';
import { restQuery, safeFetch, MCP_URL } from '../src/rest-client';
import { FXMacroDataConnection } from '../src/mastra/mcp/connection';

const key = 'synthetic-only +/=& marker';
const variants = [key, encodeURIComponent(key), new URLSearchParams({ key }).toString().slice(4)];
const payload = () => ({ data: [{ value: 0, market_consensus: null, source_url: 'https://example.org/release', notes: variants.join(' | '), api_key: 'other-synthetic-credential' }], diagnostics: `Authorization: Bearer unrelated-synthetic-token`, url: 'https://api.fxmacrodata.com/v1/ping?api_key=other-synthetic-credential&limit=2' });
function safe(value: unknown) {
  const text = JSON.stringify(value);
  for (const value of [...variants, 'other-synthetic-credential', 'unrelated-synthetic-token']) assert.ok(!text.includes(value));
  assert.ok(text.includes('[redacted]'));
}

test('redaction preserves non-enumerable native MCP content and source fields', () => {
  const metadata = Symbol.for('mastra.mcp.callToolContent');
  const original = payload(); Object.defineProperty(original, metadata, { value: [{ type: 'text', text: key }] });
  const result = redactSecrets(original, key);
  safe(result); assert.equal(result.data[0]!.value, 0); assert.equal(result.data[0]!.source_url, 'https://example.org/release');
  assert.equal((result as any)[metadata][0].text, '[redacted]');
  assert.equal(Object.getOwnPropertyDescriptor(result, metadata)!.enumerable, false);
  assert.ok(original.data[0]!.notes.includes(key));
});

test('REST JSON and bounded SSE outputs redact raw, encoded and field-based credentials', async () => {
  safe(await restQuery('ping', {}, { apiKey: key, request: async () => Response.json(payload()) }));
  safe(await restQuery('stream_events', { max_events: 1, max_seconds: 1 }, { apiKey: key, request: async () => new Response(`id: ${key}\ndata: ${JSON.stringify(payload())}\n\n`) }));
});

test('MCP response errors and chunk-split SSE frames are safe before native SDK logging', async () => {
  const response = await safeFetch(key, async () => Response.json({ jsonrpc: '2.0', id: 1, error: { code: -32603, message: JSON.stringify(payload()) } }))(MCP_URL);
  safe(await response.json()); assert.equal(response.url, '');
  const text = `id: 7\r\nevent: message\r\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: payload() })}\r\n\r\n`;
  const stream = new ReadableStream<Uint8Array>({ start(controller) {
    for (const character of text) controller.enqueue(new TextEncoder().encode(character)); controller.close();
  } });
  const event = await safeFetch(key, async () => new Response(stream, { headers: { 'content-type': 'text/event-stream' } }))(MCP_URL);
  const result = await event.text(); safe(result); assert.match(result, /id: 7/); assert.match(result, /event: message/);
});

test('connection credentials are absent from JSON serialization and inspection', () => {
  const connection = new FXMacroDataConnection(key);
  assert.equal(JSON.stringify(connection), '{}'); assert.ok(!inspect(connection, { showHidden: true }).includes(key));
  assert.deepEqual(Reflect.ownKeys(connection), []);
});

test('actual native MCP tools sanitize structured results and retained content metadata', async () => {
  const connection = new FXMacroDataConnection(key, async (input, init) => {
    assert.equal(new URL(String(input)).searchParams.get('api_key'), key);
    if (init?.method !== 'POST') return new Response(null, { status: 204 });
    const body = JSON.parse(String(init.body));
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    const result = body.method === 'initialize' ? { protocolVersion: body.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'synthetic-test', version: '1' } }
      : body.method === 'tools/list' ? { tools: [{ name: 'ping', description: 'Synthetic test', inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object' } }] }
      : { content: [{ type: 'text', text: JSON.stringify(payload()) }], structuredContent: payload() };
    return Response.json({ jsonrpc: '2.0', id: body.id, result });
  });
  try {
    const tools = await connection.tools(); const tool = Object.values(tools)[0]!;
    const result = await tool.execute!({}, undefined as never);
    safe(result); const metadata = (result as any)[Symbol.for('mastra.mcp.callToolContent')];
    assert.ok(metadata); safe(metadata);
    assert.ok(!JSON.stringify(connection).includes(key));
  } finally { await connection.close(); }
});

test('native connection factory exceptions cannot expose credentials', async () => {
  const connection = new FXMacroDataConnection(key, fetch, () => { throw new Error(key); });
  await assert.rejects(connection.tools(), error => error instanceof Error && !error.message.includes(key) && !error.cause);
});
