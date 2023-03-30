import { Table } from "dynamodb-toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";

import { createEntryEntity } from "./entities/createEntryEntity";
import { createLocaleEntity } from "./entities/createLocaleEntity";
import { createPageEntity } from "./entities/createPageEntity";
import { createTenantEntity } from "./entities/createTenantEntity";
import { getSearchablePageContent } from "./utils/getSearchableContent";
import { queryAll, ddbQueryAllWithCallback, batchWriteAll, executeWithRetry } from "~/utils";

import { CmsEntry, I18NLocale, Page, Tenant, ListLocalesParams, ListEntriesParams } from "./types";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_35_0_006_PageData implements DataMigration<PageDataMigrationCheckpoint> {
    private readonly entryEntity: ReturnType<typeof createEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly pageEntity: ReturnType<typeof createPageEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table) {
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

    async execute({ logger, ...context }: DataMigrationContext): Promise<void> {
        const tenants = await this.listTenants();

        const migrationStatus = context.checkpoint || {};

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });

            for (const locale of locales) {
                const groupId = `${tenant.data.id}:${locale.code}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;
                await ddbQueryAllWithCallback<Page>(
                    {
                        entity: this.pageEntity,
                        partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#L`,
                        options: {
                            gt: status || " "
                        }
                    },
                    async pages => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${pages.length} pages).`
                        );

                        const items = await pages.reduce(
                            async (accumulator: Promise<any>, current) => {
                                const { pid, tenant, locale } = current;

                                const entry = await this.createSearchRecordCommonFields(current);

                                const latestEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
                                    SK: "L",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                                    GSI1_SK: `${pid}#0001`,
                                    TYPE: "cms.entry.l",
                                    ...entry
                                };

                                const revisionEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#${pid}`,
                                    SK: "REV#0001",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                                    GSI1_SK: `${pid}#0001`,
                                    TYPE: "cms.entry",
                                    ...entry
                                };

                                const acc = await accumulator;

                                return [
                                    ...acc,
                                    this.entryEntity.putBatch(latestEntry),
                                    this.entryEntity.putBatch(revisionEntry)
                                ];
                            },
                            Promise.resolve([])
                        );

                        const execute = () => {
                            return batchWriteAll({ table: this.entryEntity.table, items });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        const cursor = pages[pages.length - 1].id;

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = cursor;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                );

                migrationStatus[groupId] = true;
                context.createCheckpoint(migrationStatus);
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

    private async createSearchRecordCommonFields(page: Page) {
        const {
            createdBy,
            createdOn,
            id,
            locale,
            locked,
            path,
            pid,
            savedOn,
            status,
            tenant,
            title,
            version
        } = page;

        const content = await getSearchablePageContent(page);

        return {
            createdBy,
            createdOn,
            entryId: pid,
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
            version: 1,
            webinyVersion: process.env.WEBINY_VERSION,
            values: {
                title,
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
                type: "PbPage"
            }
        };
    }
}
