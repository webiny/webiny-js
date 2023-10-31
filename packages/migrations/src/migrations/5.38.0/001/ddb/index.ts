import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { batchWriteAll, BatchWriteItem, forEachTenantLocale, queryAll } from "~/utils";
import { FbForm } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";

export class MultiStepForms_5_38_0_001 implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly table: Table;

    constructor(table: Table) {
        this.table = table;
        this.formEntity = createFormEntity(table);
    }

    getId() {
        return "5.38.0-001";
    }

    getDescription() {
        return "Convert forms to multi-step forms.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const ddbRecords = await queryAll<FbForm>({
                    entity: this.formEntity,
                    // Pulling all forms via the `T#root#L#en-US#FB#F` PK will suffice.
                    partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                });

                for (const ddbRecord of ddbRecords) {
                    if (!ddbRecord.steps) {
                        shouldExecute = true;
                        return false;
                    }
                }

                // Continue to the next locale.
                return true;
            }
        });

        return shouldExecute;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const ddbRecords = await Promise.all([
                    queryAll<FbForm>({
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                    }),
                    queryAll<FbForm>({
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#L`
                    }),
                    queryAll<FbForm>({
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#LP`
                    })
                ]).then(response => response.flat());

                if (!ddbRecords.length) {
                    // Continue to the next locale.
                    return true;
                }

                const items: BatchWriteItem[] = [];
                for (const ddbRecord of ddbRecords) {
                    if (ddbRecord.steps) {
                        continue;
                    }

                    // If no steps are defined, we need to create a single step.
                    ddbRecord.steps = [];

                    if (Array.isArray(ddbRecord.layout)) {
                        // If layout is an array, we need to create a single step with all the fields.
                        ddbRecord.steps = [{ title: "Step 1", layout: ddbRecord.layout }];
                        delete ddbRecord.layout;
                    }

                    items.push(this.formEntity.putBatch(ddbRecord));
                }

                const execute = () => {
                    return batchWriteAll({ table: this.formEntity.table, items });
                };

                logger.trace("Storing the DynamoDB records...");
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                        logger.error(error.message);
                    }
                });

                return true;
            }
        });

        logger.info("Updated all the forms.");
    }
}

makeInjectable(MultiStepForms_5_38_0_001, [inject(PrimaryDynamoTableSymbol)]);
