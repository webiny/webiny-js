import { Webiny } from "@webiny/sdk";
import { ContentSdk } from "./ContentSdk.js";
import type { CmsSdkConfig } from "./types.js";

/**
 * A configured CMS client. It exposes the same methods as `contentSdk`, except `init()`:
 * a client's configuration is fixed when it is created.
 */
export type CmsClient = Omit<ContentSdk, "init">;

/**
 * Create a CMS client with its own configuration and its own API client, separate from the
 * `contentSdk` singleton and from other clients. Use it when one process reads entries for
 * different tenants or API hosts.
 *
 * Entry and model reads are per client. The component registry, the entry stores and the
 * reference cache are module-level and shared by all clients and `contentSdk`.
 */
export function createCmsClient(config: CmsSdkConfig): CmsClient {
    const webiny = new Webiny({
        endpoint: config.apiHost,
        token: config.apiKey,
        tenant: config.apiTenant ?? "root",
        fetch: config.fetch
    });
    const client = new ContentSdk();
    client.init(config, webiny);
    return client;
}
