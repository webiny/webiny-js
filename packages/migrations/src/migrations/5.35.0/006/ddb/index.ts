import { Table } from "dynamodb-toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryAll, batchWriteAll } from "~/utils";
import { createEntryEntity } from "./createEntryEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { createPageEntity } from "./createPageEntity";
import { createTenantEntity } from "./createTenantEntity";
import { Tenant, I18NLocale, CmsEntry, Page } from "./types";
import WebinyError from "@webiny/error";
import { getSearchablePageContent } from "~/migrations/5.35.0/006/utils/getSearchableContent";

interface ListLocalesParams {
    tenant: Tenant;
}

interface ListEntriesParams {
    tenant: Tenant;
    locale: I18NLocale;
}

interface CreateSearchRecordParams {
    page: Page;
}

export class AcoRecords_5_35_0_006 {
    private readonly entryEntity: ReturnType<typeof createEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly pageEntity: ReturnType<typeof createPageEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    public constructor(table: Table) {
        this.entryEntity = createEntryEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.pageEntity = createPageEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    public getId() {
        return "5.35.0-006";
    }

    public getDescription() {
        return "Add ACO search record for each page found";
    }

    public async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
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
                const pages = await this.listPages({ tenant, locale });
                if (pages.length === 0) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                const searchRecords = await this.listSearchRecords({ tenant, locale });
                if (searchRecords.length === pages.length) {
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

    public async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await this.listTenants();
        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            for (const locale of locales) {
                logger.info(
                    `Creating search records for tenant "${tenant.data.id}" and locale "${locale.code}`
                );

                const pages = await this.listPages({ tenant, locale });

                for (const page of pages) {
                    await this.createSearchRecord({ page });
                }
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

    private async listPages({ tenant, locale }: ListEntriesParams): Promise<Page[]> {
        return await queryAll<Page>({
            entity: this.pageEntity,
            partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#L`,
            options: {
                gte: " "
            }
        });
    }

    private async listSearchRecords({ tenant, locale }: ListEntriesParams): Promise<CmsEntry[]> {
        return await queryAll<CmsEntry>({
            entity: this.entryEntity,
            partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#M#acoSearchRecord#L`,
            options: {
                index: "GSI1",
                gte: " "
            }
        });
    }

    private async createSearchRecord({ page }: CreateSearchRecordParams): Promise<void> {
        const {
            id,
            createdBy,
            createdOn,
            pid,
            savedOn,
            locked,
            path,
            tenant,
            locale,
            status,
            title,
            version,
            webinyVersion
        } = page;

        const content = await getSearchablePageContent(page);

        const latestEntry = {
            PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
            SK: "L",
            createdBy,
            createdOn,
            entryId: pid,
            GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
            GSI1_SK: `${pid}#0001`,
            id: `${pid}#0001`,
            locale,
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn,
            status: "draft",
            tenant,
            TYPE: "cms.entry.l",
            values: {
                content,
                data: {
                    createdBy,
                    createdOn,
                    id,
                    locked,
                    path,
                    pid,
                    savedOn,
                    status,
                    title,
                    version
                },
                location: {
                    folderId: "ROOT"
                },
                title,
                type: "PbPage"
            },
            version: 1,
            webinyVersion
        };

        const revisionEntry = {
            PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
            SK: "REV#0001",
            createdBy,
            createdOn,
            entryId: pid,
            GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
            GSI1_SK: `${pid}#0001`,
            id: `${pid}#0001`,
            locale,
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn,
            status: "draft",
            tenant,
            TYPE: "cms.entry",
            values: {
                content,
                data: {
                    createdBy,
                    createdOn,
                    id,
                    locked,
                    path,
                    pid,
                    savedOn,
                    status,
                    title,
                    version: 1
                },
                location: {
                    folderId: "ROOT"
                },
                title,
                type: "PbPage"
            },
            version: 1,
            webinyVersion
        };

        const items = [
            this.entryEntity.putBatch(latestEntry),
            this.entryEntity.putBatch(revisionEntry)
        ];

        try {
            await batchWriteAll({
                table: this.entryEntity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    page
                }
            );
        }
    }
}

makeInjectable(AcoRecords_5_35_0_006, [inject(PrimaryDynamoTableSymbol)]);
