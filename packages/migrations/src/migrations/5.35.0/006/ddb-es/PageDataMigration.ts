import { Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { queryOne, queryAll, esQueryAllWithCallback, getIndexName, batchWriteAll } from "~/utils";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { I18NLocale, ListLocalesParams, Page, Tenant } from "../types";
import { createEntryEntity } from "~/migrations/5.35.0/006/entities/createEntryEntity";
import { createPageEntity } from "~/migrations/5.35.0/006/entities/createPageEntity";
import { File } from "~/migrations/5.35.0/001/types";
import { getFileData } from "~/migrations/5.35.0/001/entities/createFileEntity";
import chunk from "lodash/chunk";
import { executeWithRetry } from "@webiny/utils";
import { getSearchablePageContent } from "~/migrations/5.35.0/006/utils/getSearchableContent";

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

                let batch = 0;
                await esQueryAllWithCallback<Page>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: getIndexName(tenant.data.id, locale.code),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.data.id } },
                                    { term: { "locale.keyword": locale.code } }
                                ]
                            }
                        },
                        size: 10000,
                        sort: [
                            {
                                "id.keyword": "asc"
                            }
                        ],
                        search_after: status
                    },
                    callback: async (pages, cursor) => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${pages.length} files).`
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
                            return Promise.all(
                                chunk(items, 200).map(fileChunk => {
                                    return batchWriteAll({
                                        table: this.entryEntity.table,
                                        items: fileChunk
                                    });
                                })
                            );
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = cursor;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                });

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
