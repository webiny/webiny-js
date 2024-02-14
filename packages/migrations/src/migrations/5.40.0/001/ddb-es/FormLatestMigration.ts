import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { createFormEntity } from "~/migrations/5.40.0/001/entities/createFormEntity";
import {
    batchWriteAll,
    esCreateIndex,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esGetIndexSettings,
    esPutIndexSettings,
    esQueryAll,
    forEachTenantLocale,
    queryOne
} from "~/utils";
import { CmsEntryWithMeta, FbForm, MigrationCheckpoint } from "~/migrations/5.40.0/001/types";
import {
    createDdbCmsEntity,
    createDdbEsCmsEntity
} from "~/migrations/5.40.0/001/entities/createCmsEntity";
import {
    getCompressedData,
    getDdbEsFormCommonFields,
    getDdbEsFirstLastPublishedOnBy,
    getDdbEsOldestRevisionCreatedOn,
    getDdbEsRevisionStatus,
    getFormCommonFields,
    getMetaFields
} from "~/migrations/5.40.0/001/utils";
import { executeWithRetry } from "@webiny/utils";

export class FormBuilder_5_40_0_001_FormLatest implements DataMigration<MigrationCheckpoint> {
    private readonly table: Table<string, string, string>;
    private readonly esClient: Client;
    private readonly ddbCmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly ddbEsCmsEntity: ReturnType<typeof createDdbEsCmsEntity>;
    private ddbFormEntity: ReturnType<typeof createFormEntity>;

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        esClient: Client
    ) {
        this.table = table;
        this.esClient = esClient;
        this.ddbCmsEntity = createDdbCmsEntity(table);
        this.ddbEsCmsEntity = createDdbEsCmsEntity(esTable);
        this.ddbFormEntity = createFormEntity(table);
    }

    getId(): string {
        return "Form Latest Entries";
    }

    getDescription(): string {
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
                logger.info(`Checking form latest entries for ${tenantId} - ${localeCode}.`);

                const indexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.esClient,
                    ...indexNameParams
                });

                if (!indexExists) {
                    logger.info(
                        `No Elasticsearch index found for forms in tenant "${tenantId}" and locale "${localeCode}"; skipping.`
                    );
                    shouldExecute = false;
                    return true;
                }

                // Fetch latest form record from ES
                const latestForm = await esFindOne<FbForm>({
                    elasticsearchClient: this.esClient,
                    index: esGetIndexName(indexNameParams),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenantId } },
                                    { term: { "locale.keyword": localeCode } },
                                    { term: { "__type.keyword": "fb.form" } }
                                ]
                            }
                        },
                        sort: [
                            {
                                "id.keyword": { order: "asc", unmapped_type: "keyword" }
                            }
                        ]
                    }
                });

                if (!latestForm) {
                    logger.info(
                        `No forms found in tenant "${tenantId}" and locale "${localeCode}".`
                    );
                    shouldExecute = false;
                    return true;
                }

                // Fetch latest HCMS form record from DDB using latest form "formId"
                const cmsEntry = await queryOne<CmsEntryWithMeta>({
                    entity: this.ddbCmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#${latestForm.formId}`,
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
                const formBuilderIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const fbFormHcmsIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "fbform",
                    isHeadlessCmsModel: true
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.esClient,
                    ...formBuilderIndexNameParams
                });

                if (!indexExists) {
                    logger.info(
                        `No form-builder index found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    return true;
                }

                const esRecords = await esQueryAll<FbForm>({
                    elasticsearchClient: this.esClient,
                    index: esGetIndexName(formBuilderIndexNameParams),
                    body: {
                        query: {
                            bool: {
                                filter: [{ term: { "__type.keyword": "fb.form" } }]
                            }
                        },
                        size: 10000
                    }
                });

                if (!esRecords.length) {
                    logger.info(
                        `No forms found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    return true;
                }

                logger.info(`Migrating form latest entries for ${tenantId} - ${localeCode}.`);

                // Since it might be the first time we add a HCMS form record, we also need to create the index
                const fbFormHcmsIndex = await esCreateIndex({
                    elasticsearchClient: this.esClient,
                    ...fbFormHcmsIndexNameParams
                });

                // Saving HCMS forms index settings, we are going to reset them and save the original ones later
                const settings = await esGetIndexSettings({
                    elasticsearchClient: this.esClient,
                    index: fbFormHcmsIndex,
                    fields: ["number_of_replicas", "refresh_interval"]
                });

                logger.trace(
                    `Replacing existing settings with default from "${fbFormHcmsIndex}": ${JSON.stringify(
                        settings
                    )}`
                );

                await esPutIndexSettings({
                    elasticsearchClient: this.esClient,
                    index: fbFormHcmsIndex,
                    settings: {
                        number_of_replicas: 0,
                        refresh_interval: -1
                    }
                });

                try {
                    const formIds = esRecords.map(item => item.formId).filter(Boolean);
                    const uniqueFormIds = [...new Set(formIds)];

                    const ddbItems: ReturnType<
                        ReturnType<typeof createDdbCmsEntity>["putBatch"]
                    >[] = [];
                    const ddbEsItems: ReturnType<
                        ReturnType<typeof createDdbEsCmsEntity>["putBatch"]
                    >[] = [];

                    // Let's create the latest entry for each form found
                    for (const formId of uniqueFormIds) {
                        const form = await queryOne<FbForm>({
                            entity: this.ddbFormEntity,
                            partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                            options: {
                                eq: "L"
                            }
                        });

                        // No form latest entry found: we don't need to create an HCMS entry for it
                        if (!form) {
                            continue;
                        }

                        // Get the status field, based on the revision and the published entry
                        const status = await getDdbEsRevisionStatus({
                            form,
                            formEntity: this.ddbFormEntity
                        });

                        // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                        const createdOn = await getDdbEsOldestRevisionCreatedOn({
                            form,
                            formEntity: this.ddbFormEntity
                        });

                        // Get first/last published meta fields
                        const firstLastPublishedOnByFields = await getDdbEsFirstLastPublishedOnBy({
                            form,
                            formEntity: this.ddbFormEntity
                        });

                        // Create the new meta fields
                        const entryMetaFields = getMetaFields(form, {
                            createdOn,
                            ...firstLastPublishedOnByFields
                        });

                        // Get DDB common fields
                        const ddbEntryCommonFields = getFormCommonFields(form);

                        // Get DDB+ES common fields
                        const ddbEsEntryCommonFields = getDdbEsFormCommonFields(form);

                        const ddbItem = {
                            PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}`,
                            SK: "L",
                            ...ddbEntryCommonFields,
                            ...entryMetaFields,
                            status
                        };

                        ddbItems.push(this.ddbCmsEntity.putBatch(ddbItem));

                        const ddbEsItem = {
                            PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}`,
                            SK: "L",
                            index: fbFormHcmsIndex,
                            data: await getCompressedData({
                                ...ddbEsEntryCommonFields,
                                ...entryMetaFields,
                                status,
                                latest: true,
                                TYPE: "cms.entry.l",
                                __type: "cms.entry.l"
                            })
                        };

                        ddbEsItems.push(this.ddbEsCmsEntity.putBatch(ddbEsItem));
                    }

                    const executeDdb = () => {
                        return batchWriteAll({
                            table: this.ddbCmsEntity.table,
                            items: ddbItems
                        });
                    };

                    const executeDdbEs = () => {
                        return batchWriteAll({
                            table: this.ddbEsCmsEntity.table,
                            items: ddbEsItems
                        });
                    };

                    await executeWithRetry(executeDdb, {
                        onFailedAttempt: error => {
                            logger.error(
                                `"batchWriteAll ddb" attempt #${error.attemptNumber} failed.`
                            );
                            logger.error(error.message);
                        }
                    });

                    await executeWithRetry(executeDdbEs, {
                        onFailedAttempt: error => {
                            logger.error(
                                `"batchWriteAll ddb + es" attempt #${error.attemptNumber} failed.`
                            );
                            logger.error(error.message);
                        }
                    });

                    logger.info(`Migrated form latest entries for ${tenantId} - ${localeCode}.`);
                } finally {
                    // Saving back HCMS forms index settings
                    await esPutIndexSettings({
                        elasticsearchClient: this.esClient,
                        index: fbFormHcmsIndex,
                        settings: {
                            number_of_replicas: settings.number_of_replicas || null,
                            refresh_interval: settings.refresh_interval || null
                        }
                    });

                    logger.trace(
                        `Successfully set back the previously found settings from "${fbFormHcmsIndex}": ${JSON.stringify(
                            settings
                        )}`
                    );
                }

                return true;
            }
        });

        logger.info("Updated all latest forms.");
    }
}
