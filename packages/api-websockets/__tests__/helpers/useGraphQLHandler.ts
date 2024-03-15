import { createPlugins, Params as CreatePluginsParams } from "./plugins";
import { createHandler } from "@webiny/handler-aws/gateway";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import {
    DISCONNECT_ALL_CONNECTIONS,
    DISCONNECT_CONNECTIONS,
    DISCONNECT_IDENTITY_CONNECTIONS,
    DISCONNECT_TENANT_CONNECTIONS,
    IDisconnectAllConnectionsResponse,
    IDisconnectConnectionResponse,
    IDisconnectConnectionVariables,
    IDisconnectIdentityConnectionsResponse,
    IDisconnectIdentityConnectionsVariables,
    IDisconnectTenantConnectionsResponse,
    IDisconnectTenantConnectionsVariables,
    IListConnectionsResponse,
    IListConnectionsVariables,
    LIST_CONNECTIONS
} from "./graphql/connections";
import { getIntrospectionQuery } from "graphql";
import { GenericRecord } from "@webiny/api/types";

export type UseHandlerParams = CreatePluginsParams;

export interface InvokeParams<V = GenericRecord> {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: V;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params?: UseHandlerParams) => {
    const handler = createHandler({
        plugins: createPlugins(params)
    });
    const invoke = async <T = any, V = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams<V>): Promise<[T, any]> => {
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
            return invoke<IListConnectionsResponse, IListConnectionsVariables>({
                body: { query: LIST_CONNECTIONS, variables }
            });
        },
        disconnectIdentity: async (identityId: string) => {
            return invoke<
                IDisconnectIdentityConnectionsResponse,
                IDisconnectIdentityConnectionsVariables
            >({
                body: {
                    query: DISCONNECT_IDENTITY_CONNECTIONS,
                    variables: {
                        identityId
                    }
                }
            });
        },
        disconnectTenant: async (tenant: string, locale?: string) => {
            return invoke<
                IDisconnectTenantConnectionsResponse,
                IDisconnectTenantConnectionsVariables
            >({
                body: {
                    query: DISCONNECT_TENANT_CONNECTIONS,
                    variables: {
                        tenant,
                        locale
                    }
                }
            });
        },
        disconnect: async (connections: string[]) => {
            return invoke<IDisconnectConnectionResponse, IDisconnectConnectionVariables>({
                body: {
                    query: DISCONNECT_CONNECTIONS,
                    variables: {
                        connections
                    }
                }
            });
        },
        disconnectAll: async () => {
            return invoke<IDisconnectAllConnectionsResponse>({
                body: {
                    query: DISCONNECT_ALL_CONNECTIONS
                }
            });
        }
    };
};
