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
    disableElasticsearchIndexing,
    esGetIndexExist,
    esGetIndexName,
    esQueryAll,
    fetchOriginalElasticsearchSettings,
    forEachTenantLocale,
    restoreOriginalElasticsearchSettings
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

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

interface FormSubmissionsDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
    indexes: {
        [index: string]: IndexSettings | null;
    };
}

export class MultiStepForms_5_38_0_002 implements DataMigration {
    private readonly table: Table;
    private readonly esTable: Table;
    private readonly formSubmissionEntity: ReturnType<typeof createFormSubmissionEntity>;
    private readonly formSubmissionDdbEsEntity: ReturnType<typeof createFormSubmissionDdbEsEntity>;
    private readonly elasticsearchClient: Client;

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
        this.table = table;
        this.esTable = esTable;
        this.formSubmissionEntity = createFormSubmissionEntity(table);
        this.formSubmissionDdbEsEntity = createFormSubmissionDdbEsEntity(esTable);
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
    }: DataMigrationContext<FormSubmissionsDataMigrationCheckpoint>): Promise<void> {
        const migrationStatus =
            context.checkpoint || ({} as FormSubmissionsDataMigrationCheckpoint);

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
            async scanResults => {
                logger.debug(`Processing ${scanResults.items.length} items...`);
                const primaryTableRecordsToWrite: BatchWriteItem[] = [];
                const ddbEsTableRecordsToRead: BatchReadItem[] = [];
                const ddbEsTableRecordsToWrite: BatchWriteItem[] = [];

                // First, let's prepare a list of records to write to the primary table.
                for (const scanResult of scanResults.items) {
                    if (scanResult.form.steps) {
                        continue;
                    }

                    // If no steps are defined, we need to create a single step.
                    scanResult.form.steps = [];

                    if (Array.isArray(scanResult.form.layout)) {
                        // If layout is an array, we need to create a single step with all the fields.
                        scanResult.form.steps = [
                            { title: "Step 1", layout: scanResult.form.layout }
                        ];
                        delete scanResult.form.layout;
                    }

                    primaryTableRecordsToWrite.push(this.formSubmissionEntity.putBatch(scanResult));
                    ddbEsTableRecordsToRead.push(
                        this.formSubmissionDdbEsEntity.getBatch(scanResult)
                    );

                    const index = esGetIndexName({
                        tenant: scanResult.tenant,
                        locale: scanResult.locale,
                        type: "form-builder",
                        isHeadlessCmsModel: false
                    });

                    // Check for the elasticsearch index settings
                    if (!migrationStatus.indexes || migrationStatus.indexes[index] === undefined) {
                        // We need to fetch the index settings first
                        const settings = await fetchOriginalElasticsearchSettings({
                            index,
                            logger,
                            elasticsearchClient: this.elasticsearchClient
                        });

                        // ... add it to the checkpoint...
                        migrationStatus.indexes = {
                            ...migrationStatus.indexes,
                            [index]: settings
                        };

                        // and then set not to index
                        await disableElasticsearchIndexing({
                            elasticsearchClient: this.elasticsearchClient,
                            index,
                            logger
                        });
                    }
                }

                // Second, let's prepare a list of records to write to the DDB-ES table.
                const ddbEsTableRecords = await batchReadAll({
                    table: this.esTable,
                    items: ddbEsTableRecordsToRead
                });

                for (const ddbEsTableRecord of ddbEsTableRecords) {
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
                        this.formSubmissionDdbEsEntity.putBatch(ddbEsTableRecord)
                    );
                }

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
                            table: this.formSubmissionDdbEsEntity.table,
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
                migrationStatus.lastEvaluatedKey = scanResults.lastEvaluatedKey?.PK
                    ? (scanResults.lastEvaluatedKey as unknown as LastEvaluatedKey)
                    : true;

                // Check if we should store checkpoint and exit.
                if (context.runningOutOfTime()) {
                    await context.createCheckpointAndExit(migrationStatus);
                } else {
                    await context.createCheckpoint(migrationStatus);
                }
            }
        );

        /**
         * This is the end of the migration.
         */
        await restoreOriginalElasticsearchSettings({
            indexSettings: migrationStatus.indexes,
            logger,
            elasticsearchClient: this.elasticsearchClient
        });

        migrationStatus.lastEvaluatedKey = true;
        migrationStatus.indexes = {};
        context.createCheckpoint(migrationStatus);
    }
}

makeInjectable(MultiStepForms_5_38_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
