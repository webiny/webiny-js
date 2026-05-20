import { Webiny } from "@webiny/sdk";
import type { UseGraphQLHandlerParams } from "./useGraphQLHandler.js";
import { useGraphQLHandler } from "./useGraphQLHandler.js";

export const useWebinySdk = (params?: UseGraphQLHandlerParams) => {
    const handler = useGraphQLHandler(params);

    const customFetch: typeof fetch = async (_, options) => {
        const body = options?.body ? JSON.parse(options.body as string) : undefined;

        const [response] = await handler.invoke({
            body,
            headers: {}
        });

        const responseBody = JSON.stringify(response);
        return new Response(responseBody, {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    };

    const sdk = new Webiny({
        endpoint: "http://localhost",
        token: "aToken",
        tenant: "root",
        fetch: customFetch
    });

    return {
        sdk,
        handler
    };
};
