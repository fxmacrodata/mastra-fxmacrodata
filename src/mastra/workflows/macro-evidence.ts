import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { restQuery, WEBSITE, type Fetch } from '../../rest-client';

const inputSchema = z.object({
  currency: z.string().default('usd'), indicator: z.string().min(1),
  start_date: z.string().optional(), end_date: z.string().optional(),
});
const evidenceSchema = z.object({
  currency: z.string(), indicator: z.string(), source: z.string(), receivedAt: z.string(),
  evidence: z.array(z.object({ operation: z.string(), status: z.enum(['available', 'unavailable']), payload: z.unknown().optional(), message: z.string().optional() })),
});

/** Deterministic research evidence workflow; no model or model API key needed. */
export function createMacroEvidenceWorkflow(options: { apiKey?: string; request?: Fetch } = {}) {
  const gather = createStep({
    id: 'gather-macro-evidence', description: 'Fetch catalogue, indicator history and release calendar with original payloads.',
    inputSchema, outputSchema: evidenceSchema,
    execute: async ({ inputData, abortSignal }) => {
      const { currency, indicator, start_date, end_date } = inputData;
      const window = { ...(start_date ? { start_date } : {}), ...(end_date ? { end_date } : {}) };
      const requests = [
        { operation: 'data_catalogue', args: { currency, indicator } },
        { operation: 'indicator_history', args: { currency, indicator, ...window, limit: 100 } },
        { operation: 'release_calendar', args: { currency, indicator, ...window } },
      ];
      const evidence = await Promise.all(requests.map(async request => {
        try { return { operation: request.operation, status: 'available' as const, payload: await restQuery(request.operation, request.args, { ...options, signal: abortSignal }) }; }
        catch { return { operation: request.operation, status: 'unavailable' as const, message: 'Data unavailable for this request. Check the window, indicator and optional access.' }; }
      }));
      return { currency, indicator, source: WEBSITE, receivedAt: new Date().toISOString(), evidence };
    },
  });
  return createWorkflow({ id: 'macro-evidence', inputSchema, outputSchema: evidenceSchema }).then(gather).commit();
}
