import { Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { queryOne, queryAll } from "~/utils";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { I18NLocale, ListLocalesParams, Tenant } from "../types";
import { createEntryEntity } from "~/migrations/5.35.0/006/entities/createEntryEntity";
import { createPageEntity } from "~/migrations/5.35.0/006/entities/createPageEntity";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

type PageDataMigrationCheckpoint = Record<string, PrimitiveValue[] | boolean | undefined>;

export class AcoRecords_5_35_0_006_PageData implements DataMigration<PageDataMigrationCheckpoint> {
    private readonly elasticsearchClient: Client;
    private readonly entryEntity: ReturnType<typeof createEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly pageEntity: ReturnType<typeof createPageEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table, elasticsearchClient: Client) {
        this.elasticsearchClient = elasticsearchClient;
        this.entryEntity = createEntryEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.pageEntity = createPageEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "PageData";
    }

    getDescription() {
        return "Migrate PbPage Data -> Create ACO Search Records";
    }

    async shouldExecute({ logger, checkpoint }: DataMigrationContext): Promise<boolean> {
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
                const lastPage = await queryOne<{ pid: string }>({
                    entity: this.pageEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#L`,
                    options: { gt: " ", reverse: true }
                });

                if (!lastPage) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                const lastSearchRecord = await queryOne<{ id: string }>({
                    entity: this.entryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#CME#${lastPage.pid}`,
                    options: {
                        eq: "L"
                    }
                });

                if (lastSearchRecord) {
                    logger.info(
                        `Pages already migrated to Search Records in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }
                return true;
            }
        }
        return false;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<PageDataMigrationCheckpoint>): Promise<void> {
        const tenants = await this.listTenants();

        const migrationStatus: PageDataMigrationCheckpoint = context.checkpoint || {};

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });

            for (const locale of locales) {
                const groupId = `${tenant.data.id}:${locale.code}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                console.log("locale", tenant.data.id, locale.code);

                const batch = 0;

                migrationStatus[groupId] = true;
                await context.createCheckpoint(migrationStatus);
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
