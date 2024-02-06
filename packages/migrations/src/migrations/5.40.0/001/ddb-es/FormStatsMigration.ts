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
import {
    createDdbCmsEntity,
    createDdbEsCmsEntity
} from "~/migrations/5.40.0/001/entities/createCmsEntity";
import {
    getCompressedData,
    getFormStatsMetaFields,
    getStatsCommonFields
} from "~/migrations/5.40.0/001/utils";
import { executeWithRetry } from "@webiny/utils";

export class FormBuilder_5_40_0_001_FormStats implements DataMigration<MigrationCheckpoint> {
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
        return "Form Stats Entries";
    }

    getDescription(): string {
        return "";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                logger.info(`Checking form stats entries for ${tenantId} - ${localeCode}.`);

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

                const [formId, revisionId] = latestForm.id.split("#");

                // Fetch HCMS form stats records from DDB using latest form "id"
                const cmsEntry = await queryOne<CmsEntryWithMeta>({
                    entity: this.ddbCmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${formId}-${revisionId}-stats`,
                    options: {
                        eq: "L"
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
                logger.info(`Migrating form stats entries for ${tenantId} - ${localeCode}.`);

                const formBuilderIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const fbFormStatsHcmsIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "fbformstat",
                    isHeadlessCmsModel: true
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.esClient,
                    ...formBuilderIndexNameParams
                });

                if (!indexExists) {
                    // Continue with next locale.
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
                    // Continue with next locale.
                    return true;
                }

                const ids = esRecords.map(item => item.id).filter(Boolean);
                const uniqueIds = [...new Set(ids)];

                const ddbItems: ReturnType<ReturnType<typeof createDdbCmsEntity>["putBatch"]>[] =
                    [];

                const ddbEsItems: ReturnType<
                    ReturnType<typeof createDdbEsCmsEntity>["putBatch"]
                >[] = [];

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

                    // Get common fields
                    const commonFields = getStatsCommonFields(form);

                    // Get the new meta fields
                    const entryMetaFields = getFormStatsMetaFields(form);

                    const ddbRevisionItem = {
                        PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}-${revisionId}-stats`,
                        SK: `REV#${revisionId}`,
                        TYPE: "cms.entry",
                        ...commonFields,
                        ...entryMetaFields
                    };

                    ddbItems.push(this.ddbCmsEntity.putBatch(ddbRevisionItem));

                    const ddbLatestItem = {
                        PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}-${revisionId}-stats`,
                        SK: "L",
                        TYPE: "cms.entry.l",
                        ...commonFields,
                        ...entryMetaFields
                    };

                    ddbItems.push(this.ddbCmsEntity.putBatch(ddbLatestItem));

                    const ddbEsItem = {
                        PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${formId}-${revisionId}-stats`,
                        SK: "L",
                        index: esGetIndexName(fbFormStatsHcmsIndexNameParams),
                        data: await getCompressedData({
                            ...commonFields,
                            ...entryMetaFields,
                            rawValues: {},
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
                        logger.error(`"batchWriteAll ddb" attempt #${error.attemptNumber} failed.`);
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

                return true;
            }
        });

        logger.info("Updated all latest forms.");
    }
}
