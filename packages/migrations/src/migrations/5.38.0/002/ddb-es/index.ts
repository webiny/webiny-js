import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import {
    batchReadAll,
    BatchReadItem,
    batchWriteAll,
    BatchWriteItem,
    ddbScanWithCallback,
    esGetIndexExist,
    esGetIndexName,
    esQueryAll,
    forEachTenantLocale
} from "~/utils";
import { FbForm, FbFormSubmission } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { Client } from "@elastic/elasticsearch";
import { executeWithRetry } from "@webiny/utils";
import { createFormSubmissionEntity } from "~/migrations/5.38.0/002/entities/createFormSubmissionEntity";
import { createFormSubmissionDdbEsEntity } from "~/migrations/5.38.0/002/entities/createFormSubmissionDdbEsEntity";

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
    private readonly table: Table;
    private readonly esTable: Table;
    private readonly formSubmissionEntity: ReturnType<typeof createFormSubmissionEntity>;
    private readonly formDdbEsEntity: ReturnType<typeof createFormSubmissionDdbEsEntity>;
    private readonly elasticsearchClient: Client;

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
        this.table = table;
        this.esTable = esTable;
        this.formSubmissionEntity = createFormSubmissionEntity(table);
        this.formDdbEsEntity = createFormSubmissionDdbEsEntity(esTable);
        this.elasticsearchClient = elasticsearchClient;
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
                const indexNameParams = {
                    tenant: tenantId,
                    locale: localeCode,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    ...indexNameParams
                });

                if (!indexExists) {
                    logger.info(
                        `No Elasticsearch index found for folders in tenant "${tenantId}" and locale "${localeCode}"; skipping.`
                    );

                    // Continue with next locale.
                    return true;
                }

                const esRecords = await esQueryAll<FbForm>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName(indexNameParams),
                    body: {
                        query: {
                            bool: {
                                filter: [{ term: { "__type.keyword": "fb.submission" } }],
                                must_not: {
                                    exists: {
                                        field: "form.steps"
                                    }
                                }
                            }
                        },
                        size: 1
                    }
                });

                if (esRecords.length) {
                    shouldExecute = true;
                    return false;
                }

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
                    limit: 500
                }
            },
            async scanResult => {
                logger.debug(`Processing ${scanResult.items.length} items...`);
                const primaryTableRecordsToWrite: BatchWriteItem[] = [];
                const ddbEsTableRecordsToRead: BatchReadItem[] = [];
                const ddbEsTableRecordsToWrite: BatchWriteItem[] = [];

                // First, let's prepare a list of records to write to the primary table.
                for (const item of scanResult.items) {
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

                    primaryTableRecordsToWrite.push(this.formSubmissionEntity.putBatch(item));
                    ddbEsTableRecordsToRead.push(this.formDdbEsEntity.getBatch(item));
                }

                // Second, let's prepare a list of records to write to the DDB-ES table.
                await batchReadAll({
                    table: this.esTable,
                    items: ddbEsTableRecordsToRead
                }).then(ddbEsTableRecords => {
                    for (let i = 0; i < ddbEsTableRecords.length; i++) {
                        const ddbEsTableRecord = ddbEsTableRecords[i];

                        if (!ddbEsTableRecord.data || !ddbEsTableRecord.data.form) {
                            continue;
                        }

                        if (ddbEsTableRecord.data.form.steps) {
                            continue;
                        }

                        // If no steps are defined, we need to create a single step.
                        ddbEsTableRecord.data.form.steps = [];

                        if (Array.isArray(ddbEsTableRecord.data.form.layout)) {
                            // If layout is an array, we need to create a single step with all the fields.
                            ddbEsTableRecord.data.form.steps = [
                                { title: "Step 1", layout: ddbEsTableRecord.data.form.layout }
                            ];
                            delete ddbEsTableRecord.data.form.layout;
                        }

                        ddbEsTableRecordsToWrite.push(
                            this.formDdbEsEntity.putBatch(ddbEsTableRecord)
                        );
                    }
                });

                {
                    // 1. Update DynamoDB records (primary table).
                    const execute = () => {
                        return batchWriteAll({
                            table: this.formSubmissionEntity.table,
                            items: primaryTableRecordsToWrite
                        });
                    };

                    logger.trace("Storing the DynamoDB records (primary table)...");
                    await executeWithRetry(execute, {
                        onFailedAttempt: error => {
                            logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                            logger.error(error.message);
                        }
                    });

                    logger.trace("...stored.");
                }

                {
                    // 2. Update DynamoDB records (DDB-ES table).
                    const execute = () => {
                        return batchWriteAll({
                            table: this.formDdbEsEntity.table,
                            items: ddbEsTableRecordsToWrite
                        });
                    };

                    logger.trace("Storing the DynamoDB records (DynamoDB-ES table)...");
                    await executeWithRetry(execute, {
                        onFailedAttempt: error => {
                            logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                            logger.error(error.message);
                        }
                    });

                    logger.trace("...stored.");
                }

                // Update checkpoint after every batch
                migrationStatus.lastEvaluatedKey = scanResult.lastEvaluatedKey?.PK
                    ? (scanResult.lastEvaluatedKey as unknown as LastEvaluatedKey)
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

    // async execute({ logger }: DataMigrationContext): Promise<void> {
    //     await forEachTenantLocale({
    //         table: this.table,
    //         logger,
    //         callback: async ({ tenantId, localeCode }) => {
    //             const indexNameParams = {
    //                 tenant: tenantId,
    //                 locale: localeCode,
    //                 type: "form-builder",
    //                 isHeadlessCmsModel: false
    //             };
    //
    //             const indexExists = await esGetIndexExist({
    //                 elasticsearchClient: this.elasticsearchClient,
    //                 ...indexNameParams
    //             });
    //
    //             if (!indexExists) {
    //                 // Continue with next locale.
    //                 return true;
    //             }
    //
    //             const esRecords = await esQueryAll<FbForm>({
    //                 elasticsearchClient: this.elasticsearchClient,
    //                 index: esGetIndexName(indexNameParams),
    //                 body: {
    //                     query: {
    //                         bool: {
    //                             filter: [{ term: { "__type.keyword": "fb.form" } }]
    //                         }
    //                     },
    //                     size: 10000
    //                 }
    //             });
    //
    //             if (!esRecords.length) {
    //                 // Continue with next locale.
    //                 return true;
    //             }
    //
    //             const formIds = esRecords.map(item => item.formId).filter(Boolean);
    //             const uniqueFormIds = [...new Set(formIds)];
    //
    //             // For each form record, let's ensure the "steps" property is defined.
    //             for (const formId of uniqueFormIds) {
    //                 const ddbRecords = await Promise.all([
    //                     queryAll<FbForm>({
    //                         entity: this.formEntity,
    //                         partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
    //                         options: {
    //                             eq: "L"
    //                         }
    //                     }),
    //                     queryAll<FbForm>({
    //                         entity: this.formEntity,
    //                         partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
    //                         options: {
    //                             eq: "LP"
    //                         }
    //                     }),
    //                     queryAll<FbForm>({
    //                         entity: this.formEntity,
    //                         partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
    //                         options: {
    //                             beginsWith: "REV#"
    //                         }
    //                     })
    //                 ]).then(response => response.flat());
    //
    //                 const items: BatchWriteItem[] = [];
    //                 for (const ddbRecord of ddbRecords) {
    //                     if (ddbRecord.steps) {
    //                         continue;
    //                     }
    //
    //                     // If no steps are defined, we need to create a single step.
    //                     ddbRecord.steps = [];
    //
    //                     if (Array.isArray(ddbRecord.layout)) {
    //                         // If layout is an array, we need to create a single step with all the fields.
    //                         ddbRecord.steps.push({ title: "Step 1", layout: ddbRecord.layout });
    //                         delete ddbRecord.layout;
    //                     }
    //
    //                     items.push(this.formEntity.putBatch(ddbRecord));
    //                 }
    //
    //                 if (!items.length) {
    //                     continue;
    //                 }
    //
    //                 const execute = () => {
    //                     return batchWriteAll({ table: this.formEntity.table, items });
    //                 };
    //
    //                 logger.trace("Storing the DynamoDB records...");
    //                 await executeWithRetry(execute, {
    //                     onFailedAttempt: error => {
    //                         logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
    //                         logger.error(error.message);
    //                     }
    //                 });
    //             }
    //
    //             // Continue with next locale.
    //             return true;
    //         }
    //     });
    //
    //     logger.info("Updated all the forms.");
    // }
}

makeInjectable(MultiStepForms_5_38_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
