import type { Component, ElementComponent } from "~/types.js";
import type { ApiClient } from "~/dataProviders/ApiClient.js";
import type { ApiConfig } from "~/ContentSdk.js";

/**
 * Loads a component that a document references but the content client has no registration for.
 * This is the seam for fetching components per tenant and for caching them. The content client
 * creates one loader per client and caches nothing itself.
 */
export interface ComponentLoader {
    loadComponent(ref: ElementComponent): Promise<Component | null>;
}

export type ComponentLoaderFactoryParams = {
    // The content client's API client, so fetches carry its tenant, host and API key.
    apiClient: ApiClient;
    // The same tenant, host and API key, for loaders that bring their own transport.
    config: ApiConfig;
};

export type ComponentLoaderFactory = (params: ComponentLoaderFactoryParams) => ComponentLoader;
