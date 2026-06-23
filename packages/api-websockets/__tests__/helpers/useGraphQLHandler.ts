import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { WebsocketsFeature } from "~/features/feature.js";
import { WebsocketsGraphQLFactoryFeature } from "~/graphql/feature.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { MockWebsocketsTransport } from "~tests/mocks/MockWebsocketsTransport.js";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { getIntrospectionQuery } from "graphql";
import type {
    IDisconnectAllConnectionsResponse,
    IDisconnectConnectionResponse,
    IDisconnectConnectionVariables,
    IDisconnectIdentityConnectionsResponse,
    IDisconnectIdentityConnectionsVariables,
    IDisconnectTenantConnectionsResponse,
    IDisconnectTenantConnectionsVariables,
    IListConnectionsResponse,
    IListConnectionsVariables
} from "./graphql/connections";
import {
    DISCONNECT_ALL_CONNECTIONS,
    DISCONNECT_CONNECTIONS,
    DISCONNECT_IDENTITY_CONNECTIONS,
    DISCONNECT_TENANT_CONNECTIONS,
    LIST_CONNECTIONS
} from "./graphql/connections";
import type { GenericRecord } from "@webiny/api/types";

export interface UseGraphQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
}

export interface InvokeParams<V = GenericRecord> {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: V;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const defaultPermissions: SecurityPermission[] = [
    { name: "task.entry", rwd: "rwd" },
    { name: "*" }
];

export const useGraphQLHandler = (params?: UseGraphQLHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const websocketsStorage = getStorageOps("websockets");

    const resolvedIdentity = params?.identity ?? defaultIdentity;
    const resolvedPermissions = (params?.permissions ?? defaultPermissions) as SecurityPermission[];

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, resolvedPermissions);
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());
            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            processLegacyPlugins(container, websocketsStorage.plugins);
            WebsocketsFeature.register(container);
            WebsocketsGraphQLFactoryFeature.register(container);
            container.registerInstance(WebsocketsTransport, new MockWebsocketsTransport());

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any, V = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams<V>): Promise<[T, any]> => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token",
                ...headers
            },
            body
        });
        return [response.body as unknown as T, response];
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
                    variables: { identityId }
                }
            });
        },
        disconnectTenant: async (tenant: string) => {
            return invoke<
                IDisconnectTenantConnectionsResponse,
                IDisconnectTenantConnectionsVariables
            >({
                body: {
                    query: DISCONNECT_TENANT_CONNECTIONS,
                    variables: { tenant }
                }
            });
        },
        disconnect: async (connections: string[]) => {
            return invoke<IDisconnectConnectionResponse, IDisconnectConnectionVariables>({
                body: {
                    query: DISCONNECT_CONNECTIONS,
                    variables: { connections }
                }
            });
        },
        disconnectAll: async () => {
            return invoke<IDisconnectAllConnectionsResponse>({
                body: { query: DISCONNECT_ALL_CONNECTIONS }
            });
        }
    };
};
