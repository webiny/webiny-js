import chunk from "lodash/chunk";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";
import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    batchWriteAll,
    esCreateIndex,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esGetIndexSettings,
    esPutIndexSettings,
    esQueryAllWithCallback,
    forEachTenantLocale,
    queryOne
} from "~/utils";
import { CmsEntryWithMeta, FbForm, FbSubmission } from "../types";
import { createDdbCmsEntity, createDdbEsCmsEntity } from "../entities";
import {
    getCompressedData,
    getFormSubmissionMetaFields,
    getDdbEsFormSubmissionCommonFields
} from "../utils";
import { executeWithRetry } from "@webiny/utils";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

type FormSubmissionsDataMigrationCheckpoint = Record<
    string,
    PrimitiveValue[] | boolean | undefined
>;

export class FormBuilder_5_40_0_002_FormSubmissions
    implements DataMigration<FormSubmissionsDataMigrationCheckpoint>
{
    private readonly table: Table<string, string, string>;
    private readonly esClient: Client;
    private readonly ddbCmsEntity: ReturnType<typeof createDdbCmsEntity>;
    private readonly ddbEsCmsEntity: ReturnType<typeof createDdbEsCmsEntity>;

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        esClient: Client
    ) {
        this.table = table;
        this.esClient = esClient;
        this.ddbCmsEntity = createDdbCmsEntity(table);
        this.ddbEsCmsEntity = createDdbEsCmsEntity(esTable);
    }

    getId(): string {
        return "Form Submissions Entries";
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
                logger.info(`Checking form submissions for ${tenantId} - ${localeCode}.`);

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

                // Fetch latest form submission from ES
                const formSubmission = await esFindOne<FbForm>({
                    elasticsearchClient: this.esClient,
                    index: esGetIndexName(indexNameParams),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenantId } },
                                    { term: { "locale.keyword": localeCode } },
                                    { term: { "__type.keyword": "fb.submission" } }
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

                if (!formSubmission) {
                    logger.trace(
                        `No form submissions found in tenant "${tenantId}" and locale "${localeCode}".`
                    );

                    shouldExecute = false;
                    return true;
                }

                // Fetch HCMS submission records from DDB using latest submission "id"
                const cmsSubmission = await queryOne<CmsEntryWithMeta>({
                    entity: this.ddbCmsEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#${formSubmission.id}`,
                    options: {
                        eq: "L"
                    }
                });

                if (!cmsSubmission) {
                    logger.trace(
                        `Form submissions found for tenant "${tenantId}" and locale "${localeCode}": need migration!.`
                    );
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next locale.
                logger.info(
                    `Form submissions already migrated for ${tenantId} - ${localeCode}: skipping migration.`
                );
                return true;
            }
        });

        return shouldExecute;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<FormSubmissionsDataMigrationCheckpoint>): Promise<void> {
        const migrationStatus = context.checkpoint || {};

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                logger.info(`Migrating form submissions for ${tenantId} - ${localeCode}.`);

                const groupId = `${tenantId}:${localeCode}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    logger.info(
                        `Migration completed ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    return true;
                }

                let batch = 0;

                const formBuilderIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const fbFormSubmissionsHcmsIndexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "fbsubmission",
                    isHeadlessCmsModel: true
                };

                const formIndexExists = await esGetIndexExist({
                    elasticsearchClient: this.esClient,
                    ...formBuilderIndexNameParams
                });

                if (!formIndexExists) {
                    logger.info(
                        `No form-builder index found for ${tenantId} - ${localeCode}: skipping migration.`
                    );
                    return true;
                }

                const fbFormSubmissionsHcmsIndex = await esCreateIndex({
                    elasticsearchClient: this.esClient,
                    ...fbFormSubmissionsHcmsIndexNameParams
                });

                // Saving HCMS forms submissions index settings, we are going to reset them and save the original ones later
                const settings = await esGetIndexSettings({
                    elasticsearchClient: this.esClient,
                    index: fbFormSubmissionsHcmsIndex,
                    fields: ["number_of_replicas", "refresh_interval"]
                });

                await esPutIndexSettings({
                    elasticsearchClient: this.esClient,
                    index: fbFormSubmissionsHcmsIndex,
                    settings: {
                        number_of_replicas: 0,
                        refresh_interval: -1
                    }
                });

                try {
                    await esQueryAllWithCallback<FbSubmission>({
                        elasticsearchClient: this.esClient,
                        index: esGetIndexName(formBuilderIndexNameParams),
                        body: {
                            query: {
                                bool: {
                                    filter: [
                                        { term: { "tenant.keyword": tenantId } },
                                        { term: { "locale.keyword": localeCode } },
                                        { term: { "__type.keyword": "fb.submission" } }
                                    ]
                                }
                            },
                            size: 1000,
                            sort: [
                                {
                                    "id.keyword": "asc"
                                }
                            ],
                            search_after: status
                        },
                        onError: error => {
                            const x = JSON.stringify(error);
                            if (x.includes("No mapping found")) {
                                return;
                            }
                            throw error;
                        },
                        callback: async (submissions, cursor) => {
                            batch++;
                            logger.info(
                                `Processing batch #${batch} in group ${groupId} (${submissions.length} submissions).`
                            );

                            const ddbItems: ReturnType<
                                ReturnType<typeof createDdbCmsEntity>["putBatch"]
                            >[] = [];
                            const ddbEsItems: ReturnType<
                                ReturnType<typeof createDdbEsCmsEntity>["putBatch"]
                            >[] = [];

                            for (const submission of submissions) {
                                // Get common fields
                                const commonFields = getDdbEsFormSubmissionCommonFields(submission);

                                // Get the new meta fields
                                const entryMetaFields = getFormSubmissionMetaFields(submission);

                                const ddbRevItem = {
                                    PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${submission.id}`,
                                    SK: "REV#0001",
                                    TYPE: "cms.entry",
                                    ...commonFields,
                                    ...entryMetaFields
                                };

                                ddbItems.push(this.ddbCmsEntity.putBatch(ddbRevItem));

                                const ddbLatestItem = {
                                    PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${submission.id}`,
                                    SK: "L",
                                    TYPE: "cms.entry.l",
                                    ...commonFields,
                                    ...entryMetaFields
                                };

                                ddbItems.push(this.ddbCmsEntity.putBatch(ddbLatestItem));

                                const ddbEsItem = {
                                    PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${submission.id}`,
                                    SK: "L",
                                    index: fbFormSubmissionsHcmsIndex,
                                    data: await getCompressedData({
                                        ...commonFields,
                                        ...entryMetaFields,
                                        latest: true,
                                        TYPE: "cms.entry.l",
                                        __type: "cms.entry.l"
                                    })
                                };

                                ddbEsItems.push(this.ddbEsCmsEntity.putBatch(ddbEsItem));
                            }

                            const executeDdb = () => {
                                return Promise.all(
                                    chunk(ddbItems, 200).map(ddbItemsChunk => {
                                        return batchWriteAll({
                                            table: this.ddbCmsEntity.table,
                                            items: ddbItemsChunk
                                        });
                                    })
                                );
                            };

                            const executeDdbEs = () => {
                                return Promise.all(
                                    chunk(ddbEsItems, 200).map(ddbEsItemsChunk => {
                                        return batchWriteAll({
                                            table: this.ddbEsCmsEntity.table,
                                            items: ddbEsItemsChunk
                                        });
                                    })
                                );
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

                            // Update checkpoint after every batch
                            migrationStatus[groupId] = cursor;

                            // Check if we should store checkpoint and exit.
                            if (context.runningOutOfTime()) {
                                await context.createCheckpointAndExit(migrationStatus);
                            } else {
                                await context.createCheckpoint(migrationStatus);
                            }
                        }
                    });

                    migrationStatus[groupId] = true;
                    await context.createCheckpoint(migrationStatus);
                } finally {
                    // Saving back HCMS forms submissions index settings
                    await esPutIndexSettings({
                        elasticsearchClient: this.esClient,
                        index: fbFormSubmissionsHcmsIndex,
                        settings: {
                            number_of_replicas: settings.number_of_replicas || null,
                            refresh_interval: settings.refresh_interval || null
                        }
                    });
                }

                return true;
            }
        });

        logger.info("Updated all form submissions.");
    }
}
