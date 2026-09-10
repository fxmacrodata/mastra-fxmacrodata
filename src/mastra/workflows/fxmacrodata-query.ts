import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { operations, remoteTools, validateArguments } from '../../contract';
import { PublicRequestError, restQuery, WEBSITE, type Fetch } from '../../rest-client';
import type { FXMacroDataConnection } from '../mcp/connection';

export const operationCatalogue = [
  ...operations.map(operation => ({ operation: operation.name, transport: 'rest' as const, description: operation.description, inputSchema: operation.input_schema })),
  ...remoteTools.map(tool => ({ operation: `mcp_${tool.name}`, transport: 'mcp' as const, description: tool.description ?? tool.name, inputSchema: tool.inputSchema })),
];

const names = operationCatalogue.map(item => item.operation) as [string, ...string[]];
const inputSchema = z.object({
  operation: z.enum(names).describe('Choose a REST operation or mcp_ tool. The catalogue workflow provides its input schema.'),
  arguments: z.record(z.string(), z.unknown()).default({}).describe('Named operation parameters; credentials belong to the connection settings.'),
});
const outputSchema = z.object({
  operation: z.string(), transport: z.enum(['rest', 'mcp']), payload: z.unknown(),
  source: z.string(), receivedAt: z.string(),
});

/** Reusable native workflow: every public operation can run without an LLM. */
export function createFXMacroDataQueryWorkflow(options: {
  connection: Pick<FXMacroDataConnection, 'tools'>; apiKey?: string; request?: Fetch;
}) {
  const query = createStep({
    id: 'query-fxmacrodata', description: 'Execute a selected FXMacroData operation and preserve its public response.',
    inputSchema, outputSchema,
    execute: async ({ inputData, abortSignal }) => {
      try {
        const entry = operationCatalogue.find(item => item.operation === inputData.operation);
        if (!entry) throw new PublicRequestError('Unknown operation.');
        const args = validateArguments(entry.inputSchema, inputData.arguments);
        let payload: unknown;
        if (entry.transport === 'rest') {
          payload = await restQuery(entry.operation, args, { ...options, signal: abortSignal });
        } else {
          const tools = await options.connection.tools();
          // MCPClient.listTools uses its documented serverName_toolName namespace.
          const tool = tools[`fxmacrodata_${entry.operation.slice(4)}`];
          if (!tool?.execute) throw new PublicRequestError('Requested tool is unavailable.');
          payload = await tool.execute(args, { abortSignal } as Parameters<NonNullable<typeof tool.execute>>[1]);
        }
        return { operation: entry.operation, transport: entry.transport, payload, source: WEBSITE, receivedAt: new Date().toISOString() };
      } catch {
        throw new PublicRequestError('FXMacroData operation unavailable. Check its input schema, connection and optional access.');
      }
    },
  });
  return createWorkflow({ id: 'fxmacrodata-query', inputSchema, outputSchema }).then(query).commit();
}

/** Native catalogue workflow exposes all names and schemas directly in Studio. */
export function createFXMacroDataCatalogueWorkflow() {
  const inputSchema = z.object({});
  const outputSchema = z.object({
    operations: z.array(z.object({ operation: z.string(), transport: z.enum(['rest', 'mcp']), description: z.string(), inputSchema: z.unknown() })),
    source: z.string(),
  });
  const list = createStep({
    id: 'list-fxmacrodata-operations', description: 'Discover all supported operation names and input schemas.',
    inputSchema, outputSchema,
    execute: async () => ({ operations: structuredClone(operationCatalogue), source: WEBSITE }),
  });
  return createWorkflow({ id: 'fxmacrodata-catalogue', inputSchema, outputSchema }).then(list).commit();
}
