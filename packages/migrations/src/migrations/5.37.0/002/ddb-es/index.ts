import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    Logger,
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
import {
    ddbScanWithCallback,
    esGetIndexName,
    esGetIndexSettings,
    esPutIndexSettings
} from "~/utils";
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

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

interface CmsEntriesRootFolderDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
    indexes: {
        [index: string]: IndexSettings | null;
    };
}

interface FetchOriginalElasticsearchSettingsParams {
    index: string;
    logger: Logger;
}

interface RestoreOriginalElasticsearchSettingsParams {
    migrationStatus: CmsEntriesRootFolderDataMigrationCheckpoint;
    logger: Logger;
}

interface DisableElasticsearchIndexingParams {
    index: string;
    logger: Logger;
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

    public constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        elasticsearchClient: Client
    ) {
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
        /**
         * We will load a few CMS entryes
         */
        const result = await scan<DynamoDbElasticsearchRecord>({
            entity: this.ddbEsEntryEntity,
            options: {
                filters: [
                    {
                        attr: "PK",
                        contains: "#CMS#CME#"
                    }
                ],
                limit: 100
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

    async execute({
        logger,
        ...context
    }: DataMigrationContext<CmsEntriesRootFolderDataMigrationCheckpoint>): Promise<void> {
        const migrationStatus =
            context.checkpoint || ({} as CmsEntriesRootFolderDataMigrationCheckpoint);

        if (migrationStatus.lastEvaluatedKey === true) {
            await this.restoreOriginalElasticsearchSettings({
                migrationStatus,
                logger
            });
            logger.info(`Migration completed, no need to start again.`);
            return;
        }
        let usingKey = "";
        if (migrationStatus?.lastEvaluatedKey) {
            usingKey = JSON.stringify(migrationStatus.lastEvaluatedKey);
        }
        logger.debug(`Scanning DynamoDB Elasticsearch table... ${usingKey}`);
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
                    limit: 500
                }
            },
            async result => {
                logger.debug(`Processing ${result.items.length} items...`);
                const ddbItems: BatchWriteItem[] = [];
                const ddbEsItems: BatchWriteItem[] = [];

                const ddbEsGetItems: Record<string, BatchReadItem> = {};
                /**
                 * Update the DynamoDB part of the records.
                 */
                for (const item of result.items) {
                    const index = esGetIndexName({
                        tenant: item.tenant,
                        locale: item.locale,
                        type: item.modelId,
                        isHeadlessCmsModel: true
                    });
                    // Check for the elasticsearch index settings
                    if (!migrationStatus.indexes || migrationStatus.indexes[index] === undefined) {
                        // We need to fetch the index settings first
                        const settings = await this.fetchOriginalElasticsearchSettings({
                            index,
                            logger
                        });
                        // ... add it to the checkpoint...
                        migrationStatus.indexes = {
                            ...migrationStatus.indexes,
                            [index]: settings
                        };
                        // and then set not to index
                        await this.disableElasticsearchIndexing({
                            index,
                            logger
                        });
                    }
                    //
                    ddbItems.push(
                        this.ddbEntryEntity.putBatch({
                            ...item,
                            location: {
                                ...item.location,
                                folderId: item.location?.folderId || "root"
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
                    if (item.status === "published" || !!item.locked) {
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
                        logger.trace(
                            `Skipping record "${esRecord.PK}" as it is not a valid CMS entry...`
                        );
                        continue;
                    } else if (!context.forceExecute && decompressedData.location?.folderId) {
                        logger.trace(
                            `Skipping record "${decompressedData.entryId}" as it already has folderId defined...`
                        );
                        continue;
                    }
                    const compressedData = await getCompressedData({
                        ...decompressedData,
                        location: {
                            ...decompressedData.location,
                            folderId: "root"
                        }
                    });
                    const modified = new Date().toISOString();
                    ddbEsItems.push(
                        this.ddbEsEntryEntity.putBatch({
                            ...esRecord,
                            data: compressedData,
                            modified
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

                logger.trace("Storing the DynamoDB records...");
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

                logger.trace("Storing the DynamoDB Elasticsearch records...");
                await executeWithRetry(executeDdbEs, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll ddb + es" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

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
         * This is the end of the migration.
         */
        await this.restoreOriginalElasticsearchSettings({
            migrationStatus,
            logger
        });
        migrationStatus.lastEvaluatedKey = true;
        migrationStatus.indexes = {};
        context.createCheckpoint(migrationStatus);
    }

    private async fetchOriginalElasticsearchSettings(
        params: FetchOriginalElasticsearchSettingsParams
    ): Promise<IndexSettings | null> {
        const { index, logger } = params;
        try {
            const settings = await esGetIndexSettings({
                elasticsearchClient: this.elasticsearchClient,
                index,
                fields: ["number_of_replicas", "refresh_interval"]
            });
            return {
                number_of_replicas: settings.number_of_replicas || 1,
                refresh_interval: settings.refresh_interval || "1s"
            };
        } catch (ex) {
            logger.error(`Failed to fetch original Elasticsearch settings for index "${index}".`);
            logger.error({
                ...ex,
                message: ex.message,
                code: ex.code,
                data: ex.data
            });
        }
        return null;
    }

    private async restoreOriginalElasticsearchSettings(
        params: RestoreOriginalElasticsearchSettingsParams
    ): Promise<void> {
        const { migrationStatus, logger } = params;
        const indexes = migrationStatus.indexes;
        if (!indexes || typeof indexes !== "object") {
            return;
        }
        for (const index in indexes) {
            const settings = indexes[index];
            if (!settings || typeof settings !== "object") {
                continue;
            }
            try {
                await esPutIndexSettings({
                    elasticsearchClient: this.elasticsearchClient,
                    index,
                    settings: {
                        number_of_replicas: settings.number_of_replicas || 1,
                        refresh_interval: settings.refresh_interval || `1s`
                    }
                });
            } catch (ex) {
                logger.error(
                    `Failed to restore original settings for index "${index}". Please do it manually.`
                );
                logger.error({
                    ...ex,
                    message: ex.message,
                    code: ex.code,
                    data: ex.data
                });
            }
        }
    }

    private async disableElasticsearchIndexing(
        params: DisableElasticsearchIndexingParams
    ): Promise<void> {
        const { index, logger } = params;

        try {
            await esPutIndexSettings({
                elasticsearchClient: this.elasticsearchClient,
                index,
                settings: {
                    number_of_replicas: 0,
                    refresh_interval: -1
                }
            });
        } catch (ex) {
            logger.error(`Failed to disable indexing for index "${index}".`);
            logger.error({
                ...ex,
                message: ex.message,
                code: ex.code,
                data: ex.data
            });
        }
    }
}

makeInjectable(CmsEntriesRootFolder_5_37_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
