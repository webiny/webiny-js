import { ContentSdk } from "./ContentSdk.js";
import type { ContentSDKConfig } from "./ContentSdk.js";
import { ComponentRegistry } from "./ComponentRegistry.js";
import { ContentEntryCache } from "./contentEntry/ContentEntryCache.js";
import { DocumentStoreManager } from "./DocumentStoreManager.js";

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
 * Data fetching is per client, and so are the component registry, the content entry cache
 * and the document store. The editing environment is module-level and shared by all
 * clients and `contentSdk`.
 */
export function createContentClient(config: ContentSDKConfig): ContentClient {
    const client = new ContentSdk({
        componentRegistry: new ComponentRegistry(),
        contentEntryCache: new ContentEntryCache(),
        documentStoreManager: new DocumentStoreManager()
    });
    client.init(config);
    return client;
}
