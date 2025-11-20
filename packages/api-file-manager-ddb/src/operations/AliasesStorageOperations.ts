import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Entity, Table } from "@webiny/db-dynamodb/toolbox.js";
import type {
    File,
    FileAlias,
    FileManagerAliasesStorageOperations
} from "@webiny/api-file-manager/types.js";
import type { DbItem } from "@webiny/db-dynamodb";
import {
    createEntityWriteBatch,
    createStandardEntity,
    createTable,
    queryAll
} from "@webiny/db-dynamodb";

interface AliasesStorageOperationsConfig {
    documentClient: DynamoDBDocument;
}

interface CreatePartitionKeyParams {
    tenant: string;
    id: string;
}

export class AliasesStorageOperations implements FileManagerAliasesStorageOperations {
    private readonly aliasEntity: Entity<any>;
    private readonly table: Table<string, string, string>;

    constructor({ documentClient }: AliasesStorageOperationsConfig) {
        this.table = createTable({ documentClient });

        this.aliasEntity = createStandardEntity({
            table: this.table,
            name: "FM.FileAlias"
        });
    }

    async deleteAliases(file: File): Promise<void> {
        const aliasItems = await this.getExistingAliases(file);

        const batchWrite = createEntityWriteBatch({
            entity: this.aliasEntity,
            delete: aliasItems.map(item => {
                return {
                    PK: this.createPartitionKey({
                        id: item.fileId,
                        tenant: item.tenant
                    }),
                    SK: `ALIAS#${item.alias}`
                };
            })
        });

        await batchWrite.execute();
    }

    async storeAliases(file: File): Promise<void> {
        const existingAliases = await this.getExistingAliases(file);
        const newAliases = this.createNewAliasesRecords(file, existingAliases);

        const batchWrite = createEntityWriteBatch({
            entity: this.aliasEntity
        });
        for (const alias of newAliases) {
            batchWrite.put(alias);
        }

        // Delete aliases that are in the DB but are NOT in the file.
        for (const data of existingAliases) {
            if (!file.aliases.some(alias => data.alias === alias)) {
                batchWrite.delete({
                    PK: this.createPartitionKey(file),
                    SK: `ALIAS#${data.alias}`
                });
            }
        }

        await batchWrite.execute();
    }

    private async getExistingAliases(file: File): Promise<FileAlias[]> {
        const aliases = await queryAll<{ data: FileAlias }>({
            entity: this.aliasEntity,
            partitionKey: this.createPartitionKey(file),
            options: {
                beginsWith: "ALIAS#"
            }
        });

        return aliases.map(alias => alias.data);
    }

    private createPartitionKey(params: CreatePartitionKeyParams): string {
        const { tenant, id } = params;
        return `T#${tenant}#FM#F${id}`;
    }

    private createNewAliasesRecords(
        file: File,
        existingAliases: FileAlias[] = []
    ): DbItem<FileAlias>[] {
        return (file.aliases || [])
            .map(alias => {
                // If alias is already in the DB, skip it.
                if (existingAliases.find(item => item.alias === alias)) {
                    return null;
                }

                // Add a new alias.
                return {
                    PK: this.createPartitionKey(file),
                    SK: `ALIAS#${alias}`,
                    GSI1_PK: `T#${file.tenant}#FM#FILE_ALIASES`,
                    GSI1_SK: alias,
                    TYPE: "fm.fileAlias",
                    data: {
                        alias,
                        tenant: file.tenant,
                        fileId: file.id,
                        key: file.key
                    }
                };
            })
            .filter(Boolean) as DbItem<FileAlias>[];
    }
}
