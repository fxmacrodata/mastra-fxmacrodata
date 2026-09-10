import test from 'node:test';
import assert from 'node:assert/strict';
import { Mastra } from '@mastra/core/mastra';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createFXMacroDataQueryWorkflow, createFXMacroDataCatalogueWorkflow } from '../index';
import { operationCatalogue } from '../src/mastra/workflows/fxmacrodata-query';
import { remoteTools, type Schema } from '../src/contract';
import type { NativeTools } from '../src/mastra/mcp/connection';

function fixture(schema: Schema, name: string): unknown {
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf) return fixture(schema.anyOf.find(item => item.type !== 'null')!, name);
  if (schema.default !== undefined && schema.default !== null) return schema.default;
  if (schema.type === 'number' || schema.type === 'integer') return Number(schema.minimum ?? 1);
  if (schema.type === 'boolean') return false;
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return {};
  return ({ currency: 'usd', base: 'eur', quote: 'usd', indicator: 'policy_rate', positions_json: '[]' } as Record<string, string>)[name] ?? 'fixture';
}

test('default Studio registration includes all-operation query and catalogue without a model', async () => {
  const { mastra, closeConnections } = await import('../src/mastra');
  try {
    assert.ok(mastra.getWorkflow('fxmacrodataQuery'));
    const run = await mastra.getWorkflow('fxmacrodataCatalogue').createRun();
    const result = await run.start({ inputData: {} });
    assert.equal(result.status, 'success');
    if (result.status === 'success') {
      assert.equal(result.result.operations.length, 72);
      assert.ok(result.result.operations.every(operation => !('api_key' in ((operation.inputSchema as Schema).properties ?? {}))));
      assert.match(result.result.source, /^https:\/\/fxmacrodata\.com\//);
    }
  } finally { await closeConnections(); }
});

for (const entry of operationCatalogue) {
  test(`native query workflow executes ${entry.operation}`, async () => {
    const nativeTools: NativeTools = Object.fromEntries(remoteTools.map(tool => [
      `fxmacrodata_${tool.name}`,
      createTool({ id: tool.name, description: tool.description ?? tool.name,
        inputSchema: z.fromJSONSchema(tool.inputSchema as Parameters<typeof z.fromJSONSchema>[0]),
        execute: async () => ({ content: [{ type: 'text', text: 'synthetic transport fixture' }], structuredContent: { tool: tool.name, data: [] } }),
      }),
    ]));
    let restCalls = 0; let mcpCalls = 0;
    const workflow = createFXMacroDataQueryWorkflow({
      connection: { tools: async () => { mcpCalls++; return nativeTools; } },
      request: async input => {
        restCalls++;
        assert.equal(new URL(String(input)).origin, 'https://api.fxmacrodata.com');
        if (entry.operation === 'stream_events') return new Response('id: fixture\ndata: {"fixture":true}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
        return Response.json({ data: [], metadata: { fixture: true, unit: 'synthetic-unit' } });
      },
    });
    const mastra = new Mastra({ workflows: { query: workflow }, logger: false });
    const args = Object.fromEntries((entry.inputSchema.required ?? []).map(name => [name, fixture(entry.inputSchema.properties![name]!, name)]));
    const result = await (await mastra.getWorkflow('query').createRun()).start({ inputData: { operation: entry.operation, arguments: args } });
    assert.equal(result.status, 'success');
    if (result.status === 'success') {
      assert.equal(result.result.operation, entry.operation);
      assert.equal(result.result.transport, entry.transport);
      assert.ok(result.result.payload);
      assert.match(result.result.source, /^https:\/\/fxmacrodata\.com\//);
    }
    assert.equal(restCalls, entry.transport === 'rest' ? 1 : 0);
    assert.equal(mcpCalls, entry.transport === 'mcp' ? 1 : 0);
  });
}

test('query workflow rejects credentials as arguments before either transport', async () => {
  const workflow = createFXMacroDataQueryWorkflow({
    connection: { tools: async () => { assert.fail('No discovery request expected'); } },
    request: async () => { assert.fail('No HTTP request expected'); },
  });
  const mastra = new Mastra({ workflows: { query: workflow, catalogue: createFXMacroDataCatalogueWorkflow() }, logger: false });
  const result = await (await mastra.getWorkflow('query').createRun()).start({ inputData: { operation: 'ping', arguments: { api_key: 'synthetic-secret' } } });
  assert.equal(result.status, 'failed');
  if (result.status === 'failed') assert.doesNotMatch(String(result.error), /synthetic-secret/);
});
