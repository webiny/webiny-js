import { Table } from "@webiny/db-dynamodb/toolbox";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import {
    createOldPageBlockEntity,
    createNewPageBlockEntity
} from "../entities/createPageBlockEntity";
import { batchWriteAll, ddbQueryAllWithCallback, forEachTenantLocale, count } from "~/utils";
import { PbPageBlock } from "../types";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { compressContent } from "./compressContent";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class PageBlocks_5_38_0_003 implements DataMigration {
    private readonly oldPageBlockEntity: ReturnType<typeof createOldPageBlockEntity>;
    private readonly newPageBlockEntity: ReturnType<typeof createNewPageBlockEntity>;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.oldPageBlockEntity = createOldPageBlockEntity(table);
        this.newPageBlockEntity = createNewPageBlockEntity(table);
    }

    getId() {
        return "5.38.0-003";
    }

    getDescription() {
        return "Compress block content, and add GSI1.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                // We're doing `queryAll` because, at this point in time, this feature is
                // quite new, and we know there won't be a large number of records, so no need to paginate.
                const oldBlocksCount = await count({
                    entity: this.oldPageBlockEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#PB#B`
                });

                const newBlocksCount = await count({
                    entity: this.newPageBlockEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#PB#BLOCKS`,
                    options: {
                        index: "GSI1"
                    }
                });

                if (newBlocksCount < oldBlocksCount) {
                    shouldExecute = true;
                    return false;
                }
                // Continue to the next locale.
                return true;
            }
        });

        return shouldExecute;
    }

    async execute({ logger, ...context }: DataMigrationContext): Promise<void> {
        const migrationStatus = context.checkpoint || {};

        let batch = 0;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const groupId = `${tenantId}:${localeCode}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    return true;
                }

                await ddbQueryAllWithCallback<PbPageBlock>(
                    {
                        entity: this.oldPageBlockEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#PB#B`,
                        options: {
                            gt: status || " "
                        }
                    },
                    async oldBlocks => {
                        batch++;

                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${oldBlocks.length} blocks).`
                        );

                        const items = await Promise.all(
                            oldBlocks.map(async oldBlock => {
                                const newPageBlock = {
                                    ...oldBlock,
                                    PK: `T#${tenantId}#L#${localeCode}#PB#BLOCK#${oldBlock.id}`,
                                    SK: "A",
                                    GSI1_PK: `T#${tenantId}#L#${localeCode}#PB#BLOCKS`,
                                    // We need the ability to filter by category slug, and `id` is for uniqueness.
                                    GSI1_SK: `${oldBlock.blockCategory}#${oldBlock.id}`,
                                    content: await compressContent(oldBlock.content)
                                };

                                // We no longer have a `preview`.
                                delete newPageBlock["preview"];

                                return this.newPageBlockEntity.putBatch(newPageBlock);
                            })
                        );

                        const execute = () => {
                            return batchWriteAll({ table: this.newPageBlockEntity.table, items });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = oldBlocks[oldBlocks.length - 1]?.id;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                );

                // Mark group as completed.
                migrationStatus[groupId] = true;

                // Store checkpoint.
                await context.createCheckpoint(migrationStatus);

                // Continue processing.
                return true;
            }
        });
    }
}

makeInjectable(PageBlocks_5_38_0_003, [inject(PrimaryDynamoTableSymbol)]);
