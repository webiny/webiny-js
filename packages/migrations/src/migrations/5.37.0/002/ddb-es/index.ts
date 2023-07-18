import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createDdbEntryEntity, createDdbEsEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import {
    batchReadAll,
    BatchReadItem,
    batchWriteAll,
    BatchWriteItem,
    scan
} from "@webiny/db-dynamodb";
import { CmsEntry } from "../types";
import { Client } from "@elastic/elasticsearch";
import { ddbScanWithCallback } from "~/utils";
import { executeWithRetry } from "@webiny/utils";
import { getDecompressedData } from "~/migrations/5.37.0/002/utils/getDecompressedData";
import { getCompressedData } from "~/migrations/5.37.0/002/utils/getCompressedData";
import { inject, makeInjectable } from "@webiny/ioc";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface CmsEntriesRootFolderDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

interface DynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    data: string;
}

export class CmsEntriesRootFolder_5_37_0_002
    implements DataMigration<CmsEntriesRootFolderDataMigrationCheckpoint>
{
    private readonly elasticsearchClient: Client;
    private readonly ddbEntryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly ddbEsEntryEntity: ReturnType<typeof createDdbEsEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
        this.elasticsearchClient = elasticsearchClient;
        this.ddbEntryEntity = createDdbEntryEntity(table);
        this.ddbEsEntryEntity = createDdbEsEntryEntity(esTable);
        this.localeEntity = createLocaleEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "5.37.0-002";
    }

    getDescription() {
        return "Add default folderId to all CMS records.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const result = await scan<DynamoDbElasticsearchRecord>({
            entity: this.ddbEsEntryEntity,
            options: {
                filters: [
                    {
                        attr: "PK",
                        contains: "#CMS#"
                    }
                ],
                limit: 10
            }
        });

        if (result.items.length === 0) {
            logger.info(`No CMS entries found in the system; skipping migration.`);
            return false;
        } else if (result.error) {
            logger.error(result.error);
            throw new Error(result.error);
        }

        for (const item of result.items) {
            const data = await getDecompressedData<CmsEntry>(item.data);
            if (!data) {
                continue;
            }
            /**
             * If no location.folderId was set, we need to push the upgrade.
             */
            if (!data.location?.folderId) {
                return true;
            }
        }
        logger.info(`CMS entries already upgraded. skipping...`);
        return false;
    }

    async execute({ logger, ...context }: DataMigrationContext): Promise<void> {
        const migrationStatus = context.checkpoint || {};

        if (migrationStatus.lastEvaluatedKey === true) {
            logger.info(`Migration completed, no need to start again.`);
            return;
        }
        /**
         *
         */
        await ddbScanWithCallback<CmsEntry>(
            {
                entity: this.ddbEntryEntity,
                options: {
                    filters: [
                        {
                            attr: "TYPE",
                            beginsWith: "cms.entry"
                        }
                    ],
                    startKey: migrationStatus.lastEvaluatedKey || undefined,
                    limit: 100
                }
            },
            async result => {
                const ddbItems: BatchWriteItem[] = [];
                const ddbEsItems: BatchWriteItem[] = [];

                const ddbEsGetItems: Record<string, BatchReadItem> = {};
                /**
                 * Update the DynamoDB part of the records.
                 */
                for (const item of result.items) {
                    if (!!item.location?.folderId) {
                        continue;
                    }
                    ddbItems.push(
                        this.ddbEntryEntity.putBatch({
                            ...item,
                            location: {
                                ...item.location,
                                folderId: "root"
                            }
                        })
                    );
                    /**
                     * Prepare the loading of DynamoDB Elasticsearch part of the records.
                     */
                    if (ddbEsGetItems[`${item.entryId}:L`]) {
                        continue;
                    }
                    ddbEsGetItems[`${item.entryId}:L`] = this.ddbEsEntryEntity.getBatch({
                        PK: item.PK,
                        SK: "L"
                    });
                    if (item.status === "published") {
                        ddbEsGetItems[`${item.entryId}:P`] = this.ddbEsEntryEntity.getBatch({
                            PK: item.PK,
                            SK: "P"
                        });
                    }
                }
                /**
                 * Get all the records from DynamoDB Elasticsearch.
                 */
                const esRecords = await batchReadAll<DynamoDbElasticsearchRecord>({
                    table: this.ddbEsEntryEntity.table,
                    items: Object.values(ddbEsGetItems)
                });
                for (const esRecord of esRecords) {
                    const decompressedData = await getDecompressedData<CmsEntry>(esRecord.data);
                    if (!decompressedData) {
                        continue;
                    } else if (decompressedData.location?.folderId) {
                        continue;
                    }
                    const compressedData = await getCompressedData({
                        ...decompressedData,
                        location: {
                            ...decompressedData.location,
                            folderId: "root"
                        }
                    });
                    ddbEsItems.push(
                        this.ddbEsEntryEntity.putBatch({
                            ...esRecord,
                            data: compressedData
                        })
                    );
                }

                const execute = () => {
                    return batchWriteAll({
                        table: this.ddbEntryEntity.table,
                        items: ddbItems
                    });
                };

                const executeDdbEs = () => {
                    return batchWriteAll({
                        table: this.ddbEsEntryEntity.table,
                        items: ddbEsItems
                    });
                };

                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                        logger.error(error.message);
                    }
                });

                await executeWithRetry(executeDdbEs, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll ddb + es" attempt #${error.attemptNumber} failed.`
                        );
                        logger.error(error.message);
                    }
                });

                // Update checkpoint after every batch
                migrationStatus.lastEvaluatedKey = result.lastEvaluatedKey?.PK
                    ? (result.lastEvaluatedKey as unknown as LastEvaluatedKey)
                    : true;

                // Check if we should store checkpoint and exit.
                if (context.runningOutOfTime()) {
                    await context.createCheckpointAndExit(migrationStatus);
                } else {
                    await context.createCheckpoint(migrationStatus);
                }
            }
        );
        /**
         *
         */
        migrationStatus.lastEvaluatedKey = true;
        context.createCheckpoint(migrationStatus);
    }
}

makeInjectable(CmsEntriesRootFolder_5_37_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
