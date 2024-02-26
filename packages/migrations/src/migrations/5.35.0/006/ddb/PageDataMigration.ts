import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";

import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createDdbPageEntity } from "../entities/createPageEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { getSearchablePageContent } from "../utils/getSearchableContent";

import { I18NLocale, ListLocalesParams, Page, Tenant } from "../types";
import { batchWriteAll, ddbQueryAllWithCallback, queryAll, queryOne } from "~/utils";
import { ACO_SEARCH_MODEL_ID, PB_PAGE_TYPE, ROOT_FOLDER } from "../constants";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_35_0_006_PageData implements DataMigration<PageDataMigrationCheckpoint> {
    private readonly entryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly pageEntity: ReturnType<typeof createDdbPageEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.entryEntity = createDdbEntryEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.pageEntity = createDdbPageEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "PageData";
    }

    getDescription() {
        return "Migrate PbPage Data -> Create ACO Search Records";
    }

    async shouldExecute({ logger, forceExecute }: DataMigrationContext): Promise<boolean> {
        if (forceExecute) {
            return true;
        }

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
                //TODO: check this query
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
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#CME#wby-aco-${lastPage.pid}`,
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

                                /**
                                 * If the content is `gzip`, it means this page is created with the latest version
                                 * of Webiny, and we don't need to migrate it.
                                 */
                                if (current.content?.compression === "gzip") {
                                    return await accumulator;
                                }

                                const entry = await this.createSearchRecordCommonFields(current);

                                const latestEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                                    SK: "L",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                                    GSI1_SK: `wby-aco-${pid}#0001`,
                                    TYPE: "cms.entry.l",
                                    ...entry
                                };

                                const revisionEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                                    SK: "REV#0001",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                                    GSI1_SK: `wby-aco-${pid}#0001`,
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

                        const cursor = pages[pages.length - 1]?.id ?? true;

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
            version,
            settings
        } = page;

        const content = await getSearchablePageContent(page);

        return {
            createdBy,
            createdOn,
            entryId: `wby-aco-${pid}`,
            id: `wby-aco-${pid}#0001`,
            locale,
            locked: false,
            modelId: ACO_SEARCH_MODEL_ID,
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn,
            status: "draft",
            tenant,
            version: 1,
            webinyVersion: process.env.WEBINY_VERSION,
            values: {
                "text@title": title,
                "text@content": content,
                "wby-aco-json@data": {
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
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": settings.general?.tags || [],
                "text@type": PB_PAGE_TYPE
            }
        };
    }
}
