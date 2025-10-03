import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { createHandler } from "@webiny/handler-aws";
import { defaultIdentity } from "./tenancySecurity.js";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types.js";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/index.js";
import { getIntrospectionQuery } from "graphql";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export type UseGraphQLHandlerParams = CreateHandlerCoreParams;
export const useGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const { path } = params;
    const core = createHandlerCore(params);

    const plugins = [...core.plugins];
    const handler = createHandler({
        plugins,
        debug: process.env.DEBUG === "true"
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<[T, any]> => {
        const response = await handler(
            {
                /**
                 * If no path defined, use /graphql as we want to make request to main api
                 */
                path: path ? `/cms/${path}` : "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };

    const { elasticsearchClient } = getElasticsearchClient({ name: "testing-ddb-es" });

    return {
        plugins,
        invoke,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        locale: core.locale,
        elasticsearch: elasticsearchClient,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        }
    };
};
