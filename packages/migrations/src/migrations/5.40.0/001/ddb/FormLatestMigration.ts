import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { createDdbCmsEntity } from "../entities/createCmsEntity";
import { batchWriteAll, ddbQueryAllWithCallback, forEachTenantLocale, queryOne } from "~/utils";
import { executeWithRetry } from "@webiny/utils";

import { createEntryCommonFields, createRevisionStatus } from "../utils";
import { FbForm, MigrationCheckpoint } from "../types";

export class FormBuilder_5_40_0_001_FormLatest implements DataMigration<MigrationCheckpoint> {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly cmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.cmsEntity = createDdbCmsEntity(table);
    }

    getId() {
        return "Form Latest Entries";
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
                logger.info(`Checking form latest entries for ${tenantId} - ${localeCode}.`);

                const form = await queryOne<FbForm>({
                    entity: this.formEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#L`
                });

                if (!form) {
                    logger.info(
                        `No form latest entry found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    shouldExecute = false;
                    return true;
                }

                const [formId] = form.id.split("#");

                const cmsEntry = await queryOne<FbForm>({
                    entity: this.cmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}`,
                    options: {
                        eq: "L"
                    }
                });

                if (!cmsEntry) {
                    logger.info(
                        `No latest CMS entries found for ${tenantId} - ${localeCode}: executing migration.`
                    );
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next locale.
                logger.info(
                    `Form latest entries already migrated for ${tenantId} - ${localeCode}: skipping migration.`
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
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#L`
                    },
                    async forms => {
                        const items: ReturnType<
                            ReturnType<typeof createDdbCmsEntity>["putBatch"]
                        >[] = [];

                        for (const form of forms) {
                            const [formId] = form.id.split("#");

                            const publishedForm = await queryOne<FbForm>({
                                entity: this.formEntity,
                                partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#LP`,
                                options: {
                                    eq: formId
                                }
                            });

                            const entry = createEntryCommonFields(form);
                            const status = createRevisionStatus(form, publishedForm);

                            const item = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}`,
                                SK: "L",
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fbForm#L`,
                                GSI1_SK: `${form.id}`,
                                TYPE: "cms.entry.l",
                                ...entry,
                                status
                            };

                            items.push(this.cmsEntity.putBatch(item));
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

        logger.info("Updated all latest forms.");
    }
}
