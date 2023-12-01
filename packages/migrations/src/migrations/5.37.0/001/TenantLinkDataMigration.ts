import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { createTenantLinkEntity } from "./entities/createTenantLinkEntity";
import { createTenantEntity } from "./entities/createTenantEntity";
import { queryAll } from "~/utils";
import { Tenant, TenantLink } from "./types";
import { isMigratedTenantLink } from "~/migrations/5.37.0/001/utils/isMigratedTenantLink";
import { update } from "@webiny/db-dynamodb";

export type FileDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class TenantLinkRecords_5_37_0_001_FileData
    implements DataMigration<FileDataMigrationCheckpoint>
{
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly tenantLinkEntity: ReturnType<typeof createTenantLinkEntity>;

    constructor(table: Table<string, string, string>) {
        this.tenantEntity = createTenantEntity(table);
        this.tenantLinkEntity = createTenantLinkEntity(table);
    }

    getId() {
        return "TenantLinkData";
    }

    getDescription() {
        return "Migrate Tenant Links Data";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const tenants = await this.listTenants();
        if (tenants.length === 0) {
            logger.info(`No tenants found in the system; skipping migration.`);
            return false;
        }

        for (const tenant of tenants) {
            const tenantLinks = await queryAll<TenantLink>({
                entity: this.tenantLinkEntity,
                partitionKey: `T#${tenant.data.id}`,
                options: {
                    index: "GSI1",
                    beginsWith: "TYPE#group#"
                }
            });

            for (let i = 0; i < tenantLinks.length; i++) {
                const tenantLink = tenantLinks[i];
                if (!Array.isArray(tenantLink.data.teams)) {
                    return true;
                }
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

                await update({
                    entity: this.tenantLinkEntity,
                    item: {
                        PK: tenantLink.PK,
                        SK: tenantLink.SK,
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
