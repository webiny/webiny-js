import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStandardEntity, createTable } from "@webiny/db-dynamodb";
import { WebinyError } from "@webiny/error";
import type {
    AcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "@webiny/api-aco/types.js";
import { executeWithRetry } from "@webiny/utils";
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
    /** The tenant the storage acts on: its tenant scope's. */
    scopeTenant: ScopeTenant.Interface;
}

const createTableAndEntity = (documentClient: DynamoDBDocument) => {
    const table = createTable({
        name: String(process.env.DB_TABLE),
        documentClient
    });
    const entity = createStandardEntity<FolderLevelPermission>({
        table: table.table,
        name: "ACO.flp"
    });
    return { table, entity };
};

/** The table and entity, built once per client: the storage itself is built per tenant scope. */
const tablesByClient = new WeakMap<DynamoDBDocument, ReturnType<typeof createTableAndEntity>>();

interface CreateKeysParams {
    tenant: string;
    id: string;
}

interface CreateGsiKeysParams {
    tenant: string;
    id: string;
    type: string;
    path: string;
    parentId: string;
}

export class FolderLevelPermissionsStorageOperations implements AcoFolderLevelPermissionsStorageOperations {
    private readonly entity;
    private readonly table;
    private readonly scopeTenant: ScopeTenant.Interface;

    constructor({ documentClient, scopeTenant }: StorageOperationsConfig) {
        let tableAndEntity = tablesByClient.get(documentClient);
        if (!tableAndEntity) {
            tableAndEntity = createTableAndEntity(documentClient);
            tablesByClient.set(documentClient, tableAndEntity);
        }
        this.table = tableAndEntity.table;
        this.entity = tableAndEntity.entity;
        this.scopeTenant = scopeTenant;
    }

    /** The permission with its scope's tenant, checked against the one it carries. */
    private inScope<T extends { tenant?: string | null }>(record: T): T & { tenant: string } {
        return { ...record, tenant: this.scopeTenant.getId(record.tenant) };
    }

    public async list({
        where
    }: StorageOperationsListFlpsParams): Promise<FolderLevelPermission[]> {
        const { type, path_startsWith, parentId } = where;
        const tenant = this.scopeTenant.getId(where.tenant);
        try {
            if (parentId) {
                const entries = await this.entity.queryAll({
                    partitionKey: `T#${tenant}#FLP`,
                    options: {
                        index: "GSI2",
                        eq: parentId
                    }
                });
                return entries.map(entry => entry.data);
            }

            if (path_startsWith) {
                const entries = await this.entity.queryAll({
                    partitionKey: `T#${tenant}#AT#${type}#FLP`,
                    options: {
                        index: "GSI1",
                        beginsWith: path_startsWith
                    }
                });
                return entries.map(entry => entry.data);
            }

            // All folder level permissions of a folder type.
            if (type) {
                const entries = await this.entity.queryAll({
                    partitionKey: `T#${tenant}#AT#${type}#FLP`,
                    options: {
                        index: "GSI1"
                    }
                });
                return entries.map(entry => entry.data);
            }

            throw new WebinyError("Missing required parameters.", "LIST_FLP_MISSING_PARAMETERS", {
                tenant,
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

    public async get(params: StorageOperationsGetFlpParams): Promise<FolderLevelPermission | null> {
        const { id } = params;
        const tenant = this.scopeTenant.getId(params.tenant);
        try {
            const entry = await this.entity.get(this.createKeys({ tenant, id }));

            if (!entry) {
                return null;
            }

            return entry.data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load folder level permission.",
                code: "GET_FLP_ERROR",
                data: { tenant, id }
            });
        }
    }

    public async create(params: StorageOperationsCreateFlpParams): Promise<FolderLevelPermission> {
        const data = this.inScope(params.data);
        const keys = {
            ...this.createKeys(data),
            ...this.createGsiKeys(data)
        };

        try {
            await this.entity.put({
                ...keys,
                data
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
        const data = this.inScope({
            ...original,
            ...inputData
        });

        const keys = {
            ...this.createKeys(data),
            ...this.createGsiKeys(data)
        };

        try {
            await this.entity.put({
                ...keys,
                data
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

    public async delete(params: StorageOperationsDeleteFlpParams): Promise<void> {
        const flp = this.inScope(params.flp);
        const keys = this.createKeys(flp);

        try {
            await this.entity.delete(keys);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete folder level permission.",
                code: "DELETE_FLP_ERROR",
                data: {
                    keys,
                    flp
                }
            });
        }
    }

    public async batchUpdate({
        items
    }: StorageOperationsBatchUpdateFlpParams): Promise<FolderLevelPermission[]> {
        const scopedItems = items.map(({ original, data: inputData }) => {
            return this.inScope({
                ...original,
                ...inputData
            });
        });

        try {
            const batch = this.entity.createEntityWriter();

            const updatedItems: FolderLevelPermission[] = [];

            for (const data of scopedItems) {
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

    private createKeys({ id, tenant }: CreateKeysParams) {
        return {
            PK: `T#${tenant}#FLP#${id}`,
            SK: `A`,
            TYPE: "aco.flp"
        };
    }

    private createGsiKeys({ tenant, type, path, parentId }: CreateGsiKeysParams) {
        return {
            GSI1_PK: `T#${tenant}#AT#${type}#FLP`,
            GSI1_SK: path,
            GSI2_PK: `T#${tenant}#FLP`,
            GSI2_SK: parentId,
            GSI_TENANT: tenant
        };
    }
}
