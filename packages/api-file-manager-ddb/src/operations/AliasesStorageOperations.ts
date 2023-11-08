import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import {
    FileManagerAliasesStorageOperations,
    File,
    FileAlias
} from "@webiny/api-file-manager/types";
import {
    BatchWriteItem,
    batchWriteAll,
    createStandardEntity,
    createTable,
    DbItem,
    queryAll
} from "@webiny/db-dynamodb";

interface AliasesStorageOperationsConfig {
    documentClient: DynamoDBClient;
}

interface CreatePartitionKeyParams {
    locale: string;
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
        const items: BatchWriteItem[] = [];

        aliasItems.forEach(item => {
            items.push(
                this.aliasEntity.deleteBatch({
                    PK: this.createPartitionKey({
                        id: item.fileId,
                        tenant: item.tenant,
                        locale: item.locale
                    }),
                    SK: `ALIAS#${item.alias}`
                })
            );
        });

        await batchWriteAll({ table: this.table, items });
    }

    async storeAliases(file: File): Promise<void> {
        const items: BatchWriteItem[] = [];
        const existingAliases = await this.getExistingAliases(file);
        const newAliases = this.createNewAliasesRecords(file, existingAliases);

        newAliases.forEach(alias => {
            items.push(this.aliasEntity.putBatch(alias));
        });

        // Delete aliases that are in the DB but are NOT in the file.
        for (const data of existingAliases) {
            if (!file.aliases.some(alias => data.alias === alias)) {
                items.push(
                    this.aliasEntity.deleteBatch({
                        PK: this.createPartitionKey(file),
                        SK: `ALIAS#${data.alias}`
                    })
                );
            }
        }

        await batchWriteAll({
            table: this.table,
            items
        });
    }

    private async getExistingAliases(file: File) {
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
        const { tenant, locale, id } = params;
        return `T#${tenant}#L#${locale}#FM#F${id}`;
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
                        locale: file.locale,
                        fileId: file.id,
                        key: file.key
                    }
                };
            })
            .filter(Boolean) as DbItem<FileAlias>[];
    }
}
