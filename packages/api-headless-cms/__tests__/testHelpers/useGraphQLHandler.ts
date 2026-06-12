import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "~/index";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations, ApiEndpoint } from "~/types";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { createPermissions } from "~tests/testHelpers/helpers";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TestIdentity, TestAuthenticator } from "~tests/testHelpers/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "~tests/testHelpers/mocks/TestAuthorizer";
import { RootTenantInitializer } from "~tests/testHelpers/handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "~tests/testHelpers/handlers/AuthTriggerHandler";
import { CmsEndpointAccessDecorator } from "~tests/testHelpers/handlers/CmsEndpointAccessDecorator";
import { defaultIdentity } from "~tests/testHelpers/tenancySecurity";
import { processLegacyPlugins } from "~tests/testHelpers/bridgeLegacyPlugins";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type {
    CmsExportStructureQueryVariables,
    CmsImportStructureMutationVariables,
    CmsValidateStructureMutationResponse,
    CmsValidateStructureMutationVariables
} from "~tests/testHelpers/graphql/structure";
import {
    CMS_EXPORT_STRUCTURE_QUERY,
    CMS_IMPORT_STRUCTURE_MUTATION,
    CMS_VALIDATE_STRUCTURE_MUTATION
} from "~tests/testHelpers/graphql/structure";
import type { ContentModelGroupsMutationVariables } from "./graphql/contentModelGroup";
import {
    CREATE_CONTENT_MODEL_GROUP_MUTATION,
    DELETE_CONTENT_MODEL_GROUP_MUTATION,
    GET_CONTENT_MODEL_GROUP_QUERY,
    LIST_CONTENT_MODEL_GROUP_QUERY,
    UPDATE_CONTENT_MODEL_GROUP_MUTATION
} from "./graphql/contentModelGroup";
import type {
    CreateContentModelFromMutationVariables,
    CreateContentModelMutationResponse,
    CreateContentModelMutationVariables
} from "./graphql/contentModel";
import {
    CREATE_CONTENT_MODEL_FROM_MUTATION,
    CREATE_CONTENT_MODEL_MUTATION,
    DELETE_CONTENT_MODEL_MUTATION,
    GET_CONTENT_MODEL_QUERY,
    LIST_CONTENT_MODELS_QUERY,
    UPDATE_CONTENT_MODEL_MUTATION
} from "./graphql/contentModel";
import { INSTALL_MUTATION, IS_INSTALLED_QUERY } from "./graphql/settings";
import type { SearchContentEntriesVariables } from "./graphql/contentEntry";
import {
    GET_CONTENT_ENTRIES_QUERY,
    GET_CONTENT_ENTRY_QUERY,
    GET_LATEST_CONTENT_ENTRIES_QUERY,
    GET_LATEST_CONTENT_ENTRY_QUERY,
    GET_PUBLISHED_CONTENT_ENTRIES_QUERY,
    GET_PUBLISHED_CONTENT_ENTRY_QUERY,
    SEARCH_CONTENT_ENTRIES_QUERY
} from "./graphql/contentEntry";

export interface GraphQLHandlerParams {
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    path?: string;
    plugins?: any[];
    topPlugins?: any[];
    bottomPlugins?: any[];
}

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface IBaseGraphQLResponse<T = any> {
    data: T;
    errors?: Error[];
}

function extractCmsType(path?: string): ApiEndpoint {
    if (!path) {
        return "manage";
    }
    const segment = path.split("/")[0].toLowerCase();
    if (segment === "read") {
        return "read";
    }
    if (segment === "preview") {
        return "preview";
    }
    return "manage";
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { identity = defaultIdentity, permissions } = params;
    const allPlugins = [
        ...(params.topPlugins ?? []),
        ...(params.plugins ?? []),
        ...(params.bottomPlugins ?? [])
    ];

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const cmsType = extractCmsType(params.path);
    const resolvedPermissions = createPermissions(permissions);

    // Build ctx.db from the test DynamoDB document client
    const documentClient = getDocumentClient();
    const dbDriver = new DynamoDbDriver({ documentClient });

    // Context capture for getContext()
    const capturedCtx: { value?: Record<string, any> } = {};

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, identity);
            container.registerInstance(TestPermissions, resolvedPermissions);
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            // Decorator order (last = outermost = runs first):
            // RootTenantInit → AuthTrigger → CmsEndpointAccess → HttpRouterHandler
            container.registerDecorator(CmsEndpointAccessDecorator);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            const wcpLicense = await loadWcpLicense(createTestWcpLicense());

            // ctx.db bridge — must run before HeadlessCmsContextEnhancer (instance order)
            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    ctx.db = { driver: dbDriver };
                }
            });

            // Context capture enhancer — runs after cms enhancer sets up ctx.cms
            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    capturedCtx.value = ctx;
                }
            });

            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });

            // Process legacy RegisterExtensionPlugins to register StorageOperationsFactory
            processLegacyPlugins(container, cmsStorage.plugins);

            // Separate plugins:
            // - Arrow functions (no prototype) → container setup callbacks, call immediately
            // - Everything else → extra plugins (CmsGraphQLSchemaPlugin, ContextPlugin, etc.)
            const extraCmsPlugins: any[] = [];

            // Collect plain Plugin objects from cmsStorage.plugins (e.g. sorting plugins)
            for (const p of [cmsStorage.plugins].flat(Infinity as 1)) {
                if (p && typeof (p as any).apply !== "function" && typeof p !== "function") {
                    extraCmsPlugins.push(p);
                }
            }

            for (const plugin of allPlugins) {
                if (typeof plugin === "function" && !plugin.prototype) {
                    await (plugin as (container: any) => void)(container);
                } else {
                    extraCmsPlugins.push(...[plugin].flat());
                }
            }

            HeadlessCmsFeature.register(container, {
                type: cmsType,
                extraPlugins: extraCmsPlugins
            });
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams = {}): Promise<[IBaseGraphQLResponse<T>, any]> => {
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
        if (response.statusCode !== 200) {
        }
        return [response.body, response];
    };

    return {
        handler,
        invoke,
        tenant: { id: "root", name: "Root", parent: null },
        identity,
        storageOperations: cmsStorage.storageOperations,
        getContext: () => capturedCtx.value as any,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        // settings
        async isInstalledQuery({ headers = {} } = {}) {
            return invoke({ body: { query: IS_INSTALLED_QUERY }, headers });
        },
        async installMutation() {
            return invoke({ body: { query: INSTALL_MUTATION } });
        },
        // export / import
        async exportStructureQuery(variables?: CmsExportStructureQueryVariables) {
            return invoke({ body: { query: CMS_EXPORT_STRUCTURE_QUERY, variables } });
        },
        async importCmsStructureMutation(variables: CmsImportStructureMutationVariables) {
            return invoke({ body: { query: CMS_IMPORT_STRUCTURE_MUTATION, variables } });
        },
        async validateCmsStructureMutation(variables: CmsValidateStructureMutationVariables) {
            return invoke<CmsValidateStructureMutationResponse>({
                body: { query: CMS_VALIDATE_STRUCTURE_MUTATION, variables }
            });
        },
        // content model group
        async createContentModelGroupMutation(variables: ContentModelGroupsMutationVariables) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async getContentModelGroupQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_MODEL_GROUP_QUERY, variables } });
        },
        async updateContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async deleteContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_MODEL_GROUP_MUTATION, variables } });
        },
        async listContentModelGroupsQuery() {
            return invoke({ body: { query: LIST_CONTENT_MODEL_GROUP_QUERY } });
        },
        // content models definitions
        async getContentModelQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_MODEL_QUERY, variables } });
        },
        async listContentModelsQuery(variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_CONTENT_MODELS_QUERY, variables } });
        },
        async createContentModelMutation(variables: CreateContentModelMutationVariables) {
            return invoke<CreateContentModelMutationResponse>({
                body: { query: CREATE_CONTENT_MODEL_MUTATION, variables }
            });
        },
        async createContentModelFromMutation(variables: CreateContentModelFromMutationVariables) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_FROM_MUTATION, variables } });
        },
        async updateContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CONTENT_MODEL_MUTATION, variables } });
        },
        async deleteContentModelMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_MODEL_MUTATION, variables } });
        },
        async getContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_ENTRY_QUERY, variables } });
        },
        async getLatestContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_LATEST_CONTENT_ENTRY_QUERY, variables } });
        },
        async getPublishedContentEntry(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_CONTENT_ENTRY_QUERY, variables } });
        },
        async getContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_ENTRIES_QUERY, variables } });
        },
        async getLatestContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_LATEST_CONTENT_ENTRIES_QUERY, variables } });
        },
        async getPublishedContentEntries(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_CONTENT_ENTRIES_QUERY, variables } });
        },
        async searchContentEntries(variables: SearchContentEntriesVariables) {
            return invoke({ body: { query: SEARCH_CONTENT_ENTRIES_QUERY, variables } });
        }
    };
};
