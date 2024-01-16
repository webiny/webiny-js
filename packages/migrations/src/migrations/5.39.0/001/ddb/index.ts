import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { batchWriteAll, BatchWriteItem, ddbScanWithCallback, scan } from "~/utils";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";
import { CmsEntry } from "../types";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { assignNewMetaFields } from "../utils/assignNewMetaFields";
import { isMigratedEntry } from "../utils/isMigratedEntry";
import { getOldestRevisionCreatedOn } from "../utils/getOldestRevisionCreatedOn";
import { getFirstLastPublishedOnBy } from "~/migrations/5.39.0/001/utils/getFirstLastPublishedOn";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface FolderSubmissionsDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

export class CmsEntriesInitNewMetaFields_5_39_0_001 implements DataMigration {
    private readonly entryEntity: ReturnType<typeof createDdbEntryEntity>;

    constructor(table: Table<string, string, string>) {
        this.entryEntity = createDdbEntryEntity(table);
    }

    getId() {
        return "5.39.0-001";
    }

    getDescription() {
        return "Write new revision and entry-level on/by meta fields.";
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
            if (!isMigratedEntry(item)) {
                return true;
            }
        }

        logger.info(`CMS entries already upgraded. skipping...`);
        return false;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<FolderSubmissionsDataMigrationCheckpoint>): Promise<void> {
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
                    if (isMigratedEntry(item)) {
                        continue;
                    }

                    // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                    const createdOn = await getOldestRevisionCreatedOn({
                        entry: item,
                        entryEntity: this.entryEntity
                    });

                    const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                        entry: item,
                        entryEntity: this.entryEntity
                    });

                    assignNewMetaFields(item, {
                        createdOn,
                        ...firstLastPublishedOnByFields
                    });

                    items.push(this.entryEntity.putBatch(item));
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

makeInjectable(CmsEntriesInitNewMetaFields_5_39_0_001, [inject(PrimaryDynamoTableSymbol)]);
