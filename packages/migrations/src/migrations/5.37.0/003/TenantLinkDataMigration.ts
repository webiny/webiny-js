import { Table } from "dynamodb-toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { createTenantLinkEntity } from "./entities/createTenantLinkEntity";
import { createTenantEntity } from "./entities/createTenantEntity";

import { queryAll, queryOne } from "~/utils";

import { Tenant, TenantLink } from "./types";
import { isMigratedTenantLink } from "~/migrations/5.37.0/003/utils/isMigratedTenantLink";

export type FileDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class TenantLinkRecords_5_37_0_003_FileData
    implements DataMigration<FileDataMigrationCheckpoint>
{
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly tenantLinkEntity: ReturnType<typeof createTenantLinkEntity>;

    constructor(table: Table) {
        this.tenantEntity = createTenantEntity(table);
        this.tenantLinkEntity = createTenantLinkEntity(table);
    }

    getId() {
        return "TenantLinkData";
    }

    getDescription() {
        return "Migrate Tenant Links Data 22";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const tenants = await this.listTenants();
        if (tenants.length === 0) {
            logger.info(`No tenants found in the system; skipping migration.`);
            return false;
        }

        for (const tenant of tenants) {
            const legacyTenantLink = await queryOne({
                entity: this.tenantLinkEntity,
                partitionKey: `T#${tenant.data.id}`,
                options: {
                    index: "GSI1",
                    beginsWith: "TYPE#group#"
                }
            });

            if (legacyTenantLink) {
                return true;
            }

            logger.info(`No tenant links found in tenant "${tenant.data.id}".`);
        }
        return false;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await this.listTenants();

        for (const tenant of tenants) {
            const tenantLinks = await this.listLegacyTenantLinks({ tenant });

            for (const tenantLink of tenantLinks) {
                if (isMigratedTenantLink(tenantLink)) {
                    continue;
                }

                logger.info(`Updating tenant link ${tenantLink.PK}.`);

                await this.tenantLinkEntity.update({
                    PK: tenantLink.PK,
                    SK: tenantLink.SK,
                    GSI1_PK: tenantLink.GSI1_PK,
                    GSI1_SK: tenantLink.GSI1_SK.replace("TYPE#group#", "TYPE#permissions#"),
                    type: "permissions",
                    data: {
                        ...tenantLink.data,
                        teams: [],
                        groups: [
                            {
                                id: tenantLink.data.group,
                                permissions: tenantLink.data.permissions
                            }
                        ]
                    }
                });
            }
        }
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

    private async listLegacyTenantLinks({ tenant }: { tenant: Tenant }): Promise<TenantLink[]> {
        return await queryAll<TenantLink>({
            entity: this.tenantLinkEntity,
            partitionKey: `T#${tenant.data.id}`,
            options: {
                index: "GSI1",
                beginsWith: "TYPE#group#"
            }
        });
    }
}
