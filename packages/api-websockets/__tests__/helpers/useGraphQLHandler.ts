import { PluginCollection } from "@webiny/plugins/types";
import { createPlugins } from "./plugins";
import { createHandler } from "@webiny/handler-aws/gateway";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import {
    IListConnectionsResponse,
    IListConnectionsVariables,
    LIST_CONNECTIONS
} from "./graphql/connections";
import { getIntrospectionQuery } from "graphql";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};

    const handler = createHandler({
        plugins: createPlugins(plugins)
    });
    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<[T, any]> => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body) as unknown as T, response as any];
    };

    return {
        handler,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        listConnections: async (variables?: IListConnectionsVariables) => {
            return invoke<IListConnectionsResponse>({
                body: { query: LIST_CONNECTIONS, variables }
            });
        }
    };
};
