import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import {
    batchWriteAll,
    BatchWriteItem,
    count,
    ddbQueryAllWithCallback,
    forEachTenantLocale
} from "~/utils";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry, generateAlphaNumericId } from "@webiny/utils";
import { createBlockEntity } from "~/migrations/5.40.0/001/ddb/createBlockEntity";
import { ContentElement, PageBlock } from "./types";
import { compress, decompress } from "./compression";

const isGroupMigrationCompleted = (status: boolean | undefined): status is boolean => {
    return typeof status === "boolean";
};

export class PbUniqueBlockElementIds_5_40_0_001 implements DataMigration {
    private readonly table: Table<string, string, string>;
    private readonly blockEntity: ReturnType<typeof createBlockEntity>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.blockEntity = createBlockEntity(table);
    }

    getId() {
        return "5.40.0-001";
    }

    getDescription() {
        return "Generate unique element IDs in existing PB blocks.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                // We simply need to find out if there are any blocks stored in the system.
                const blocksCount = await count({
                    entity: this.blockEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#PB#BLOCKS`,
                    options: {
                        index: "GSI1"
                    }
                });

                if (blocksCount > 0) {
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

                await ddbQueryAllWithCallback<PageBlock>(
                    {
                        entity: this.blockEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#PB#BLOCKS`,
                        options: {
                            index: "GSI1",
                            gt: status || " "
                        }
                    },
                    async blocks => {
                        batch++;

                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${blocks.length} blocks).`
                        );

                        const items = await Promise.all(
                            blocks.map(async block => {
                                const newContent = await this.generateElementIds(block);
                                if (!newContent) {
                                    return null;
                                }

                                return this.blockEntity.putBatch({
                                    ...block,
                                    content: newContent
                                });
                            })
                        );

                        const execute = () => {
                            return batchWriteAll({
                                table: this.blockEntity.table,
                                items: items.filter(Boolean) as BatchWriteItem[]
                            });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                console.log(items);
                                console.log(error);
                            }
                        });

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = blocks[blocks.length - 1]?.id;

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

    private async generateElementIds(block: PageBlock) {
        const { content } = await decompress(block);

        // If block content already has an `id`, it means the block was already migrated.
        if (content.id) {
            return null;
        }

        const contentWithIds = this.ensureElementId(content);
        return compress(contentWithIds);
    }

    private ensureElementId(element: ContentElement): ContentElement {
        const id = element.id || element.data.variableId || generateAlphaNumericId(10);

        return {
            ...element,
            id,
            elements: element.elements.map(element => this.ensureElementId(element))
        };
    }
}

makeInjectable(PbUniqueBlockElementIds_5_40_0_001, [inject(PrimaryDynamoTableSymbol)]);
