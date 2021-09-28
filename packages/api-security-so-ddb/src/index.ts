import { ENTITIES, SecurityStorageParams } from "~/types";
import {
    ApiKey,
    CreateApiKeyParams,
    CreateGroupParams,
    CreateSystemParams,
    CreateTenantLinkParams,
    DeleteApiKeyParams,
    DeleteGroupParams,
    DeleteTenantLinkParams,
    GetApiKeyByTokenParams,
    GetApiKeyParams,
    GetGroupParams,
    GetSystemParams,
    GetTenantLinkByIdentityParams,
    Group,
    ListApiKeysParams,
    ListGroupsParams,
    ListTenantLinksByIdentityParams,
    ListTenantLinksByTypeParams,
    ListTenantLinksParams,
    SecurityStorageOperations,
    System,
    TenantLink,
    UpdateApiKeyParams,
    UpdateGroupParams,
    UpdateSystemParams,
    UpdateTenantLinkParams
} from "@webiny/api-security/types";
import Error from "@webiny/error";
import { createTable } from "~/definitions/table";
import {
    createApiKeyEntity,
    createGroupEntity,
    createSystemEntity,
    createTenantLinkEntity
} from "~/definitions/entities";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne, QueryOneParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = name => {
    if (reservedFields.includes(name)) {
        throw new Error(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
            name
        });
    }
};

export const createStorageOperations = (
    params: SecurityStorageParams
): SecurityStorageOperations => {
    const { table: tableName, documentClient, attributes = {} } = params;
    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({ table: tableName, documentClient });

    const entities = {
        apiKeys: createApiKeyEntity(table, attributes[ENTITIES.API_KEY]),
        system: createSystemEntity(table, attributes[ENTITIES.SYSTEM]),
        groups: createGroupEntity(table, attributes[ENTITIES.GROUP]),
        tenantLinks: createTenantLinkEntity(table, attributes[ENTITIES.TENANT_LINK])
    };

    return {
        createApiKey(params: CreateApiKeyParams): Promise<ApiKey> {
            return Promise.resolve(undefined);
        },
        createGroup(params: CreateGroupParams): Promise<Group> {
            return Promise.resolve(undefined);
        },
        createSystemData(params: CreateSystemParams): Promise<System> {
            return Promise.resolve(undefined);
        },
        createTenantLinks(params: CreateTenantLinkParams[]): Promise<void> {
            return Promise.resolve(undefined);
        },
        deleteApiKey(params: DeleteApiKeyParams): Promise<ApiKey> {
            return Promise.resolve(undefined);
        },
        deleteGroup(params: DeleteGroupParams): Promise<Group> {
            return Promise.resolve(undefined);
        },
        deleteTenantLinks(params: DeleteTenantLinkParams[]): Promise<void> {
            return Promise.resolve(undefined);
        },
        async getApiKey({ id, tenant }: GetApiKeyParams) {
            const keys = {
                PK: `T#${tenant}`,
                SK: `API_KEY#${id}`
            };

            try {
                const result = await entities.apiKeys.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.apiKeys, result.Item);
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not load api key.",
                    ex.code || "GET_API_KEY_ERROR",
                    { id, keys }
                );
            }
        },
        async getApiKeyByToken({ tenant, token }: GetApiKeyByTokenParams) {
            const queryParams: QueryOneParams = {
                entity: entities.apiKeys,
                partitionKey: `T#${tenant}`,
                options: {
                    eq: `API_KEY#${token}`,
                    index: "GSI1"
                }
            };

            try {
                const result = await queryOne<ApiKey>(queryParams);
                return cleanupItem(entities.apiKeys, result);
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not load api key by token.",
                    ex.code || "GET_BY_TOKEN_API_KEY_ERROR",
                    {
                        partitionKey: queryParams.partitionKey,
                        options: queryParams.options
                    }
                );
            }
        },
        getGroup(params: GetGroupParams): Promise<Group> {
            return Promise.resolve(undefined);
        },
        getSystemData(params: GetSystemParams): Promise<System> {
            return Promise.resolve(undefined);
        },
        getTenantLinkByIdentity<TLink = TenantLink>(
            params: GetTenantLinkByIdentityParams
        ): Promise<TLink> {
            return Promise.resolve(undefined);
        },
        async listApiKeys({ sort, tenant }: ListApiKeysParams): Promise<ApiKey[]> {
            let items: ApiKey[] = [];
            try {
                items = await queryAll<ApiKey>({
                    entity: entities.apiKeys,
                    partitionKey: `T#${tenant}`,
                    options: {
                        beginsWith: "API_KEY#"
                    }
                });
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not list api keys.",
                    ex.code || "LIST_API_KEY_ERROR"
                );
            }

            const sortedItems = sortItems({
                items,
                sort,
                fields: []
            });
            return sortedItems.map(item => cleanupItem(entities.apiKeys, item));
        },
        listGroups(params: ListGroupsParams): Promise<Group[]> {
            return Promise.resolve([]);
        },
        listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams): Promise<TenantLink[]> {
            return Promise.resolve([]);
        },
        listTenantLinksByTenant(params: ListTenantLinksParams): Promise<TenantLink[]> {
            return Promise.resolve([]);
        },
        listTenantLinksByType<TLink = TenantLink>(
            params: ListTenantLinksByTypeParams
        ): Promise<TLink[]> {
            return Promise.resolve([]);
        },
        updateApiKey(params: UpdateApiKeyParams): Promise<ApiKey> {
            return Promise.resolve(undefined);
        },
        updateGroup(params: UpdateGroupParams): Promise<Group> {
            return Promise.resolve(undefined);
        },
        updateSystemData(params: UpdateSystemParams): Promise<System> {
            return Promise.resolve(undefined);
        },
        updateTenantLinks(params: UpdateTenantLinkParams[]): Promise<void> {
            return Promise.resolve(undefined);
        }
    };
};
