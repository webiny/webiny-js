import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { executeWithRetry } from "@webiny/utils";

import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.35.0/006/entities/createEntryEntity";
import {
    createDdbEsPageEntity,
    createDdbPageEntity
} from "~/migrations/5.35.0/006/entities/createPageEntity";
import { getSearchablePageContent } from "~/migrations/5.35.0/006/utils/getSearchableContent";
import { getCompressedData } from "~/migrations/5.35.0/006/utils/getCompressedData";

import {
    batchWriteAll,
    BatchWriteItem,
    esCreateIndex,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esQueryAllWithCallback,
    queryAll,
    queryOne
} from "~/utils";

import { I18NLocale, ListLocalesParams, Page, Tenant } from "../types";

import { ACO_SEARCH_MODEL_ID, PB_PAGE_TYPE, ROOT_FOLDER } from "../constants";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, PrimitiveValue[] | boolean | undefined>;

export class AcoRecords_5_35_0_006_PageData implements DataMigration<PageDataMigrationCheckpoint> {
    private readonly elasticsearchClient: Client;
    private readonly ddbEntryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly ddbEsEntryEntity: ReturnType<typeof createDdbEsEntryEntity>;
    private readonly ddbPageEntity: ReturnType<typeof createDdbPageEntity>;
    private readonly ddbEsPageEntity: ReturnType<typeof createDdbEsPageEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        elasticsearchClient: Client
    ) {
        this.elasticsearchClient = elasticsearchClient;
        this.ddbEntryEntity = createDdbEntryEntity(table);
        this.ddbEsEntryEntity = createDdbEsEntryEntity(esTable);
        this.ddbPageEntity = createDdbPageEntity(table);
        this.ddbEsPageEntity = createDdbEsPageEntity(esTable);
        this.localeEntity = createLocaleEntity(table);
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
                // there is an index? NO -> skip
                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "page-builder",
                    isHeadlessCmsModel: false
                });

                if (!indexExists) {
                    logger.info(
                        `No elastic search index found for pages in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                // Fetch latest page record from ES
                const latestPage = await esFindOne<Page>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName({
                        tenant: tenant.data.id,
                        locale: locale.code,
                        type: "page-builder"
                    }),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.data.id } },
                                    { term: { "locale.keyword": locale.code } },
                                    { term: { "__type.keyword": "page" } },
                                    { term: { latest: true } }
                                ]
                            }
                        },
                        sort: [
                            {
                                "id.keyword": "asc"
                            }
                        ]
                    }
                });

                if (!latestPage) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                // Fetch latest aco search record from DDB using latest page "pid"
                const latestSearchRecord = await queryOne<{ id: string }>({
                    entity: this.ddbEntryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#wby-aco-${latestPage.pid}`,
                    options: {
                        eq: "L"
                    }
                });

                if (latestSearchRecord) {
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

                // Since it's the first time we add an ACO record, we also need to create the index
                await esCreateIndex({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "acosearchrecord",
                    isHeadlessCmsModel: true
                });

                await esQueryAllWithCallback<Page>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName({
                        tenant: tenant.data.id,
                        locale: locale.code,
                        type: "page-builder"
                    }),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.data.id } },
                                    { term: { "locale.keyword": locale.code } },
                                    { term: { "__type.keyword": "page" } },
                                    { term: { latest: true } }
                                ]
                            }
                        },
                        size: 500,
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
                            `Processing batch #${batch} in group ${groupId} (${pages.length} pages).`
                        );

                        const ddbItems: BatchWriteItem[] = [];
                        const ddbEsItems: BatchWriteItem[] = [];

                        for (const page of pages) {
                            const ddbPage = await queryOne<any>({
                                entity: this.ddbPageEntity,
                                partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#P#${page.pid}`,
                                options: {
                                    eq: "L"
                                }
                            });

                            /**
                             * If the content is `gzip`, it means this page is created with the latest version
                             * of Webiny, and we don't need to migrate it.
                             */
                            if (ddbPage.content?.compression === "gzip") {
                                continue;
                            }

                            const {
                                createdBy,
                                createdOn,
                                locale: pageLocale,
                                locked,
                                path,
                                pid,
                                savedOn,
                                status,
                                tenant: pageTenant,
                                title,
                                version,
                                settings
                            } = ddbPage;

                            const entry = await this.createSearchRecordCommonFields(ddbPage);
                            const content = await getSearchablePageContent(ddbPage);

                            const rawData = {
                                modelId: ACO_SEARCH_MODEL_ID,
                                version: 1,
                                savedOn,
                                locale: pageLocale,
                                status: "draft",
                                values: {
                                    "text@type": PB_PAGE_TYPE,
                                    "text@title": title,
                                    "text@content": content,
                                    "text@tags": settings.general?.tags || [],
                                    "object@location": {
                                        "text@folderId": ROOT_FOLDER
                                    },
                                    "wby-aco-json@data": {
                                        id: `${pid}#0001`,
                                        pid,
                                        title,
                                        createdBy,
                                        createdOn,
                                        savedOn,
                                        status,
                                        version,
                                        locked,
                                        path
                                    }
                                },
                                createdBy,
                                entryId: `wby-aco-${pid}`,
                                tenant: pageTenant,
                                createdOn,
                                locked: false,
                                ownedBy: createdBy,
                                webinyVersion: process.env.WEBINY_VERSION,
                                id: `wby-aco-${pid}#0001`,
                                modifiedBy: createdBy,
                                latest: true,
                                TYPE: "cms.entry.l",
                                __type: "cms.entry.l",
                                rawValues: {
                                    "object@location": {}
                                }
                            };

                            const latestDdb = {
                                PK: `T#${pageTenant}#L#${pageLocale}#CMS#CME#wby-aco-${pid}`,
                                SK: "L",
                                TYPE: "L",
                                ...entry
                            };

                            const revisionDdb = {
                                PK: `T#${pageTenant}#L#${pageLocale}#CMS#CME#wby-aco-${pid}`,
                                SK: "REV#0001",
                                TYPE: "cms.entry",
                                ...entry
                            };

                            const latestDdbEs = {
                                PK: `T#${pageTenant}#L#${pageLocale}#CMS#CME#wby-aco-${pid}`,
                                SK: "L",
                                data: await getCompressedData(rawData),
                                index: esGetIndexName({
                                    tenant: pageTenant,
                                    locale: pageLocale,
                                    type: "acosearchrecord",
                                    isHeadlessCmsModel: true
                                })
                            };

                            ddbItems.push(
                                this.ddbEntryEntity.putBatch(latestDdb),
                                this.ddbEntryEntity.putBatch(revisionDdb)
                            );

                            ddbEsItems.push(this.ddbEsEntryEntity.putBatch(latestDdbEs));
                        }

                        const executeDdb = () => {
                            return batchWriteAll({
                                table: this.ddbEntryEntity.table,
                                items: ddbItems
                            });
                        };

                        const executeDdbEs = () => {
                            return batchWriteAll({
                                table: this.ddbEsEntryEntity.table,
                                items: ddbEsItems
                            });
                        };

                        await executeWithRetry(executeDdb, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll ddb" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        await executeWithRetry(executeDdbEs, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll ddb + es" attempt #${error.attemptNumber} failed.`
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
