import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import {
    batchReadAll,
    BatchReadItem,
    batchWriteAll,
    BatchWriteItem,
    esGetIndexExist,
    esGetIndexName,
    esQueryAll,
    forEachTenantLocale,
    queryAll
} from "~/utils";
import { FbForm } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { Client } from "@elastic/elasticsearch";
import { executeWithRetry } from "@webiny/utils";

export class MultiStepForms_5_38_0_001 implements DataMigration {
    private readonly table: Table;
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly elasticsearchClient: Client;

    constructor(table: Table, elasticsearchClient: Client) {
        this.table = table;
        this.formEntity = createFormEntity(table);
        this.elasticsearchClient = elasticsearchClient;
    }

    getId() {
        return "5.38.0-001";
    }

    getDescription() {
        return "Convert forms to multi-step forms.";
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

                const formIds = esRecords.map(item => item.formId).filter(Boolean);
                const uniqueFormIds = [...new Set(formIds)];

                const batchGetItems: BatchReadItem[] = [];
                for (const formId of uniqueFormIds) {
                    batchGetItems.push(
                        this.formEntity.getBatch({
                            PK: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                            SK: "L"
                        })
                    );
                }

                // Get DynamoDB records for all the forms retrieved from Elasticsearch.
                const ddbRecords = await batchReadAll<FbForm>({
                    table: this.formEntity.table,
                    items: batchGetItems
                });

                for (const ddbRecord of ddbRecords) {
                    if (!ddbRecord.steps) {
                        shouldExecute = true;
                        return false;
                    }
                }

                return true;
            }
        });

        return shouldExecute;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
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
                    // Continue with next locale.
                    return true;
                }

                const esRecords = await esQueryAll<FbForm>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName(indexNameParams),
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

                const formIds = esRecords.map(item => item.formId).filter(Boolean);
                const uniqueFormIds = [...new Set(formIds)];

                // For each form record, let's ensure the "steps" property is defined.
                for (const formId of uniqueFormIds) {
                    const ddbRecords = await Promise.all([
                        queryAll<FbForm>({
                            entity: this.formEntity,
                            partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                            options: {
                                eq: "L"
                            }
                        }),
                        queryAll<FbForm>({
                            entity: this.formEntity,
                            partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                            options: {
                                eq: "LP"
                            }
                        }),
                        queryAll<FbForm>({
                            entity: this.formEntity,
                            partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                            options: {
                                beginsWith: "REV#"
                            }
                        })
                    ]).then(response => response.flat());

                    const items: BatchWriteItem[] = [];
                    for (const ddbRecord of ddbRecords) {
                        if (ddbRecord.steps) {
                            continue;
                        }

                        // If no steps are defined, we need to create a single step.
                        ddbRecord.steps = [];

                        if (Array.isArray(ddbRecord.layout)) {
                            // If layout is an array, we need to create a single step with all the fields.
                            ddbRecord.steps.push({ title: "Step 1", layout: ddbRecord.layout });
                            delete ddbRecord.layout;
                        }

                        items.push(this.formEntity.putBatch(ddbRecord));
                    }

                    if (!items.length) {
                        continue;
                    }

                    const execute = () => {
                        return batchWriteAll({ table: this.formEntity.table, items });
                    };

                    logger.trace("Storing the DynamoDB records...");
                    await executeWithRetry(execute, {
                        onFailedAttempt: error => {
                            logger.error(`"batchWriteAll" attempt #${error.attemptNumber} failed.`);
                            logger.error(error.message);
                        }
                    });
                }

                // Continue with next locale.
                return true;
            }
        });

        logger.info("Updated all the forms.");
    }
}

makeInjectable(MultiStepForms_5_38_0_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
