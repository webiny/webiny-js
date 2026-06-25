import { DynamoDbEntityFactory, DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { WebinyError } from "@webiny/error";
import { executeWithRetry } from "@webiny/utils";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";

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

class FolderLevelPermissionsStorageOperationsImpl implements FlpStorageOperations.Interface {
    private readonly entity;

    public constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        const table = tableFactory.create({
            name: String(process.env.DB_TABLE)
        });

        this.entity = entityFactory.createStandard<FlpStorageOperations.Permission>({
            client: table,
            name: "ACO.flp"
        });
    }

    public async list({
        where: { tenant, type, path_startsWith, parentId }
    }: FlpStorageOperations.ListParams): Promise<FlpStorageOperations.Permission[]> {
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

    public async get({
        tenant,
        id
    }: FlpStorageOperations.GetParams): Promise<FlpStorageOperations.Permission | null> {
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

    public async create({
        data
    }: FlpStorageOperations.CreateParams): Promise<FlpStorageOperations.Permission> {
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
    }: FlpStorageOperations.UpdateParams): Promise<FlpStorageOperations.Permission> {
        try {
            const data = {
                ...original,
                ...inputData
            };

            const keys = {
                ...this.createKeys(data),
                ...this.createGsiKeys(data)
            };

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

    public async delete({ flp }: FlpStorageOperations.DeleteParams): Promise<void> {
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
    }: FlpStorageOperations.BatchUpdateParams): Promise<FlpStorageOperations.Permission[]> {
        try {
            const batch = this.entity.createEntityWriter();

            const updatedItems: FlpStorageOperations.Permission[] = [];

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

export const FolderLevelPermissionsStorageOperations = FlpStorageOperations.createImplementation({
    implementation: FolderLevelPermissionsStorageOperationsImpl,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
