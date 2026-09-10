import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { operations, type Arguments } from '../../contract';
import { restQuery, WEBSITE, type Fetch } from '../../rest-client';

export function createRestTools(options: { apiKey?: string; request?: Fetch } = {}) {
  return Object.fromEntries(operations.map(operation => [`fxmacrodata_rest_${operation.name}`, createTool({
    id: `fxmacrodata-rest-${operation.name}`, description: operation.description,
    inputSchema: z.fromJSONSchema(operation.input_schema as Parameters<typeof z.fromJSONSchema>[0]),
    outputSchema: z.object({ payload: z.unknown(), source: z.string(), receivedAt: z.string() }),
    execute: async (input, context) => ({
      payload: await restQuery(operation.name, input as Arguments, { ...options, signal: context?.abortSignal }),
      source: WEBSITE, receivedAt: new Date().toISOString(),
    }),
  })]));
}
