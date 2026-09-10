import { mastra, closeConnections } from './mastra';

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  try {
    if (query) {
      if (!process.env.MASTRA_MODEL) throw new Error('Set MASTRA_MODEL and its provider credentials to run the research agent.');
      const response = await mastra.getAgent('macroResearch').generate(query, { maxSteps: 8 });
      console.log(response.text);
    } else {
      const run = await mastra.getWorkflow('macroEvidence').createRun();
      const result = await run.start({ inputData: { currency: 'usd', indicator: 'policy_rate' } });
      if (result.status !== 'success') throw new Error('Research workflow could not complete.');
      console.log(JSON.stringify(result.result, null, 2));
    }
  } catch { console.error('Research unavailable. Check the requested parameters, connection and model configuration.'); process.exitCode = 1; }
  finally { await closeConnections(); }
}
void main();
