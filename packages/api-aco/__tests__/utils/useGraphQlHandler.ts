import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { ContextPlugin } from "@webiny/api";
import { AcoFeature } from "~/index";
import { createIdentity } from "./identity";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler";
import { createAcoSdk } from "~tests/utils/createAcoSdk.js";

import {
    CREATE_RECORD,
    DELETE_RECORD,
    GET_RECORD,
    LIST_RECORDS,
    LIST_TAGS,
    MOVE_RECORD,
    UPDATE_RECORD
} from "~tests/graphql/record.gql";

import {
    CREATE_CONTENT_MODEL,
    CREATE_CONTENT_MODEL_GROUP,
    CREATE_ENTRY,
    DELETE_ENTRY,
    GET_ENTRY,
    LIST_ENTRIES,
    UPDATE_ENTRY
} from "~tests/graphql/cms";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
    plugins?: any;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<any>("aco");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = identity === undefined ? createIdentity() : identity;
    const resolvedPermissions: SecurityPermission[] =
        permissions === undefined ? [{ name: "*" }] : permissions;

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

            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });

            processLegacyPlugins(container, apiAcoStorage.plugins);
            processLegacyPlugins(container, cmsStorage.plugins);

            if (params.plugins) {
                const extraPlugins = [params.plugins].flat(Infinity as 1);
                for (const plugin of extraPlugins) {
                    if (plugin instanceof ContextPlugin) {
                        await plugin.apply({ container } as any);
                    }
                }
                processLegacyPlugins(container, extraPlugins);
            }

            HeadlessCmsFeature.register(container, { type: "manage" });
            container.register(FileModel);
            AcoFeature.register(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
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
        return [response.body, response];
    };

    const invokeCms = async ({
        httpMethod = "POST",
        type = "manage",
        body,
        headers = {}
    }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: `/cms/${type}`,
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
            body
        });
        return [response.body, response];
    };

    const search = {
        async createRecord(variables = {}) {
            return invoke({ body: { query: CREATE_RECORD, variables } });
        },
        async updateRecord(variables = {}) {
            return invoke({ body: { query: UPDATE_RECORD, variables } });
        },
        async moveRecord(variables = {}) {
            return invoke({ body: { query: MOVE_RECORD, variables } });
        },
        async deleteRecord(variables = {}) {
            return invoke({ body: { query: DELETE_RECORD, variables } });
        },
        async listRecords(variables = {}) {
            return invoke({ body: { query: LIST_RECORDS, variables } });
        },
        async getRecord(variables = {}) {
            return invoke({ body: { query: GET_RECORD, variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: LIST_TAGS, variables } });
        }
    };

    const cms = {
        async createContentModel(variables: Record<string, any>) {
            return invokeCms({ body: { query: CREATE_CONTENT_MODEL, variables } });
        },
        async createContentModelGroup(variables: Record<string, any>) {
            return invokeCms({ body: { query: CREATE_CONTENT_MODEL_GROUP, variables } });
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
            return invokeCms({ body: { query: CREATE_ENTRY(model), variables } });
        },
        async updateEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: UPDATE_ENTRY(model), variables } });
        },
        async deleteEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: DELETE_ENTRY(model), variables } });
        },
        async listEntries(model: CmsModel, variables: Record<string, any> = {}) {
            return invokeCms({ body: { query: LIST_ENTRIES(model), variables } });
        },
        async getEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: GET_ENTRY(model), variables } });
        }
    };

    const aco = createAcoSdk(invoke);

    return {
        until,
        params,
        handler,
        invoke,
        aco,
        search,
        cms,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        }
    };
};
