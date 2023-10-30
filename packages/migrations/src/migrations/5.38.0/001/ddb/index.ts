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
import { scanWithCallback } from "@webiny/db-dynamodb";
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
        return "Convert forms tu multi-step forms.";
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
        await scanWithCallback<FbForm>(
            {
                entity: this.formEntity,
                options: {}
            },
            async result => {
                const items: BatchWriteItem[] = [];
                for (const current of result.items) {
                    const isFbForm = this.isFbFormRecord(current);
                    if (!isFbForm) {
                        continue;
                    }

                    if (current.steps) {
                        continue;
                    }

                    // If no steps are defined, we need to create a single step.
                    current.steps = [];

                    if (Array.isArray(current.layout)) {
                        // If layout is an array, we need to create a single step with all the fields.
                        current.steps = [{ title: "Step 1", layout: current.layout }];
                        delete current.layout;
                    }

                    items.push(this.formEntity.putBatch(current));
                }

                if (!items.length) {
                    return;
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
            }
        );

        logger.info("Updated all the forms.");
    }

    private isFbFormRecord(record: FbForm): boolean {
        // fb.formSubmission
        const recordType = record.TYPE;
        if (!recordType) {
            return false;
        }

        // We must ensure "fb.formSubmission" are not included.
        return recordType.startsWith("fb.form") && recordType !== "fb.formSubmission";
    }
}

makeInjectable(MultiStepForms_5_38_0_001, [inject(PrimaryDynamoTableSymbol)]);
