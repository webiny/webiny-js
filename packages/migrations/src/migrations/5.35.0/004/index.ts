import { Table } from "@webiny/db-dynamodb/toolbox";
import { inject, makeInjectable } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryAll, queryOne } from "~/utils";
import {
    createLegacyTenantEntity,
    createNewTenantEntity,
    getTenantData
} from "./createTenantEntity";
import { put } from "@webiny/db-dynamodb";

export class Tenancy_5_35_0_004 {
    private readonly legacyTenantEntity: ReturnType<typeof createLegacyTenantEntity>;
    private readonly newTenantEntity: ReturnType<typeof createNewTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.legacyTenantEntity = createLegacyTenantEntity(table);
        this.newTenantEntity = createNewTenantEntity(table);
    }

    getId() {
        return "5.35.0-004";
    }

    getDescription() {
        return "Move tenant attributes to a `data` envelope.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const tenant = await queryOne<{ data: any }>({
            entity: this.legacyTenantEntity,
            partitionKey: `TENANTS`,
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        if (!tenant) {
            logger.info(`No tenants were found; skipping migration.`);
            return false;
        }

        if (tenant.data) {
            logger.info(`Tenant records seems to be in order; skipping migration.`);
            return false;
        }

        return true;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string; name: string }>({
            entity: this.legacyTenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            logger.info(`Updating tenant ${tenant.name} (${tenant.id}).`);
            await put({
                entity: this.newTenantEntity,
                item: {
                    PK: `T#${tenant.id}`,
                    SK: "A",
                    GSI1_PK: tenant.GSI1_PK,
                    GSI1_SK: tenant.GSI1_SK,
                    TYPE: tenant.TYPE,
                    ...getTenantData(tenant),
                    // Move all data to a `data` envelope
                    data: {
                        ...getTenantData(tenant),
                        // While we're here, add a `tags` attribute to tenants
                        tags: []
                    }
                }
            });
        }
    }
}

makeInjectable(Tenancy_5_35_0_004, [inject(PrimaryDynamoTableSymbol)]);
