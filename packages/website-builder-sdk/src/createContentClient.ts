import { ContentSdk } from "./ContentSdk.js";
import type { ContentSDKConfig } from "./ContentSdk.js";

/**
 * A configured, isolated content client. It exposes the same methods as `contentSdk`,
 * except `init()`: a client's configuration is fixed when it is created.
 */
export type ContentClient = Omit<ContentSdk, "init">;

/**
 * Create a content client with its own configuration and its own API client, independent
 * of the `contentSdk` singleton and of any other client. Use it when one process serves
 * requests for different tenants or API hosts.
 */
export function createContentClient(config: ContentSDKConfig): ContentClient {
    const client = new ContentSdk();
    client.init(config);
    return client;
}
