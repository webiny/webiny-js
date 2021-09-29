// @ts-nocheck
import {
    ApiKey,
    ApiKeyStorageOperations,
    CreateApiKeyParams,
    ApiKeyStorageOperationsDeleteParams,
    GetApiKeyByTokenParams,
    GetApiKeyParams,
    ListApiKeysParams,
    ApiKeyStorageOperationsUpdateParams
} from "@webiny/api-security/types";
import Error from "@webiny/error";
import { Entity, Table } from "dynamodb-toolbox";
import { createTable } from "~/definitions/table";
import { createApiKeyEntity } from "~/definitions/apiKeyEntity";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne, QueryOneParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { SecurityStorageParams } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export class ApiKeyStorageOperationsDdb implements ApiKeyStorageOperations {
    protected readonly tenant: string;
    protected readonly plugins: PluginsContainer;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;

    public constructor({ plugins, tenant, table, documentClient }: SecurityStorageParams) {
        this.tenant = tenant;
        this.plugins = plugins;
        this.table = createTable({ table, documentClient });
        this.entity = createApiKeyEntity({ plugins, table: this.table });
    }

    public async get({ id }: GetApiKeyParams): Promise<ApiKey> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey(id)
        };

        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return this.cleanupItem(result.Item);
        } catch (ex) {
            throw new Error(
                ex.message || "Could not load api key.",
                ex.code || "GET_API_KEY_ERROR",
                {
                    keys,
                    id
                }
            );
        }
    }

    public async getByToken({ token }: GetApiKeyByTokenParams): Promise<ApiKey> {
        const queryParams: QueryOneParams = {
            entity: this.entity,
            partitionKey: this.createGsiPartitionKey(),
            options: {
                eq: this.createGsiSortKey(token),
                index: "GSI1"
            }
        };

        try {
            const result = await queryOne<ApiKey>(queryParams);
            return this.cleanupItem(result);
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
    }

    public async list({ sort }: ListApiKeysParams): Promise<ApiKey[]> {
        let items: ApiKey[] = [];
        try {
            items = await queryAll<ApiKey>({
                entity: this.entity,
                partitionKey: this.createPartitionKey(),
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
            plugins: this.plugins,
            fields: ["createdOn"]
        });
        return sortedItems.map(item => this.cleanupItem(item));
    }

    public async create({ apiKey }: CreateApiKeyParams): Promise<ApiKey> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey(apiKey.id),
            GSI1_PK: this.createGsiPartitionKey(),
            GSI1_SK: this.createGsiSortKey(apiKey.token)
        };

        try {
            await this.entity.put({
                ...apiKey,
                TYPE: "security.apiKey",
                ...keys
            });
            return apiKey;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create api key.",
                ex.code || "CREATE_API_KEY_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async update({ apiKey }: ApiKeyStorageOperationsUpdateParams): Promise<ApiKey> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey(apiKey.id)
        };

        try {
            await this.entity.put({
                ...apiKey,
                TYPE: "security.apiKey",
                ...keys
            });
            return apiKey;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update api key.",
                ex.code || "UPDATE_API_KEY_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async delete({ apiKey }: ApiKeyStorageOperationsDeleteParams): Promise<ApiKey> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.createSortKey(apiKey.id)
        };

        try {
            await this.entity.delete(keys);
            return apiKey;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update api key.",
                ex.code || "UPDATE_API_KEY_ERROR",
                {
                    keys
                }
            );
        }
    }

    protected createPartitionKey(): string {
        return `T#${this.tenant}`;
    }

    protected createSortKey(id: string): string {
        return `API_KEY#${id}`;
    }

    protected createGsiPartitionKey(): string {
        return `T#${this.tenant}`;
    }

    protected createGsiSortKey(token: string): string {
        return `API_KEY#${token}`;
    }

    private cleanupItem(item: ApiKey & Record<string, any>): ApiKey {
        return cleanupItem(this.entity, item, ["TYPE"]);
    }
}
