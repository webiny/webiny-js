import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { defaultIdentity } from "./tenancySecurity.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { getIntrospectionQuery } from "graphql";
import type { GenericRecord } from "@webiny/api/types.js";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import type { Container } from "@webiny/di";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface UseGraphQLHandlerParams extends CreateHandlerCoreParams {
    debug?: boolean;
    /** Called after core setup to register DI-native features (e.g. WorkflowsFeature). */
    features?: (container: Container) => void;
}
export const useGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const { path } = params;
    const core = createHandlerCore(params);

    const handler = createTestHttpHandler({
        root: () => {},
        request: async container => {
            await core.setup(container, core.legacyPlugins);
            registerLegacyPluginsViaGqlContextualSchema(container, core.legacyPlugins);
            params.features?.(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams = {}): Promise<[T, any]> => {
        const response = await handler({
            path: path ? `/cms/${path}` : "/graphql",
            method: httpMethod,
            headers: {
                ["x-tenant"]: "root",
                ["Content-Type"]: "application/json",
                ...headers
            },
            body
        });
        return [response.body as T, response];
    };

    const elasticsearchClient = createTestOpenSearchClient();

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
