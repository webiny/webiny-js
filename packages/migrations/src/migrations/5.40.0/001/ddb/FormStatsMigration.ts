import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { createDdbCmsEntity } from "../entities/createCmsEntity";
import { batchWriteAll, ddbQueryAllWithCallback, forEachTenantLocale, queryOne } from "~/utils";
import { executeWithRetry } from "@webiny/utils";

import { getFormStatsMetaFields, getStatsCommonFields } from "../utils";
import { FbForm, MigrationCheckpoint } from "../types";

export class FormBuilder_5_40_0_001_FormStats implements DataMigration<MigrationCheckpoint> {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly cmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.cmsEntity = createDdbCmsEntity(table);
    }

    getId() {
        return "Form Stats Entries";
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
                logger.info(`Checking form stats for ${tenantId} - ${localeCode}.`);

                const formRevision = await queryOne<FbForm>({
                    entity: this.formEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                });

                if (!formRevision) {
                    logger.info(
                        `No form stats found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    shouldExecute = false;
                    return true;
                }

                const [formId, revisionId] = formRevision.id.split("#");

                const cmsStats = await queryOne<FbForm>({
                    entity: this.cmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}-${revisionId}-stats`,
                    options: {
                        eq: "L"
                    }
                });

                if (!cmsStats) {
                    logger.info(
                        `No CMS entries for Form stats found for ${tenantId} - ${localeCode}: executing migration.`
                    );
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next locale.
                logger.info(
                    `Form stats already migrated for ${tenantId} - ${localeCode}: skipping migration.`
                );
                return true;
            }
        });

        return shouldExecute;
    }

    async execute({ logger }: DataMigrationContext<MigrationCheckpoint>): Promise<void> {
        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                await ddbQueryAllWithCallback<FbForm>(
                    {
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                    },
                    async forms => {
                        const items: ReturnType<
                            ReturnType<typeof createDdbCmsEntity>["putBatch"]
                        >[] = [];

                        for (const form of forms) {
                            const [formId, revisionId] = form.id.split("#");

                            // Get common fields
                            const commonFields = getStatsCommonFields(form);

                            // Get the new meta fields
                            const entryMetaFields = getFormStatsMetaFields(form);

                            const revision = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}-${revisionId}-stats`,
                                SK: `REV#0001`,
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fbFormStat#A`,
                                GSI1_SK: `${formId}-${revisionId}-stats#0001`,
                                TYPE: "cms.entry",
                                ...commonFields,
                                ...entryMetaFields
                            };

                            items.push(this.cmsEntity.putBatch(revision));

                            const latest = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}-${revisionId}-stats`,
                                SK: "L",
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fbFormStat#L`,
                                GSI1_SK: `${formId}-${revisionId}-stats#0001`,
                                TYPE: "cms.entry.l",
                                ...commonFields,
                                ...entryMetaFields
                            };

                            items.push(this.cmsEntity.putBatch(latest));
                        }

                        const execute = () => {
                            return batchWriteAll({ table: this.cmsEntity.table, items });
                        };

                        // logger.trace("Storing the CMS records...");
                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });
                    }
                );

                return true;
            }
        });

        logger.info("Updated all form stats.");
    }
}
