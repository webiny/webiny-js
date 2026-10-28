import { ContentSdk } from "./ContentSdk.js";
import type { ContentSDKConfig } from "./ContentSdk.js";

/**
 * A configured content client. It exposes the same methods as `contentSdk`,
 * except `init()`: a client's configuration is fixed when it is created.
 */
export type ContentClient = Omit<ContentSdk, "init">;

/**
 * Create a content client with its own configuration and its own API client, separate
 * from the `contentSdk` singleton and from other clients. Use it when one process serves
 * requests for different tenants or API hosts.
 *
 * Data fetching is per client. The component registry, the document store and the
 * editing environment are module-level and shared by all clients and `contentSdk`.
 */
export function createContentClient(config: ContentSDKConfig): ContentClient {
    const client = new ContentSdk();
    client.init(config);
    return client;
}
