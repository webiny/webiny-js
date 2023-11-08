import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { executeWithRetry } from "@webiny/utils";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { createDdbEntryEntity, createDdbEsEntryEntity } from "../entities/createEntryEntity";
import { createDdbEsPageEntity, createDdbPageEntity } from "../entities/createPageEntity";

import {
    batchWriteAll,
    BatchWriteItem,
    esCreateIndex,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esQueryAllWithCallback,
    get,
    queryAll
} from "~/utils";

import {
    AcoSearchRecord,
    ExistingAcoSearchRecord,
    I18NLocale,
    ListLocalesParams,
    Page,
    Tenant
} from "../types";

import {
    PB_ACO_SEARCH_MODEL_ID,
    PB_PAGE_TYPE,
    ROOT_FOLDER,
    UPPERCASE_ROOT_FOLDER
} from "../constants";
import { getCompressedData } from "../utils/getCompressedData";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, PrimitiveValue[] | boolean | undefined>;

export class AcoRecords_5_37_0_004_PageData implements DataMigration<PageDataMigrationCheckpoint> {
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
        return "Migrate PbPage Data -> Move ACO Search Records to new model";
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
                        `No Elasticsearch index found for pages in tenant "${tenant.data.id}" and locale "${locale.code}"; skipping.`
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
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}"; skipping.`
                    );
                    continue;
                }

                /**
                 * We need to check if the search records were already migrated to the new ACO Models.
                 */
                const newAcoIndexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: PB_ACO_SEARCH_MODEL_ID,
                    isHeadlessCmsModel: true
                });

                if (newAcoIndexExists) {
                    logger.info(`New Elasticsearch Pages ACO Records index found; skipping.`);
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

            const tenantId = tenant.data.id;

            for (const locale of locales) {
                const localeCode = locale.code;
                const groupId = `${tenantId}:${localeCode}`;

                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;

                // Since it's the first time we add an ACO record, we also need to create the index
                const pageAcoIndexName = await esCreateIndex({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenantId,
                    locale: localeCode,
                    type: PB_ACO_SEARCH_MODEL_ID,
                    isHeadlessCmsModel: true
                });

                const pageBuilderIndexName = esGetIndexName({
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "page-builder"
                });

                await esQueryAllWithCallback<Page>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: pageBuilderIndexName,
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenantId } },
                                    { term: { "locale.keyword": localeCode } },
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
                            /**
                             * We need to get the search record for the page as it contains necessary data and adjustments.
                             */
                            const searchRecordPartitionKey = `T#${tenantId}#L#${localeCode}#CMS#CME#wby-aco-${page.pid}`;
                            const existingAcoRecord = await get<ExistingAcoSearchRecord>({
                                entity: this.ddbEntryEntity,
                                keys: {
                                    PK: searchRecordPartitionKey,
                                    SK: "L"
                                }
                            });
                            if (!existingAcoRecord) {
                                logger.warn(
                                    `Page ACO Record (PK: ${searchRecordPartitionKey}) not found for page "${page.pid}". Possibly 5.35.0 migration failed; skipping this page.`
                                );
                                continue;
                            } else if (!existingAcoRecord.values["wby-aco-json@data"]) {
                                logger.warn(
                                    `Page ACO Record (PK: ${searchRecordPartitionKey}) does not have the wby-aco-json@data field. Possibly 5.35.0 migration failed; skipping this page.`
                                );
                                continue;
                            }

                            const entry = await this.createSearchRecord(existingAcoRecord);

                            const latestDdb = {
                                ...entry,
                                PK: searchRecordPartitionKey,
                                SK: "L",
                                TYPE: "cms.entry.l"
                            };

                            const revisionDdb = {
                                ...entry,
                                PK: searchRecordPartitionKey,
                                SK: "REV#0001",
                                TYPE: "cms.entry"
                            };

                            const rawData = {
                                ...entry,
                                latest: true,
                                TYPE: "cms.entry.l",
                                __type: "cms.entry.l",
                                rawValues: {
                                    "object@location": {}
                                }
                            };

                            const latestDdbEs = {
                                PK: searchRecordPartitionKey,
                                SK: "L",
                                data: await getCompressedData(rawData),
                                index: pageAcoIndexName
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

    private createSearchRecord(entry: ExistingAcoSearchRecord): AcoSearchRecord {
        const { values } = entry;

        const {
            ["text@title"]: title,
            ["text@content"]: content,
            ["wby-aco-json@data"]: data,
            ["text@tags"]: tags,
            ["object@location"]: location
        } = values;
        const { id, createdBy, createdOn, locked, path, pid, version, status, savedOn } = data;
        let folderId = location?.["text@folderId"] || ROOT_FOLDER;
        if (folderId === UPPERCASE_ROOT_FOLDER) {
            folderId = ROOT_FOLDER;
        }
        return {
            ...entry,
            modelId: PB_ACO_SEARCH_MODEL_ID,
            webinyVersion: process.env.WEBINY_VERSION as string,
            values: {
                "text@title": title,
                "text@content": content,
                "object@data": {
                    "text@id": id,
                    "text@pid": pid,
                    "text@path": path,
                    "text@status": status,
                    "text@title": title,
                    "object@createdBy": {
                        "text@id": createdBy.id,
                        "text@type": createdBy.type,
                        "text@displayName": createdBy.displayName
                    },
                    "datetime@createdOn": createdOn,
                    "datetime@savedOn": savedOn,
                    "boolean@locked": locked,
                    "number@version": version
                },
                "object@location": {
                    "text@folderId": folderId
                },
                "text@tags": tags || [],
                "text@type": PB_PAGE_TYPE
            }
        };
    }
}
