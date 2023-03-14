import { Table } from "dynamodb-toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryOne, queryAll } from "~/utils";
import {
    createLegacyTenantEntity,
    createNewTenantEntity,
    getTenantData
} from "./createTenantEntity";

export class Tenancy_5_35_0_004 {
    private readonly legacyTenantEntity: ReturnType<typeof createLegacyTenantEntity>;
    private readonly newTenantEntity: ReturnType<typeof createNewTenantEntity>;

    constructor(table: Table) {
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
            await this.newTenantEntity.put({
                PK: `T#${tenant.id}`,
                SK: "A",
                GSI1_PK: tenant.GSI1_PK,
                GSI1_SK: tenant.GSI1_SK,
                TYPE: tenant.TYPE,
                ...getTenantData(tenant),
                // Move all data to a `data` envelope
                data: getTenantData(tenant)
            });
        }
    }
}

makeInjectable(Tenancy_5_35_0_004, [inject(PrimaryDynamoTableSymbol)]);
