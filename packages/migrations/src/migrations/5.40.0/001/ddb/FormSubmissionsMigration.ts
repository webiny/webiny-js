import { Table } from "@webiny/db-dynamodb/toolbox";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createDdbCmsEntity } from "../entities/createCmsEntity";
import { createFormSubmissionEntity } from "../entities/createFormSubmissionEntity";
import { createFormEntity } from "../entities/createFormEntity";
import {
    batchWriteAll,
    BatchWriteItem,
    ddbQueryAllWithCallback,
    ddbScanWithCallback,
    forEachTenantLocale,
    queryOne
} from "~/utils";
import {
    getFormSubmissionCommonFields,
    getFormSubmissionMetaFields
} from "~/migrations/5.40.0/001/utils";
import { CmsEntryWithMeta, FbForm, FbSubmission } from "../types";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
}

interface FormSubmissionsDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

export class FormBuilder_5_40_0_001_FormSubmissions implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly formSubmissionEntity: ReturnType<typeof createFormSubmissionEntity>;
    private readonly cmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.formSubmissionEntity = createFormSubmissionEntity(table);
        this.cmsEntity = createDdbCmsEntity(table);
    }

    getId() {
        return "Form Submission Entries";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                logger.info(`Checking form submissions for ${tenantId} - ${localeCode}.`);

                await ddbQueryAllWithCallback<FbForm>(
                    {
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                    },
                    async forms => {
                        for (const form of forms) {
                            const [formId] = form.id.split("#");
                            logger.trace(
                                `Checking form submissions for form with id: ${formId} (${tenantId} - ${localeCode}).`
                            );

                            const formSubmission = await queryOne<FbSubmission>({
                                entity: this.formSubmissionEntity,
                                partitionKey: `T#${tenantId}#L#${localeCode}#FB#FS#${formId}`
                            });

                            // If no form submission found -> continue with next form
                            if (!formSubmission) {
                                logger.trace(
                                    `No form submissions found for form with id: ${formId} (${tenantId} - ${localeCode}).`
                                );
                                continue;
                            }

                            const cmsSubmission = await queryOne<CmsEntryWithMeta>({
                                entity: this.cmsEntity,
                                partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formSubmission.id}`,
                                options: {
                                    eq: "L"
                                }
                            });

                            if (!cmsSubmission) {
                                logger.trace(
                                    `Form submissions found for form with id: ${formId} (${tenantId} - ${localeCode}): need migration!.`
                                );
                                shouldExecute = true;
                                continue;
                            }

                            logger.trace(
                                `Form submissions already migrated for form with id: ${formId} (${tenantId} - ${localeCode}).`
                            );
                        }
                    }
                );

                // Let's stop it if previous locale iteration found submissions to migrate.
                if (shouldExecute) {
                    logger.info(
                        `Form submissions found for ${tenantId} - ${localeCode}: executing migration.`
                    );
                } else {
                    logger.info(
                        `No form submissions found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                }

                return !shouldExecute;
            }
        });

        return shouldExecute;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<FormSubmissionsDataMigrationCheckpoint>): Promise<void> {
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

        await ddbScanWithCallback<FbSubmission>(
            {
                entity: this.formSubmissionEntity,
                options: {
                    filters: [
                        {
                            attr: "TYPE",
                            beginsWith: "fb.formSubmission"
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
                    const { tenant, locale, id } = item;

                    // Get common fields
                    const commonFields = getFormSubmissionCommonFields(item);

                    // Get the new meta fields
                    const entryMetaFields = getFormSubmissionMetaFields(item);

                    const revision = {
                        PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${id}`,
                        SK: `REV#0001`,
                        GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#fbSubmission#A`,
                        GSI1_SK: `${id}#0001`,
                        TYPE: "cms.entry",
                        ...commonFields,
                        ...entryMetaFields
                    };

                    items.push(this.cmsEntity.putBatch(revision));

                    const latest = {
                        PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${id}`,
                        SK: "L",
                        GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#fbSubmission#L`,
                        GSI1_SK: `${id}#0001`,
                        TYPE: "cms.entry.l",
                        ...commonFields,
                        ...entryMetaFields
                    };

                    items.push(this.cmsEntity.putBatch(latest));
                }

                const execute = () => {
                    return batchWriteAll({ table: this.cmsEntity.table, items });
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

        logger.info("Updated all form submissions.");
    }
}

makeInjectable(FormBuilder_5_40_0_001_FormSubmissions, [inject(PrimaryDynamoTableSymbol)]);
