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
    queryAll
} from "~/utils";
import { FbForm } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { I18NLocale, ListLocalesParams, Tenant } from "~/migrations/5.37.0/003/types";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { Client } from "@elastic/elasticsearch";
import { executeWithRetry } from "@webiny/utils";

export class MultiStepForms_5_38_0_001 implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly elasticsearchClient: Client;

    constructor(table: Table, elasticsearchClient: Client) {
        this.formEntity = createFormEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.tenantEntity = createTenantEntity(table);
        this.elasticsearchClient = elasticsearchClient;
    }

    getId() {
        return "5.38.0-001";
    }

    getDescription() {
        return "Convert forms tu multi-step forms.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const tenants = await this.listTenants();
        if (tenants.length === 0) {
            logger.info(`No tenants found in the system; skipping migration.`);
            return false;
        }

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            if (locales.length === 0) {
                logger.info(`No locales found in tenant "${tenant.data.id}".`);
                continue;
            }

            for (const locale of locales) {
                const indexNameParams = {
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    ...indexNameParams
                });

                if (!indexExists) {
                    logger.info(
                        `No Elasticsearch index found for folders in tenant "${tenant.data.id}" and locale "${locale.code}"; skipping.`
                    );
                    continue;
                }

                const records = await esQueryAll<FbForm>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName(indexNameParams),
                    body: {
                        size: 1000
                    }
                });

                const batchGetItems: BatchReadItem[] = [];
                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    batchGetItems.push(
                        this.formEntity.getBatch({
                            // T#root#L#en-US#FB#F#653a578347a0da00088b9f2f
                            PK: `T#${tenant.data.id}#L#${locale.code}#FB#F#${record.formId}`,
                            SK: "L"
                        })
                    );
                }

                // Get DynamoDB records for all the forms retrieved from Elasticsearch.
                const ddbRecords = await batchReadAll<FbForm>({
                    table: this.formEntity.table,
                    items: batchGetItems
                });

                for (let i = 0; i < ddbRecords.length; i++) {
                    const current = ddbRecords[i];
                    if (!current.steps) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await this.listTenants();

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            if (locales.length === 0) {
                continue;
            }

            for (const locale of locales) {
                const indexNameParams = {
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "form-builder",
                    isHeadlessCmsModel: false
                };

                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    ...indexNameParams
                });

                if (!indexExists) {
                    continue;
                }

                const records = await esQueryAll<FbForm>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName(indexNameParams),
                    body: {
                        size: 1000
                    }
                });

                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    const tenantId = tenant.data.id;
                    const localeCode = locale.code;
                    const formId = record.formId;

                    const formRecords = await queryAll<FbForm>({
                        entity: this.formEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#FB#F#${formId}`,
                        options: {
                            gte: " "
                        }
                    });

                    const items: BatchWriteItem[] = [];
                    for (const current of formRecords) {
                        const isFbForm = current.TYPE?.startsWith("fb.form");
                        if (!isFbForm) {
                            continue;
                        }

                        if (current.steps) {
                            continue;
                        }

                        // If no steps are defined, we need to create a single step.
                        current.steps = [];

                        if (Array.isArray(current.layout)) {
                            // If layout is an array, we need to create a single step with all the fields.
                            current.steps.push({ title: "Step 1", layout: current.layout });
                            delete current.layout;
                        }

                        items.push(this.formEntity.putBatch(current));
                    }

                    if (items.length === 0) {
                        return;
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
            }
        }

        logger.info("Updated all the forms.");
    }

    private async listTenants(): Promise<Tenant[]> {
        return await queryAll<Tenant>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gte: " "
            }
        });
    }

    private async listLocales({ tenant }: ListLocalesParams): Promise<I18NLocale[]> {
        return await queryAll<I18NLocale>({
            entity: this.localeEntity,
            partitionKey: `T#${tenant.data.id}#I18N#L`,
            options: {
                gte: " "
            }
        });
    }
}

makeInjectable(MultiStepForms_5_38_0_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
