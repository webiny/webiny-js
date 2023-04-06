import { Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { queryOne, queryAll, batchWriteAll } from "~/utils";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { I18NLocale, ListLocalesParams, Page, Tenant } from "../types";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.35.0/006/entities/createEntryEntity";
import {
    createDdbEsPageEntity,
    createDdbPageEntity
} from "~/migrations/5.35.0/006/entities/createPageEntity";
import { executeWithRetry } from "@webiny/utils";
import { getSearchablePageContent } from "~/migrations/5.35.0/006/utils/getSearchableContent";
import { scanTable } from "~tests/utils";
import { compress as gzip } from "@webiny/utils/compression/gzip";
import { PB_PAGE_TYPE, ROOT_FOLDER } from "../constants";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_35_0_006_PageData implements DataMigration<PageDataMigrationCheckpoint> {
    private readonly elasticsearchClient: Client;
    private readonly ddbEntryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly ddbEsEntryEntity: ReturnType<typeof createDdbEsEntryEntity>;
    private readonly ddbPageEntity: ReturnType<typeof createDdbPageEntity>;
    private readonly ddbEsPageEntity: ReturnType<typeof createDdbEsPageEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
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
                // Fetch latest page record from ddb table
                const latestDdbPages: Page[] = await scanTable(this.ddbPageEntity.table, {
                    filters: [
                        {
                            attr: "TYPE",
                            eq: "pb.page.l"
                        },
                        {
                            attr: "tenant",
                            eq: tenant.data.id
                        },
                        {
                            attr: "locale",
                            eq: locale.code
                        }
                    ],
                    limit: 1
                });

                if (latestDdbPages.length === 0) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}" (DDB).`
                    );
                    continue;
                }

                // Fetch latest page record from ddb+es table, here we can create PK from previously fetched item
                const latestDdbEsPage = await queryOne<{ pid: string }>({
                    entity: this.ddbEsPageEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#P#${latestDdbPages[0].pid}`,
                    options: { gt: " ", reverse: true }
                });

                if (!latestDdbEsPage) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}" (DDB + ES).`
                    );
                    continue;
                }

                // Fetch latest search record from ddb table, here we can create PK from previously fetched item
                const latestDdbSearchRecord = await queryOne<{ id: string }>({
                    entity: this.ddbEntryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#${latestDdbPages[0].pid}`,
                    options: {
                        eq: "L"
                    }
                });

                // Fetch latest search record from ddb+es table, here we can create PK from previously fetched item
                const latestDdbEsSearchRecord = await queryOne<{ id: string }>({
                    entity: this.ddbEsEntryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#${latestDdbPages[0].pid}`,
                    options: {
                        eq: "L"
                    }
                });

                if (latestDdbSearchRecord && latestDdbEsSearchRecord) {
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

                const pages: Page[] = await scanTable(this.ddbPageEntity.table, {
                    filters: [
                        {
                            attr: "TYPE",
                            eq: "pb.page.l"
                        },
                        {
                            attr: "tenant",
                            eq: tenant.data.id
                        },
                        {
                            attr: "locale",
                            eq: locale.code
                        }
                    ]
                });

                const ddbItems = await pages.reduce(async (accumulator: Promise<any>, current) => {
                    const { pid, tenant, locale } = current;

                    const entry = await this.createSearchRecordCommonFields(current);

                    const latestEntry = {
                        PK: `T#${tenant}#L#${locale}#CMS#CME#${pid}`,
                        SK: "L",
                        TYPE: "L",
                        ...entry
                    };

                    const revisionEntry = {
                        PK: `T#${tenant}#L#${locale}#CMS#CME#${pid}`,
                        SK: "REV#0001",
                        TYPE: "cms.entry",
                        ...entry
                    };

                    const acc = await accumulator;

                    return [
                        ...acc,
                        this.ddbEntryEntity.putBatch(latestEntry),
                        this.ddbEntryEntity.putBatch(revisionEntry)
                    ];
                }, Promise.resolve([]));

                const ddbEsItems = await pages.reduce(
                    async (accumulator: Promise<any>, current) => {
                        const {
                            createdBy,
                            createdOn,
                            locale,
                            locked,
                            path,
                            pid,
                            savedOn,
                            status,
                            tenant,
                            title,
                            version
                        } = current;

                        const content = await getSearchablePageContent(current);

                        const rawDatas = {
                            modelId: "acoSearchRecord",
                            version: 1,
                            savedOn,
                            locale,
                            status: "draft",
                            values: {
                                type: PB_PAGE_TYPE,
                                title,
                                content,
                                location: {
                                    folderId: ROOT_FOLDER
                                }
                            },
                            createdBy,
                            entryId: pid,
                            tenant,
                            createdOn,
                            locked: false,
                            ownedBy: createdBy,
                            webinyVersion: process.env.WEBINY_VERSION,
                            id: `${pid}#0001`,
                            modifiedBy: createdBy,
                            latest: true,
                            TYPE: "cms.entry.l",
                            __type: "cms.entry.l",
                            rawValues: {
                                data: {
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
                            }
                        };

                        const entry = {
                            PK: `T#${tenant}#L#${locale}#CMS#CME#${pid}`,
                            SK: "L",
                            data: await this.compress(rawDatas),
                            index: `${tenant.toLowerCase()}-headless-cms-${locale.toLowerCase()}-acosearchrecord`
                        };

                        const acc = await accumulator;

                        return [...acc, this.ddbEsEntryEntity.putBatch(entry)];
                    },
                    Promise.resolve([])
                );

                const executeDdb = () => {
                    return batchWriteAll({ table: this.ddbEntryEntity.table, items: ddbItems });
                };

                const executeDdbEs = () => {
                    return batchWriteAll({ table: this.ddbEsEntryEntity.table, items: ddbEsItems });
                };

                await executeWithRetry(executeDdb, {
                    onFailedAttempt: error => {
                        logger.error(`"batchWriteAll ddb" attempt #${error.attemptNumber} failed.`);
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
                    folderId: ROOT_FOLDER
                },
                type: PB_PAGE_TYPE
            }
        };
    }

    private async compress(data: any) {
        const value = await gzip(JSON.stringify(data));

        return {
            compression: GZIP,
            value: value.toString(TO_STORAGE_ENCODING)
        };
    }
}
