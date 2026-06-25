import { Webiny } from "@webiny/sdk";
import type { GraphQLHandlerParams } from "./useGraphQLHandler";
import { useGraphQLHandler } from "./useGraphQLHandler";

/**
 * Creates a CMS SDK instance for testing with a custom fetch function.
 * The custom fetch intercepts HTTP requests and routes them to the test handler.
 */
export const useWebinySdk = (params: GraphQLHandlerParams = {}) => {
    const handler = useGraphQLHandler({ ...params });

    // Custom fetch function that routes SDK HTTP requests to our test handler.
    // The SDK targets the unified CMS API (`mutation { cms { createEntry ... } }`), which is
    // served by the core GraphQL engine at /graphql — not the per-model CMS schema at /cms/*.
    const customFetch: typeof fetch = async (_, options) => {
        // Parse the request body.
        const body = options?.body ? JSON.parse(options.body as string) : undefined;

        // Invoke the test handler's core GraphQL route with the SDK's query.
        const response = await handler.handler({
            method: "POST",
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json"
            },
            body
        });

        // Convert the handler response to a fetch Response object.
        const responseBody = JSON.stringify(response.body);
        return new Response(responseBody, {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };

    // Create and return the SDK instance with our custom fetch.
    const sdk = new Webiny({
        endpoint: "http://localhost", // Dummy endpoint, not actually used.
        token: "aToken", // Token configured in plugins.ts.
        tenant: "root",
        fetch: customFetch
    });

    return { sdk, handler };
};
