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
    // Shared by concurrent calls, so a document with several missing components fetches once.
    let loading: ReturnType<typeof remote.loadComponents> | undefined;

    return {
        async loadComponent(ref) {
            loading ??= remote.loadComponents().catch(error => {
                loading = undefined;
                throw error;
            });
            const components = await loading;
            const component = components.find(item => item.manifest.name === ref.name);
            return component ?? null;
        }
    };
};
