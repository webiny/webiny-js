import type { ComponentLoaderFactory } from "@webiny/website-builder-nextjs";
import { GraphQLRemoteComponentLoader } from "./GraphQLRemoteComponentLoader.js";

/**
 * The default component loader for content clients: the existing GraphQL remote component
 * loading, created per client with the client's tenant, host and API key.
 */
export const createGraphQLComponentLoader: ComponentLoaderFactory = ({ config }) => {
    const remote = new GraphQLRemoteComponentLoader({
        apiHost: config.apiHost,
        apiKey: config.apiKey,
        apiTenant: config.apiTenant
    });
    return {
        async loadComponent(ref) {
            // The loader shares a load in flight and caches a successful one, so a document with
            // several missing components fetches once, and a failed load is retried.
            const components = await remote.loadComponents();
            const component = components.find(item => item.manifest.name === ref.name);
            return component ?? null;
        }
    };
};
