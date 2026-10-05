# FXMacroData for Mastra

Build Mastra research agents and evidence workflows with [FXMacroData](https://fxmacrodata.com/?utm_source=github&utm_medium=referral&utm_campaign=mastra-fxmacrodata&utm_content=readme), combining official macroeconomic history, release calendars and sourced market context.

[Subscribe to FXMacroData](https://fxmacrodata.com/subscribe?utm_source=github&utm_medium=referral&utm_campaign=mastra-fxmacrodata&utm_content=subscribe) for non-USD data, full available history, FX, commodities and positioning. Use the public USD workflow to evaluate the integration before connecting your subscription.

The public USD catalogue, recent macro history and release calendar support evaluation without an FXMacroData API key.

## Start with evidence

Requires Node.js 22.13 or newer.

```sh
npm ci --ignore-scripts
npm run research
```

The default command runs the native `macro-evidence` workflow for USD policy rates. It fetches catalogue context, release history and calendar data, preserving every endpoint payload and marking individual unavailable requests. It does not call an LLM and needs no model-provider credential.

Run `npm run dev` to use the workflow in Mastra Studio. Its input accepts `currency`, `indicator`, `start_date` and `end_date`. Indicator slugs come from the catalogue. Empty windows stay empty; the workflow never fabricates a next release date.

## Query every operation in Studio

The default Mastra registration also includes **fxmacrodataCatalogue** and **fxmacrodataQuery**. These are native workflows and need no model-provider key. Run the catalogue to inspect all 72 operation names and their parameter schemas, then execute any operation through the query workflow. Optional FXMacroData authorization still depends on the selected dataset.

For example, the query workflow input for public release history is:

```json
{"operation":"indicator_history","arguments":{"currency":"usd","indicator":"policy_rate","limit":5}}
```

MCP operations use the `mcp_` prefix, such as `mcp_ping` or `mcp_seasonality`. Results retain the original public payload and include a provider link. This direct workflow exposes every packaged REST/MCP operation independently of the research agent.

## Integrate into an existing Mastra application

The package root exports reusable connection, tool, workflow and agent factories. Import them into an existing application; using the bundled research application is optional:

```ts
import { Mastra } from '@mastra/core/mastra';
import { FXMacroDataConnection, createFXMacroDataQueryWorkflow,
  createFXMacroDataCatalogueWorkflow } from './fxmacrodata';

const connection = new FXMacroDataConnection(process.env.FXMACRODATA_API_KEY);
export const mastra = new Mastra({
  workflows: {
    fxmacrodataQuery: createFXMacroDataQueryWorkflow({
      connection, apiKey: process.env.FXMACRODATA_API_KEY,
    }),
    fxmacrodataCatalogue: createFXMacroDataCatalogueWorkflow(),
  },
});
// Call connection.close() in your application's shutdown lifecycle.
```

Here `./fxmacrodata` is the integration source folder placed alongside your app; no published npm package is required. `createRestTools` and `createMacroAgent` are also exported for native agent registration.

## Add an agent

Set `MASTRA_MODEL` to a model supported by your Mastra installation, and configure that provider's normal environment credentials. For example, a model identifier has the shape `provider/model-id`. The agent appears in Studio as **Macro Research** when `MASTRA_MODEL` is set.

```sh
npm run research -- "Summarize recent USD inflation releases and the next confirmed release. Cite sources."
```

Agent requests use your configured model provider and may incur that provider's charges. The agent discovers every tool advertised by the hosted FXMacroData MCP server automatically. The included contract snapshot records 49 hosted tools. It also has 23 native, schema-aware REST tools, including a bounded event-stream snapshot. No local MCP server is needed.

The full workflow covers discovery, indicator history, calendars, predictions, macro news, FX reference data, rates and curves, financial prices, factors, risk sentiment, positioning, commodities, seasonality, official dataset families, research tasks and visual artifacts. The agent keeps tool schemas and MCP content adapters, preserves source provenance, and distinguishes market consensus, official projections and FXMacroData-generated predictions. Visual artifacts are available through the native tool output; rendering depends on the consuming Mastra UI.

## Connect your FXMacroData subscription

Set `FXMACRODATA_API_KEY` in your shell, deployment secret manager or Mastra application's environment to use additional authorized data. Keep credentials out of prompts, source files, shared URLs and screenshots. The transport builds authenticated requests privately, disallows redirects and sanitizes transport failures. No key is required for the public USD example.

MCP discovery is lazy: imports and builds do not contact the server. The CLI closes its connection in `finally`; the Studio entrypoint closes connections on shutdown. The event stream is bounded by `max_events` (1–100) and `max_seconds` (1–60). The template does not create subscriptions or execute trades.

Results include a provider link. Website links carry campaign parameters and the integration sends no additional tracking requests. API and MCP URLs carry no campaign parameters. See the [API reference](https://fxmacrodata.com/documentation/reference?utm_source=github&utm_medium=referral&utm_campaign=mastra-fxmacrodata&utm_content=docs) for public contracts and access details.

## Validate and build

```sh
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Fixture tests exercise real Mastra tools, MCP discovery and lifecycle, an actual Mastra workflow run, partial failures and credential-safe errors. Tests need no live network access, API keys or model calls.

For contribution to Mastra, this template belongs in the main monorepo at `templates/template-fxmacrodata-research`. Template mirror repositories are generated by Mastra. Follow the monorepo contribution process.
