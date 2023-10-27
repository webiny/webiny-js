import { Table } from "dynamodb-toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { createFormEntity } from "../entities/createFormEntity";
import { batchWriteAll, BatchWriteItem, queryAll } from "~/utils";
import { FbForm } from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { I18NLocale, ListLocalesParams, Tenant } from "~/migrations/5.37.0/003/types";
import { scanWithCallback } from "@webiny/db-dynamodb";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { executeWithRetry } from "@webiny/utils";

export class MultiStepForms_5_38_0_001 implements DataMigration {
    private readonly formEntity: ReturnType<typeof createFormEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table) {
        this.formEntity = createFormEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.tenantEntity = createTenantEntity(table);
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
                const forms = await queryAll<FbForm>({
                    entity: this.formEntity,
                    // Pulling all forms via the `T#root#L#en-US#FB#F` PK will suffice.
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#FB#F`
                });

                for (let i = 0; i < forms.length; i++) {
                    const current = forms[i];
                    if (!current.steps) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        await scanWithCallback<FbForm>(
            {
                entity: this.formEntity,
                options: {}
            },
            async result => {
                const items: BatchWriteItem[] = [];
                for (const current of result.items) {
                    if (!current.TYPE || !current.TYPE.startsWith("fb.form")) {
                        continue;
                    }

                    if (!current.steps) {
                        // If no steps are defined, we need to create a single step.
                        current.steps = [];

                        if (Array.isArray(current.layout)) {
                            // If layout is an array, we need to create a single step with all the fields.
                            current.steps = [{ title: "Step 1", layout: current.layout || [] }];
                            delete current.layout;
                        }
                        items.push(this.formEntity.putBatch(current));
                    }
                }

                if (items.length >= 0) {
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
        );

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

makeInjectable(MultiStepForms_5_38_0_001, [inject(PrimaryDynamoTableSymbol)]);
