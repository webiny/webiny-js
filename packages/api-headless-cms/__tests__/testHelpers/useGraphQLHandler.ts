import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws";
import { INSTALL_MUTATION, IS_INSTALLED_QUERY } from "./graphql/settings";
import {
    ContentModelGroupsMutationVariables,
    CREATE_CONTENT_MODEL_GROUP_MUTATION,
    DELETE_CONTENT_MODEL_GROUP_MUTATION,
    GET_CONTENT_MODEL_GROUP_QUERY,
    LIST_CONTENT_MODEL_GROUP_QUERY,
    UPDATE_CONTENT_MODEL_GROUP_MUTATION
} from "./graphql/contentModelGroup";
import {
    CREATE_CONTENT_MODEL_FROM_MUTATION,
    CREATE_CONTENT_MODEL_MUTATION,
    CreateContentModelFromMutationVariables,
    CreateContentModelMutationResponse,
    CreateContentModelMutationVariables,
    DELETE_CONTENT_MODEL_MUTATION,
    GET_CONTENT_MODEL_QUERY,
    LIST_CONTENT_MODELS_QUERY,
    UPDATE_CONTENT_MODEL_MUTATION
} from "./graphql/contentModel";
import { PluginsContainer } from "@webiny/plugins/types";

import {
    GET_CONTENT_ENTRIES_QUERY,
    GET_CONTENT_ENTRY_QUERY,
    GET_LATEST_CONTENT_ENTRIES_QUERY,
    GET_LATEST_CONTENT_ENTRY_QUERY,
    GET_PUBLISHED_CONTENT_ENTRIES_QUERY,
    GET_PUBLISHED_CONTENT_ENTRY_QUERY,
    SEARCH_CONTENT_ENTRIES_QUERY,
    SearchContentEntriesVariables
} from "./graphql/contentEntry";
import { createHandlerCore, CreateHandlerCoreParams } from "./plugins";
import { acceptIncomingChanges } from "./acceptIncommingChanges";
import { StorageOperationsCmsModelPlugin } from "~/plugins";
import { createCmsModelFieldConvertersAttachFactory } from "~/utils/converters/valueKeyStorageConverter";
import { createOutputBenchmarkLogs } from "~tests/testHelpers/outputBenchmarkLogs";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import {
    CMS_EXPORT_STRUCTURE_QUERY,
    CMS_IMPORT_STRUCTURE_MUTATION,
    CMS_VALIDATE_STRUCTURE_MUTATION,
    CmsExportStructureQueryVariables,
    CmsImportStructureMutationVariables,
    CmsValidateStructureMutationResponse,
    CmsValidateStructureMutationVariables
} from "~tests/testHelpers/graphql/structure";
import { defaultIdentity } from "~tests/testHelpers/tenancySecurity";
import {
    GET_LOCK_RECORD_QUERY,
    IGetLockRecordGraphQlResponse,
    IGetLockRecordGraphQlVariables,
    IIsEntryLockedGraphQlResponse,
    IIsEntryLockedGraphQlVariables,
    ILockEntryGraphQlResponse,
    ILockEntryGraphQlVariables,
    IS_ENTRY_LOCKED_QUERY,
    IUnlockEntryGraphQlResponse,
    IUnlockEntryGraphQlVariables,
    IUnlockEntryRequestGraphQlResponse,
    IUnlockEntryRequestGraphQlVariables,
    LOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_MUTATION,
    UNLOCK_ENTRY_REQUEST_MUTATION
} from "./graphql/lockingMechanism";

export type GraphQLHandlerParams = CreateHandlerCoreParams;

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params: GraphQLHandlerParams = {}) => {
    const { identity, path } = params;

    const core = createHandlerCore(params);

    const plugins = new PluginsContainer(
        core.plugins.concat([...createOutputBenchmarkLogs(), acceptIncomingChanges()])
    );

    const storageOperationsCmsModelPlugin = new StorageOperationsCmsModelPlugin(
        createCmsModelFieldConvertersAttachFactory(plugins)
    );
    plugins.register(storageOperationsCmsModelPlugin);

    const handler = createHandler({
        plugins: plugins.all(),
        debug: false
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

    return {
        handler,
        invoke,
        tenant: core.tenant,
        identity: identity || defaultIdentity,
        plugins,
        storageOperations: core.storageOperations,
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
            return invoke({
                body: {
                    query: CMS_EXPORT_STRUCTURE_QUERY,
                    variables
                }
            });
        },
        async importCmsStructureMutation(variables: CmsImportStructureMutationVariables) {
            return invoke({
                body: {
                    query: CMS_IMPORT_STRUCTURE_MUTATION,
                    variables
                }
            });
        },
        async validateCmsStructureMutation(variables: CmsValidateStructureMutationVariables) {
            return invoke<CmsValidateStructureMutationResponse>({
                body: {
                    query: CMS_VALIDATE_STRUCTURE_MUTATION,
                    variables
                }
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
        },
        /**
         * Locking Mechanism
         */
        async isEntryLockedQuery(variables: IIsEntryLockedGraphQlVariables) {
            return invoke<IIsEntryLockedGraphQlResponse>({
                body: { query: IS_ENTRY_LOCKED_QUERY, variables }
            });
        },
        async getLockRecordQuery(variables: IGetLockRecordGraphQlVariables) {
            return invoke<IGetLockRecordGraphQlResponse>({
                body: { query: GET_LOCK_RECORD_QUERY, variables }
            });
        },
        async lockEntryMutation(variables: ILockEntryGraphQlVariables) {
            return invoke<ILockEntryGraphQlResponse>({
                body: { query: LOCK_ENTRY_MUTATION, variables }
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
