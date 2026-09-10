import { MCPClient } from '@mastra/mcp';
import { MCP_URL, PublicRequestError, safeFetch, type Fetch } from '../../rest-client';
import { redactSecrets } from '../../redaction';

export type NativeTools = Awaited<ReturnType<MCPClient['listTools']>>;
export interface Connection { listTools(): Promise<NativeTools>; disconnect(): Promise<void> }
export type ConnectionFactory = (options: ConstructorParameters<typeof MCPClient>[0]) => Connection;

/** Lazy connection: importing/building the template performs no network calls. */
export class FXMacroDataConnection {
  #connection?: Connection;
  #discovered?: Promise<NativeTools>;
  readonly #apiKey?: string;
  readonly #request: Fetch;
  readonly #factory: ConnectionFactory;
  constructor(apiKey?: string, request: Fetch = fetch,
    factory: ConnectionFactory = options => new MCPClient(options)) {
    this.#apiKey = apiKey; this.#request = request; this.#factory = factory;
  }

  async tools(): Promise<NativeTools> {
    if (!this.#discovered) this.#discovered = this.discover();
    return this.#discovered;
  }
  private async discover(): Promise<NativeTools> {
    try {
      this.#connection = this.#factory({
        id: 'fxmacrodata-research', timeout: 45_000,
        servers: { fxmacrodata: { url: new URL(MCP_URL), timeout: 45_000,
          fetch: (url, init) => safeFetch(this.#apiKey, this.#request)(url, init),
          enableServerLogs: false,
        } },
      });
      const tools = await this.#connection.listTools();
      if (!Object.keys(tools).length) throw new PublicRequestError('FXMacroData tool discovery returned no tools.');
      // Keep the native Tool, input/output schemas and MCP content adapters.
      // Keep successful results and retained content metadata credential-free.
      for (const tool of Object.values(tools)) {
        if (!tool.execute) continue;
        const execute = tool.execute.bind(tool);
        tool.execute = async (...args: Parameters<typeof execute>) => {
          try { return redactSecrets(await execute(...args), this.#apiKey); }
          catch { throw new PublicRequestError('FXMacroData tool unavailable. Check parameters and optional API access.'); }
        };
      }
      return tools;
    } catch { await this.close(); throw new PublicRequestError('FXMacroData tool discovery unavailable. Check the connection and optional access.'); }
  }
  async close(): Promise<void> {
    const connection = this.#connection; this.#connection = undefined; this.#discovered = undefined;
    await connection?.disconnect().catch(() => {});
  }
}
