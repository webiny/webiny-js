import { Entity, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    createStandardEntity,
    createTable,
    deleteItem,
    getClean,
    put,
    queryAllClean
} from "@webiny/db-dynamodb";
import { createEntityWriteBatch } from "@webiny/db-dynamodb/utils/entity/EntityWriteBatch.js";

import { WebinyError } from "@webiny/error";
import type {
    AcoFolderLevelPermissionsStorageOperations as IAcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "~/flp/flp.types.js";
import { executeWithRetry } from "@webiny/utils";

interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
}

interface CreateKeysParams {
    tenant: string;
    locale: string;
    id: string;
}

interface CreateGsiKeysParams {
    tenant: string;
    locale: string;
    id: string;
    type: string;
    path: string;
    parentId: string;
}

class FolderLevelPermissionsStorageOperations
    implements IAcoFolderLevelPermissionsStorageOperations
{
    private readonly entity: Entity<any>;
    private readonly table: Table<string, string, string>;

    constructor({ documentClient }: StorageOperationsConfig) {
        this.table = createTable({
            documentClient
        });

        this.entity = createStandardEntity({
            table: this.table,
            name: "ACO.flp"
        });
    }

    public async list({
        where: { tenant, locale, type, path_startsWith, parentId }
    }: StorageOperationsListFlpsParams): Promise<FolderLevelPermission[]> {
        try {
            if (parentId) {
                const entries = await queryAllClean<{ data: FolderLevelPermission }>({
                    entity: this.entity,
                    partitionKey: `T#${tenant}#L#${locale}#FLP`,
                    options: {
                        index: "GSI2",
                        eq: parentId
                    }
                });
                return entries.map(entry => entry.data);
            }

            if (path_startsWith) {
                const entries = await queryAllClean<{ data: FolderLevelPermission }>({
                    entity: this.entity,
                    partitionKey: `T#${tenant}#L#${locale}#AT#${type}#FLP`,
                    options: {
                        index: "GSI1",
                        beginsWith: path_startsWith
                    }
                });
                return entries.map(entry => entry.data);
            }

            throw new WebinyError("Missing required parameters.", "LIST_FLP_MISSING_PARAMETERS", {
                tenant,
                locale,
                type,
                path_startsWith,
                parentId
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list folder level permissions.",
                code: "LIST_FLP_ERROR"
            });
        }
    }

    public async get({
        tenant,
        locale,
        id
    }: StorageOperationsGetFlpParams): Promise<FolderLevelPermission | null> {
        try {
            const entry = await getClean<{ data: FolderLevelPermission }>({
                entity: this.entity,
                keys: this.createKeys({ tenant, locale, id })
            });

            if (!entry) {
                return null;
            }

            return entry.data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load folder level permission.",
                code: "GET_FLP_ERROR",
                data: { tenant, locale, id }
            });
        }
    }

    public async create({
        data
    }: StorageOperationsCreateFlpParams): Promise<FolderLevelPermission> {
        const keys = {
            ...this.createKeys(data),
            ...this.createGsiKeys(data)
        };

        try {
            await put({
                entity: this.entity,
                item: {
                    ...keys,
                    data
                }
            });

            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not create folder level permission.",
                code: "CREATE_FLP_ERROR",
                data: { keys, data }
            });
        }
    }

    public async update({
        data: inputData,
        original
    }: StorageOperationsUpdateFlpParams): Promise<FolderLevelPermission> {
        try {
            const data = {
                ...original,
                ...inputData
            };

            const keys = {
                ...this.createKeys(data),
                ...this.createGsiKeys(data)
            };

            await put({
                entity: this.entity,
                item: {
                    ...keys,
                    data
                }
            });

            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update folder level permission.",
                code: "UPDATE_FLP_ERROR",
                data: { inputData, original }
            });
        }
    }

    public async delete({ flp }: StorageOperationsDeleteFlpParams): Promise<void> {
        const keys = this.createKeys(flp);

        try {
            await deleteItem({
                entity: this.entity,
                keys
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete folder level permission.",
                code: "DELETE_FLP_ERROR",
                data: { keys, flp }
            });
        }
    }

    public async batchUpdate({
        items
    }: StorageOperationsBatchUpdateFlpParams): Promise<FolderLevelPermission[]> {
        try {
            const batch = createEntityWriteBatch({
                entity: this.entity
            });

            const updatedItems: FolderLevelPermission[] = [];

            for (const { original, data: inputData } of items) {
                const data = {
                    ...original,
                    ...inputData
                };

                const keys = {
                    ...this.createKeys(data),
                    ...this.createGsiKeys(data)
                };

                batch.put({
                    ...keys,
                    data
                });

                updatedItems.push(data);
            }

            await executeWithRetry(async () => {
                return await batch.execute();
            });

            return updatedItems;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not batch update folder level permissions.",
                code: "BATCH_UPDATE_FLP_ERROR",
                data: { items }
            });
        }
    }

    private createKeys({ id, tenant, locale }: CreateKeysParams) {
        return {
            PK: `T#${tenant}#L#${locale}#FLP#${id}`,
            SK: `A`
        };
    }

    private createGsiKeys({ tenant, locale, type, path, parentId }: CreateGsiKeysParams) {
        return {
            GSI1_PK: `T#${tenant}#L#${locale}#AT#${type}#FLP`,
            GSI1_SK: path,
            GSI2_PK: `T#${tenant}#L#${locale}#FLP`,
            GSI2_SK: parentId,
            GSI_TENANT: tenant
        };
    }
}

export const createFlpOperations = (params: StorageOperationsConfig) => {
    return new FolderLevelPermissionsStorageOperations(params);
};
