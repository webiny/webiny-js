import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { createDdbCmsEntity } from "../entities/createCmsEntity";
import { batchWriteAll, ddbQueryAllWithCallback, forEachTenantLocale, queryOne } from "~/utils";
import { executeWithRetry } from "@webiny/utils";

import {
    getFirstLastPublishedOnBy,
    getFormCommonFields,
    getMetaFields,
    getOldestRevisionCreatedOn,
    getRevisionStatus
} from "../utils";
import { CmsEntryWithMeta, FbForm, MigrationCheckpoint } from "../types";

export class FormBuilder_5_40_0_001_FormRevisions implements DataMigration<MigrationCheckpoint> {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly cmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.cmsEntity = createDdbCmsEntity(table);
    }

    getId() {
        return "Form Revision Entries";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({
        logger,
        checkpoint,
        forceExecute
    }: DataMigrationContext): Promise<boolean> {
        if (checkpoint || forceExecute) {
            return true;
        }

        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                logger.info(`Checking form revisions for ${tenantId} - ${localeCode}.`);

                const formRevision = await queryOne<FbForm>({
                    entity: this.formEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#FB#F`
                });

                if (!formRevision) {
                    logger.info(
                        `No form revisions found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    shouldExecute = false;
                    return true;
                }

                const [formId, revisionId] = formRevision.id.split("#");

                const cmsRevision = await queryOne<CmsEntryWithMeta>({
                    entity: this.cmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}`,
                    options: {
                        eq: `REV#${revisionId}`
                    }
                });

                if (!cmsRevision) {
                    logger.info(
                        `No CMS entries revisions found for ${tenantId} - ${localeCode}: executing migration.`
                    );
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next locale.
                logger.info(
                    `Form revisions already migrated for ${tenantId} - ${localeCode}: skipping migration.`
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
                        if (!forms.length) {
                            logger.info(
                                `No forms found for ${tenantId} - ${localeCode}: skipping migration.`
                            );
                            return;
                        }

                        logger.info(
                            `Migrating form revision entries for ${tenantId} - ${localeCode}.`
                        );

                        const items: ReturnType<
                            ReturnType<typeof createDdbCmsEntity>["putBatch"]
                        >[] = [];

                        for (const form of forms) {
                            const [formId, revisionId] = form.id.split("#");

                            // Get common fields
                            const entryCommonFields = getFormCommonFields(form);

                            // Get the status field, based on the revision and the published entry
                            const status = await getRevisionStatus({
                                form,
                                formEntity: this.formEntity
                            });

                            // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                            const createdOn = await getOldestRevisionCreatedOn({
                                form,
                                formEntity: this.formEntity
                            });

                            // Get first/last published meta fields
                            const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                                form,
                                formEntity: this.formEntity
                            });

                            // Create the new meta fields
                            const entryMetaFields = getMetaFields(form, {
                                createdOn,
                                ...firstLastPublishedOnByFields
                            });

                            const item = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}`,
                                SK: `REV#${revisionId}`,
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fbForm#A`,
                                GSI1_SK: `${form.id}`,
                                TYPE: "cms.entry",
                                ...entryCommonFields,
                                ...entryMetaFields,
                                status
                            };

                            items.push(this.cmsEntity.putBatch(item));
                        }

                        const execute = () => {
                            return batchWriteAll({ table: this.cmsEntity.table, items });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        logger.info(
                            `Migrated form revision entries for ${tenantId} - ${localeCode}.`
                        );
                    }
                );

                return true;
            }
        });

        logger.info("Updated all form revisions.");
    }
}
