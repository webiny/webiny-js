import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { createLambdaHandler, ApiGatewayFeature } from "@webiny/event-handler-aws";
import { registerLegacyPlugins } from "@webiny/event-handler-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { defaultIdentity } from "./tenancySecurity.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/index.js";
import { getIntrospectionQuery } from "graphql";
import type { GenericRecord } from "@webiny/api/types.js";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

interface IResponse {
    body: string;
}

export interface UseGraphQLHandlerParams extends CreateHandlerCoreParams {
    debug?: boolean;
}
export const useGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const { path } = params;
    const core = createHandlerCore(params);

    const plugins = [...core.plugins];
    const handler = createLambdaHandler({
        root: async container => {
            ApiGatewayFeature.register(container);
        },
        request: async container => {
            registerLegacyPlugins(container, plugins);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<[T, any]> => {
        const response: IResponse = await handler(
            {
                path: path ? `/cms/${path}` : "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            },
            {} as unknown as LambdaContext
        );
        return [JSON.parse(response.body || "{}"), response];
    };

    const { elasticsearchClient } = getElasticsearchClient({
        name: "testing-ddb-es"
    });

    const createQuery = <
        T extends GenericRecord = GenericRecord,
        R extends GenericRecord = GenericRecord
    >(
        query: string
    ) => {
        return (variables: T, headers: GenericRecord = {}) => {
            return invoke<R>({
                body: {
                    query,
                    variables: variables || undefined
                },
                headers
            });
        };
    };

    const createMutation = <
        T extends GenericRecord = GenericRecord,
        R extends GenericRecord = GenericRecord
    >(
        mutation: string
    ) => {
        return (variables: T, headers: GenericRecord = {}) => {
            return invoke<R>({
                body: {
                    query: mutation,
                    variables: variables || undefined
                },
                headers
            });
        };
    };

    return {
        plugins,
        invoke,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        handler,
        elasticsearch: elasticsearchClient,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        createQuery,
        createMutation
    };
};
