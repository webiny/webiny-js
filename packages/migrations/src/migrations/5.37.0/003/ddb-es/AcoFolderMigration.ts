import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue, SearchBody } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { executeWithRetry } from "@webiny/utils";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { createDdbEntryEntity, createDdbEsEntryEntity } from "../entities/createEntryEntity";
import {
    batchWriteAll,
    BatchWriteItem,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esQueryAllWithCallback,
    get,
    queryAll
} from "~/utils";
import { CmsEntryAcoFolder, I18NLocale, ListLocalesParams, Tenant } from "../types";
import { ACO_FOLDER_MODEL_ID, ROOT_FOLDER, UPPERCASE_ROOT_FOLDER } from "../constants";
import { getElasticsearchLatestEntryData } from "./latestElasticsearchData";
import { getDecompressedData } from "~/migrations/5.37.0/003/utils/getDecompressedData";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

const hasBuggedParent = (folder: CmsEntryAcoFolder): boolean => {
    const parentId = (folder.values.parentId || "").toLowerCase();
    return parentId === ROOT_FOLDER;
};

export type AcoFolderDataMigrationCheckpoint = Record<
    string,
    PrimitiveValue[] | boolean | undefined
>;

interface CmsEntryAcoFolderElasticsearchRecord {
    PK: string;
    SK: string;
    index: string;
    data: any;
}

export class AcoRecords_5_37_0_003_AcoFolder
    implements DataMigration<AcoFolderDataMigrationCheckpoint>
{
    private readonly elasticsearchClient: Client;
    private readonly ddbEntryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly ddbEsEntryEntity: ReturnType<typeof createDdbEsEntryEntity>;
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
        this.localeEntity = createLocaleEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "AcoFolderParentId";
    }

    getDescription() {
        return "Fix the ACO Folders having set ROOT as parentId";
    }

    private createElasticsearchFolderBody(tenant: string, locale: string): Partial<SearchBody> {
        return {
            query: {
                bool: {
                    filter: [
                        { term: { "tenant.keyword": tenant } },
                        { term: { "locale.keyword": locale } },
                        {
                            bool: {
                                should: [
                                    {
                                        term: {
                                            "values.parentId.keyword": ROOT_FOLDER
                                        }
                                    },
                                    {
                                        term: {
                                            "values.parentId.keyword": UPPERCASE_ROOT_FOLDER
                                        }
                                    }
                                ],
                                minimum_should_match: 1
                            }
                        },
                        { term: { latest: true } }
                    ]
                }
            },
            sort: [
                {
                    "id.keyword": "asc"
                }
            ]
        };
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
                    type: ACO_FOLDER_MODEL_ID,
                    isHeadlessCmsModel: true
                });

                if (!indexExists) {
                    logger.info(
                        `No Elasticsearch index found for folders in tenant "${tenant.data.id}" and locale "${locale.code}"; skipping.`
                    );
                    continue;
                }

                const body = this.createElasticsearchFolderBody(tenant.data.id, locale.code);
                const folder = await esFindOne<CmsEntryAcoFolder>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName({
                        tenant: tenant.data.id,
                        locale: locale.code,
                        type: ACO_FOLDER_MODEL_ID,
                        isHeadlessCmsModel: true
                    }),
                    body: {
                        ...body,
                        sort: undefined
                    }
                });
                if (!folder) {
                    logger.info(
                        `No folder with wrong parentId found in tenant "${tenant.data.id}" and locale "${locale.code}"; skipping.`
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
    }: DataMigrationContext<AcoFolderDataMigrationCheckpoint>): Promise<void> {
        const tenants = await this.listTenants();

        const migrationStatus: AcoFolderDataMigrationCheckpoint = context.checkpoint || {};

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

                // there is an index? NO -> skip
                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: ACO_FOLDER_MODEL_ID,
                    isHeadlessCmsModel: true
                });

                if (!indexExists) {
                    /**
                     * No need to do anything with this index as it doesn't exist - querying will produce error.
                     */
                    continue;
                }

                let batch = 0;

                const foldersIndexName = esGetIndexName({
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: ACO_FOLDER_MODEL_ID,
                    isHeadlessCmsModel: true
                });

                await esQueryAllWithCallback<CmsEntryAcoFolder>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: foldersIndexName,
                    body: {
                        ...this.createElasticsearchFolderBody(tenantId, localeCode),
                        size: 500,
                        search_after: status
                    },
                    onError: error => {
                        const x = JSON.stringify(error);
                        if (x.includes("No mapping found")) {
                            return;
                        }
                        throw error;
                    },
                    callback: async (folders, cursor) => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${folders.length} folders).`
                        );

                        const ddbItems: BatchWriteItem[] = [];
                        const ddbEsItems: BatchWriteItem[] = [];

                        for (const folder of folders) {
                            const folderPk = `T#${tenantId}#L#${localeCode}#CMS#CME#${folder.entryId}`;
                            const ddbFolder = await get<CmsEntryAcoFolder>({
                                entity: this.ddbEntryEntity,
                                keys: {
                                    PK: folderPk,
                                    SK: "REV#0001"
                                }
                            });
                            if (!ddbFolder) {
                                logger.warn(
                                    `Missing DDB item with PK "${folderPk}", SK "REV#0001"; skipping.`
                                );
                                continue;
                            } else if (!hasBuggedParent(ddbFolder)) {
                                continue;
                            }

                            const values = {
                                ...ddbFolder.values,
                                parentId: null
                            };

                            const latestDdb = {
                                ...ddbFolder,
                                values,
                                PK: folderPk,
                                SK: "L",
                                TYPE: "cms.entry.l"
                            };

                            const revisionDdb = {
                                ...ddbFolder,
                                values,
                                PK: folderPk,
                                SK: "REV#0001",
                                TYPE: "cms.entry"
                            };

                            ddbItems.push(
                                this.ddbEntryEntity.putBatch(latestDdb),
                                this.ddbEntryEntity.putBatch(revisionDdb)
                            );

                            const esLatestRecord = await get<CmsEntryAcoFolderElasticsearchRecord>({
                                entity: this.ddbEsEntryEntity,
                                keys: {
                                    PK: folderPk,
                                    SK: "L"
                                }
                            });
                            if (!esLatestRecord) {
                                continue;
                            }

                            const esRecord = await getDecompressedData<CmsEntryAcoFolder>(
                                esLatestRecord.data
                            );
                            if (!esRecord) {
                                continue;
                            }

                            const esLatestData = await getElasticsearchLatestEntryData({
                                ...esRecord,
                                values: {
                                    ...esRecord.values,
                                    parentId: null
                                }
                            });

                            const latestDdbEs = {
                                PK: folderPk,
                                SK: "L",
                                data: esLatestData,
                                index: foldersIndexName
                            };

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
}
