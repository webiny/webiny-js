import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { createFormEntity } from "~/migrations/5.40.0/001/entities/createFormEntity";
import {
    batchWriteAll,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esQueryAll,
    forEachTenantLocale,
    queryOne
} from "~/utils";
import { CmsEntryWithMeta, FbForm, MigrationCheckpoint } from "~/migrations/5.40.0/001/types";
import { createDdbCmsEntity } from "~/migrations/5.40.0/001/entities/createCmsEntity";
import {
    getDdbEsFirstLastPublishedOnBy,
    getDdbEsOldestRevisionCreatedOn,
    getDdbEsRevisionStatus,
    getFormCommonFields,
    getMetaFields
} from "~/migrations/5.40.0/001/utils";
import { executeWithRetry } from "@webiny/utils";

export class FormBuilder_5_40_0_001_FormRevisions implements DataMigration<MigrationCheckpoint> {
    private readonly table: Table<string, string, string>;
    private readonly esClient: Client;
    private readonly ddbCmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private ddbFormEntity: ReturnType<typeof createFormEntity>;

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        esClient: Client
    ) {
        this.table = table;
        this.esClient = esClient;
        this.ddbCmsEntity = createDdbCmsEntity(table);
        this.ddbFormEntity = createFormEntity(table);
    }

    getId(): string {
        return "Form Revision Entries";
    }

    getDescription(): string {
        return "";
    }

    async shouldExecute({ logger, checkpoint }: DataMigrationContext): Promise<boolean> {
        if (checkpoint) {
            return true;
        }

        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                logger.info(`Checking form revisions entries for ${tenantId} - ${localeCode}.`);

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

                // Fetch HCMS form revision record from DDB using latest form "id"
                const cmsEntry = await queryOne<CmsEntryWithMeta>({
                    entity: this.ddbCmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#${latestForm.formId}`,
                    options: {
                        beginsWith: "REV#"
                    }
                });

                if (!cmsEntry) {
                    logger.info(
                        `No revisions CMS entries found for ${tenantId} - ${localeCode}: executing migration.`
                    );
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next locale.
                logger.info(
                    `Form revisions entries already migrated for ${tenantId} - ${localeCode}: skipping migration.`
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

                logger.info(`Migrating form revisions entries for ${tenantId} - ${localeCode}.`);

                const ids = esRecords.map(item => item.id).filter(Boolean);
                const uniqueIds = [...new Set(ids)];

                const ddbItems: ReturnType<ReturnType<typeof createDdbCmsEntity>["putBatch"]>[] =
                    [];

                for (const id of uniqueIds) {
                    const [formId, revisionId] = id.split("#");

                    const form = await queryOne<FbForm>({
                        entity: this.ddbFormEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                        options: {
                            eq: `REV#${revisionId}`
                        }
                    });

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

                    const ddbItem = {
                        PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}`,
                        SK: `REV#${revisionId}`,
                        TYPE: "cms.entry",
                        ...ddbEntryCommonFields,
                        ...entryMetaFields,
                        status
                    };

                    ddbItems.push(this.ddbCmsEntity.putBatch(ddbItem));
                }

                const executeDdb = () => {
                    return batchWriteAll({
                        table: this.ddbCmsEntity.table,
                        items: ddbItems
                    });
                };

                await executeWithRetry(executeDdb, {
                    onFailedAttempt: error => {
                        logger.error(`"batchWriteAll ddb" attempt #${error.attemptNumber} failed.`);
                        logger.error(error.message);
                    }
                });

                return true;
            }
        });

        logger.info("Updated all revision forms.");
    }
}
