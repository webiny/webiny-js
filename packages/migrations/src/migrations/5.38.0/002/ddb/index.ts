import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { createFormSubmissionEntity } from "../entities/createFormSubmissionEntity";
import {
    batchWriteAll,
    BatchWriteItem,
    ddbScanWithCallback,
    forEachTenantLocale,
    queryAll,
    queryOne
} from "~/utils";
import { FbForm, FbFormSubmission } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface FolderSubmissionsDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

export class MultiStepForms_5_38_0_002 implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly formSubmissionEntity: ReturnType<typeof createFormSubmissionEntity>;
    private readonly table: Table;

    constructor(table: Table) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.formSubmissionEntity = createFormSubmissionEntity(table);
    }

    getId() {
        return "5.38.0-002";
    }

    getDescription() {
        return "Convert forms to multi-step forms (form submissions).";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const latestFormRecords = await queryAll<FbForm>({
                    entity: this.formEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#L`
                });

                const formIds = latestFormRecords.map(item => item.formId).filter(Boolean);
                const uniqueFormIds = [...new Set(formIds)];

                for (const formId of uniqueFormIds) {
                    // Get a form submission. If the "steps" property
                    // is not defined, we need to execute the migration.
                    const formSubmission = await queryOne<FbFormSubmission>({
                        entity: this.formSubmissionEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#FS#${formId}`
                    });

                    if (!formSubmission) {
                        continue;
                    }

                    if (!formSubmission.form.steps) {
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
        await ddbScanWithCallback<FbFormSubmission>(
            {
                entity: this.formSubmissionEntity,
                options: {
                    filters: [
                        {
                            attr: "TYPE",
                            eq: "fb.formSubmission"
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
                    if (item.form.steps) {
                        continue;
                    }

                    // If no steps are defined, we need to create a single step.
                    item.form.steps = [];

                    if (Array.isArray(item.form.layout)) {
                        // If layout is an array, we need to create a single step with all the fields.
                        item.form.steps = [{ title: "Step 1", layout: item.form.layout }];
                        delete item.form.layout;
                    }

                    items.push(this.formSubmissionEntity.putBatch(item));
                }

                const execute = () => {
                    return batchWriteAll({ table: this.formSubmissionEntity.table, items });
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

makeInjectable(MultiStepForms_5_38_0_002, [inject(PrimaryDynamoTableSymbol)]);
