import test from 'node:test';
import assert from 'node:assert/strict';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { FXMacroDataConnection, type NativeTools } from '../src/mastra/mcp/connection';
import { createRestTools } from '../src/mastra/tools/rest-tools';
import { createMacroEvidenceWorkflow } from '../src/mastra/workflows/macro-evidence';
import { createMacroAgent } from '../src/mastra/agents/macro-agent';
import { remoteTools } from '../src/contract';
import { restQuery, safeFetch } from '../src/rest-client';

test('native MCP discovery retains every advertised tool and closes once', async () => {
  let closed = 0; let created = 0;
  const tools: NativeTools = Object.fromEntries(remoteTools.map(tool => [tool.name, createTool({ id: tool.name, description: tool.description ?? tool.name, inputSchema: z.object({}), execute: async () => ({ result: [] }) })]));
  const connection = new FXMacroDataConnection(undefined, fetch, options => {
    created++; assert.equal(String(options.servers.fxmacrodata!.url), 'https://mcp.fxmacrodata.com/mcp');
    return { listTools: async () => tools, disconnect: async () => { closed++; } };
  });
  assert.equal(Object.keys(await connection.tools()).length, 49);
  assert.equal(await connection.tools(), tools); assert.equal(created, 1);
  const agent = createMacroAgent('openai/gpt-5-mini', connection);
  assert.equal(agent.name, 'Macro Research');
  await connection.close(); await connection.close(); assert.equal(closed, 1);
});

test('tool discovery failures are sanitized and close the native connection', async () => {
  let closed = 0;
  const connection = new FXMacroDataConnection('test-only-marker', fetch, () => ({
    listTools: async () => { throw new Error('api_key=test-only-marker'); }, disconnect: async () => { closed++; },
  }));
  await assert.rejects(connection.tools(), error => error instanceof Error && !error.message.includes('test-only-marker'));
  assert.equal(closed, 1);
});

test('all 23 REST tools carry native schemas and execute preserved typed outputs', async () => {
  const tools = createRestTools({ request: async () => Response.json({ data: [{ value: 0, announcement_datetime: '2026-09-10T12:30:00Z' }] }) });
  assert.equal(Object.keys(tools).length, 23);
  const tool = tools.fxmacrodata_rest_indicator_history!;
  assert.ok(tool.inputSchema); assert.ok(tool.outputSchema);
  const result = await tool.execute!({ currency: 'usd', indicator: 'policy_rate' }, undefined as never);
  assert.ok(result && 'payload' in result);
  assert.deepEqual(result.payload, { data: [{ value: 0, announcement_datetime: '2026-09-10T12:30:00Z' }] });
  assert.match(result.source, /utm_source=mastra/);
});

test('real Mastra workflow executes an evidence pack without an LLM', async () => {
  const requested: string[] = [];
  const workflow = createMacroEvidenceWorkflow({ request: async input => {
    requested.push(new URL(String(input)).pathname);
    return Response.json({ data: [], source_url: 'https://example.org/release' });
  } });
  const mastra = new Mastra({ workflows: { macroEvidence: workflow }, logger: false });
  const run = await mastra.getWorkflow('macroEvidence').createRun();
  const result = await run.start({ inputData: { currency: 'usd', indicator: 'policy_rate' } });
  assert.equal(result.status, 'success');
  if (result.status === 'success') { assert.equal(result.result.evidence.length, 3); assert.ok(result.result.evidence.every(item => item.status === 'available')); }
  assert.equal(requested.length, 3);
});

test('partial data failure stays explicit in native workflow output', async () => {
  const workflow = createMacroEvidenceWorkflow({ request: async input => String(input).includes('/calendar/') ? new Response('', { status: 403 }) : Response.json({ data: [] }) });
  const mastra = new Mastra({ workflows: { macroEvidence: workflow }, logger: false });
  const result = await (await mastra.getWorkflow('macroEvidence').createRun()).start({ inputData: { currency: 'usd', indicator: 'policy_rate' } });
  assert.equal(result.status, 'success');
  if (result.status === 'success') assert.equal(result.result.evidence.find(item => item.operation === 'release_calendar')?.status, 'unavailable');
});

test('credentials are private to transport, cannot redirect, and cannot enter errors', async () => {
  await restQuery('ping', {}, { apiKey: 'test-only-marker', request: async (input, init) => {
    assert.equal(new URL(String(input)).searchParams.get('api_key'), 'test-only-marker'); assert.equal(init?.redirect, 'error'); return Response.json({ ok: true });
  } });
  await assert.rejects(safeFetch('test-only-marker')('https://example.org/'), /Unsupported/);
  await assert.rejects(restQuery('ping', {}, { request: async () => { throw new Error('api_key=test-only-marker'); } }), error => error instanceof Error && !error.message.includes('test-only-marker'));
});
