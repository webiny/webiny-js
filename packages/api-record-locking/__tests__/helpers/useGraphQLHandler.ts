import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature, GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RegisterExtensionPlugin } from "@webiny/handler";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import {
    ConnectionRegistry,
    WebsocketsSendToIdentityUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createRecordLocking } from "~/index";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { AuthTriggerHandler } from "./mocks/AuthTriggerHandler";
import { RootTenantInitializer } from "./mocks/RootTenantInitializer";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    IGetLockedEntryLockRecordGraphQlResponse,
    IGetLockedEntryLockRecordGraphQlVariables,
    IGetLockRecordGraphQlResponse,
    IGetLockRecordGraphQlVariables,
    IIsEntryLockedGraphQlResponse,
    IIsEntryLockedGraphQlVariables,
    IListLockRecordsGraphQlResponse,
    IListLockRecordsGraphQlVariables,
    ILockEntryGraphQlResponse,
    ILockEntryGraphQlVariables,
    IUnlockEntryGraphQlResponse,
    IUnlockEntryGraphQlVariables,
    IUnlockEntryRequestGraphQlResponse,
    IUnlockEntryRequestGraphQlVariables,
    IUpdateEntryLockGraphQlResponse,
    IUpdateEntryLockGraphQlVariables
} from "./graphql/recordLocking";
import {
    GET_LOCK_RECORD_QUERY,
    GET_LOCKED_ENTRY_LOCK_RECORD_QUERY,
    IS_ENTRY_LOCKED_QUERY,
    LIST_LOCK_RECORDS_QUERY,
    LOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_REQUEST_MUTATION,
    UPDATE_ENTRY_LOCK_MUTATION
} from "./graphql/recordLocking";

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export interface GraphQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
}

const noopConnectionRegistry: ConnectionRegistry.Interface = {
    register: async () => ({
        connectionId: "",
        identity: { id: "", displayName: "", type: "" },
        tenant: "",
        connectedOn: "",
        endpoint: ""
    }),
    unregister: async () => {},
    listViaConnections: async () => [],
    listViaIdentity: async () => [],
    listViaTenant: async () => [],
    listAll: async () => [],
    updateLastSeen: async () => {},
    listStale: async () => []
};

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = identity ?? defaultIdentity;
    const resolvedPermissions = (params.permissions ?? [{ name: "*" }]) as SecurityPermission[];

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
            const wcpLicense = await loadWcpLicense(createTestWcpLicense({ recordLocking: true }));
            ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            // RegisterExtensionPlugin (modelsPlugin) must go into DI now;
            // ContextPlugin must run as factory enhancer so it executes after
            // HeadlessCmsContextEnhancer sets up ctx.plugins and the model registry.
            const recordLockingPlugins = [createRecordLocking()].flat(Infinity as 1);
            processLegacyPlugins(
                container,
                recordLockingPlugins.filter(p => p instanceof RegisterExtensionPlugin)
            );
            const recordLockingContextPlugins = recordLockingPlugins.filter(
                p => !(p instanceof RegisterExtensionPlugin)
            );

            container.registerInstance(ConnectionRegistry, noopConnectionRegistry);
            container.registerInstance(WebsocketsSendToIdentityUseCase, {
                execute: async () => {}
            });

            container.registerFactory(GraphQLContextEnhancer, () => ({
                async enhance(ctx: Record<string, any>): Promise<void> {
                    for (const plugin of recordLockingContextPlugins) {
                        if (typeof (plugin as any).apply === "function") {
                            await (plugin as any).apply(ctx);
                        }
                    }
                }
            }));

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: {
        httpMethod?: "POST" | "GET" | "OPTIONS";
        body?: { query: string; variables?: Record<string, any> };
        headers?: Record<string, string>;
    }): Promise<[T, any]> => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
            body
        });
        return [response.body as T, response];
    };

    return {
        identity: resolvedIdentity,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        async listLockRecordsQuery(variables?: IListLockRecordsGraphQlVariables) {
            return invoke<IListLockRecordsGraphQlResponse>({
                body: { query: LIST_LOCK_RECORDS_QUERY, variables }
            });
        },
        async getLockRecordQuery(variables: IGetLockRecordGraphQlVariables) {
            return invoke<IGetLockRecordGraphQlResponse>({
                body: { query: GET_LOCK_RECORD_QUERY, variables }
            });
        },
        async getLockedEntryLockRecordQuery(variables: IGetLockedEntryLockRecordGraphQlVariables) {
            return invoke<IGetLockedEntryLockRecordGraphQlResponse>({
                body: { query: GET_LOCKED_ENTRY_LOCK_RECORD_QUERY, variables }
            });
        },
        async isEntryLockedQuery(variables: IIsEntryLockedGraphQlVariables) {
            return invoke<IIsEntryLockedGraphQlResponse>({
                body: { query: IS_ENTRY_LOCKED_QUERY, variables }
            });
        },
        async lockEntryMutation(variables: ILockEntryGraphQlVariables) {
            return invoke<ILockEntryGraphQlResponse>({
                body: { query: LOCK_ENTRY_MUTATION, variables }
            });
        },
        async updateEntryLockMutation(variables: IUpdateEntryLockGraphQlVariables) {
            return invoke<IUpdateEntryLockGraphQlResponse>({
                body: { query: UPDATE_ENTRY_LOCK_MUTATION, variables }
            });
        },
        async unlockEntryMutation(variables: IUnlockEntryGraphQlVariables) {
            return invoke<IUnlockEntryGraphQlResponse>({
                body: { query: UNLOCK_ENTRY_MUTATION, variables }
            });
        },
        async unlockEntryRequestMutation(variables: IUnlockEntryRequestGraphQlVariables) {
            return invoke<IUnlockEntryRequestGraphQlResponse>({
                body: { query: UNLOCK_ENTRY_REQUEST_MUTATION, variables }
            });
        }
    };
};
