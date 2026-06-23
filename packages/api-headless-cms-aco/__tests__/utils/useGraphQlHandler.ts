import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { HeadlessCmsContextualSchema } from "@webiny/api-headless-cms/HeadlessCmsContextualSchema.js";
import { AcoFeature } from "@webiny/api-aco";
import { AcoHcmsFeature } from "~/AcoHcmsFeature.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import {
    CREATE_CONTENT_MODEL,
    CREATE_CONTENT_MODEL_GROUP,
    CREATE_ENTRY,
    DELETE_ENTRY,
    GET_ENTRY,
    RESTORE_ENTRY
} from "~tests/graphql/cms.gql";
import { CREATE_FOLDER, DELETE_FOLDER, GET_FOLDER } from "~tests/graphql/folder.gql";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: IdentityData = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<ApiCoreStorageOperations>("aco");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = identity ?? defaultIdentity;
    const resolvedPermissions = permissions ?? ([{ name: "*" }] as SecurityPermission[]);

    const extraCmsPlugins = ([plugins] as any[]).flat(Infinity as 1).filter(Boolean);

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
            const wcpLicense = await loadWcpLicense(
                params.testProjectLicense ?? createTestWcpLicense()
            );
            ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
            processLegacyPlugins(container, apiAcoStorage.plugins);
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, {
                type: "manage",
                extraPlugins: extraCmsPlugins
            });
            container.register(HeadlessCmsContextualSchema);
            AcoFeature.register(container);
            AcoHcmsFeature.register(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                ["x-tenant"]: "root",
                ["content-type"]: "application/json",
                ...headers
            },
            body
        });
        return [response.body, response];
    };

    const aco = {
        async createFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FOLDER(fields), variables } });
        },
        async deleteFolder(variables = {}) {
            return invoke({ body: { query: DELETE_FOLDER, variables } });
        },
        async getFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: GET_FOLDER(fields), variables } });
        }
    };

    const cms = {
        async createContentModel(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL, variables } });
        },
        async createContentModelGroup(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_GROUP, variables } });
        },
        async createTestModelGroup() {
            return cms
                .createContentModelGroup({
                    data: {
                        name: "Group",
                        slug: "group",
                        icon: "ico/ico",
                        description: "description"
                    }
                })
                .then(([response]) => {
                    return response.data.createContentModelGroup.data;
                });
        },
        async createBasicModel(variables: Record<string, any>) {
            return cms
                .createContentModel({
                    data: {
                        modelId: "basicTestModel",
                        group: variables.modelGroup,
                        defaultFields: true,
                        name: "BasicTestModel",
                        singularApiName: "BasicTestModel",
                        pluralApiName: "BasicTestModels"
                    }
                })
                .then(([response]) => {
                    return response.data.createContentModel.data as CmsModel;
                });
        },
        async createEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_ENTRY(model), variables } });
        },
        async deleteEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_ENTRY(model), variables } });
        },
        async restoreEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: RESTORE_ENTRY(model), variables } });
        },
        async getEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: GET_ENTRY(model), variables } });
        }
    };

    return {
        until,
        params,
        handler,
        invoke,
        aco,
        cms,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
