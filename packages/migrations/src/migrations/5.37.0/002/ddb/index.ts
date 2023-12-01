import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { batchWriteAll, BatchWriteItem, ddbScanWithCallback, scan } from "~/utils";
import { CmsEntry } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface CmsEntriesRootFolderDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

export class CmsEntriesRootFolder_5_37_0_002
    implements DataMigration<CmsEntriesRootFolderDataMigrationCheckpoint>
{
    private readonly entryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.entryEntity = createDdbEntryEntity(table);
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
         * We will go through a larger amount of the entries, to determine if they need to be updated.
         */
        const result = await scan<CmsEntry>({
            entity: this.entryEntity,
            options: {
                index: "GSI1",
                filters: [
                    {
                        attr: "TYPE",
                        beginsWith: "cms.entry"
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
            /**
             * If no location.folderId was set, we need to push the upgrade.
             */
            if (!item.location?.folderId) {
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
        const migrationStatus = context.checkpoint || {};

        if (migrationStatus.lastEvaluatedKey === true) {
            logger.info(`Migration completed, no need to start again.`);
            return;
        }

        let usingKey = "";
        if (migrationStatus?.lastEvaluatedKey) {
            usingKey = JSON.stringify(migrationStatus.lastEvaluatedKey);
        }
        logger.debug(`Scanning DynamoDB table... ${usingKey}`);
        await ddbScanWithCallback<CmsEntry>(
            {
                entity: this.entryEntity,
                options: {
                    index: "GSI1",
                    filters: [
                        {
                            attr: "TYPE",
                            beginsWith: "cms.entry"
                        }
                    ],
                    startKey: migrationStatus.lastEvaluatedKey || undefined,
                    limit: 1000
                }
            },
            async result => {
                logger.debug(`Processing ${result.items.length} items...`);
                const items: BatchWriteItem[] = [];
                for (const item of result.items) {
                    if (!!item.location?.folderId) {
                        continue;
                    }
                    items.push(
                        this.entryEntity.putBatch({
                            ...item,
                            location: {
                                ...item.location,
                                folderId: "root"
                            }
                        })
                    );
                }

                const execute = () => {
                    return batchWriteAll({ table: this.entryEntity.table, items });
                };

                logger.trace("Storing the DynamoDB records...");
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                        logger.error(error.message);
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

        migrationStatus.lastEvaluatedKey = true;
        context.createCheckpoint(migrationStatus);
    }
}

makeInjectable(CmsEntriesRootFolder_5_37_0_002, [inject(PrimaryDynamoTableSymbol)]);
