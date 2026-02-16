import { Sdk } from "@webiny/sdk";
import type { GraphQLHandlerParams } from "./useGraphQLHandler";
import { useGraphQLHandler } from "./useGraphQLHandler";

/**
 * Creates a CMS SDK instance for testing with a custom fetch function.
 * The custom fetch intercepts HTTP requests and routes them to the test handler.
 */
export const useWebinySdk = (params: GraphQLHandlerParams = {}) => {
    const handler = useGraphQLHandler({ ...params });

    // Custom fetch function that routes SDK HTTP requests to our test handler.
    const customFetch: typeof fetch = async (_, options) => {
        // Parse the request body.
        const body = options?.body ? JSON.parse(options.body as string) : undefined;

        // Invoke the test handler with the GraphQL query.
        const [response] = await handler.invoke({
            body,
            headers: {}
        });

        // Convert the handler response to a fetch Response object.
        const responseBody = JSON.stringify(response);
        return new Response(responseBody, {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };

    // Create and return the SDK instance with our custom fetch.
    const sdk = new Sdk({
        endpoint: "http://localhost", // Dummy endpoint, not actually used.
        token: "aToken", // Token configured in plugins.ts.
        tenant: "root",
        fetch: customFetch
    });

    return { sdk, handler };
};
