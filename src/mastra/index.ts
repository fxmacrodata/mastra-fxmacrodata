import { Mastra } from '@mastra/core/mastra';
import { FXMacroDataConnection } from './mcp/connection';
import { createMacroAgent } from './agents/macro-agent';
import { createMacroEvidenceWorkflow } from './workflows/macro-evidence';
import { createFXMacroDataQueryWorkflow, createFXMacroDataCatalogueWorkflow } from './workflows/fxmacrodata-query';

const apiKey = process.env.FXMACRODATA_API_KEY;
export const connection = new FXMacroDataConnection(apiKey);
const model = process.env.MASTRA_MODEL;
const agents: Record<string, ReturnType<typeof createMacroAgent>> = {};
if (model) agents.macroResearch = createMacroAgent(model as Parameters<typeof createMacroAgent>[0], connection, apiKey);
export const mastra = new Mastra({
  agents,
  workflows: {
    macroEvidence: createMacroEvidenceWorkflow({ apiKey }),
    fxmacrodataQuery: createFXMacroDataQueryWorkflow({ connection, apiKey }),
    fxmacrodataCatalogue: createFXMacroDataCatalogueWorkflow(),
  },
  logger: false,
});

export async function closeConnections() { await connection.close(); }
process.once('SIGINT', () => { void closeConnections(); });
process.once('SIGTERM', () => { void closeConnections(); });
