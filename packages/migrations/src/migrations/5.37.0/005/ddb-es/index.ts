import chunk from "lodash/chunk";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import {
    batchWriteAll,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esQueryAllWithCallback,
    queryAll,
    queryOne
} from "~/utils";
import {
    I18NLocale,
    ListLocalesParams,
    Tenant,
    CmsEntry,
    FileSearchRecordValues,
    FileEntryValues
} from "../types";
import { inject, makeInjectable } from "@webiny/ioc";
import { createDdbEsEntryEntity } from "~/migrations/5.36.0/001/entities/createEntryEntity";
import { File } from "~/migrations/5.36.0/001/types";
import { getCompressedData } from "~/migrations/5.36.0/001/utils/getCompressedData";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

type FileDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class FileManager_5_37_0_005 implements DataMigration<FileDataMigrationCheckpoint> {
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
        return "5.37.0-005";
    }

    getDescription() {
        return "Migrate File Manager data to Headless CMS records.";
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
                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "file-manager",
                    isHeadlessCmsModel: false
                });

                if (!indexExists) {
                    logger.info(
                        `No elasticsearch index found for File Manager in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                // Fetch the latest file record from ES
                const fmIndexName = esGetIndexName({
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "file-manager"
                });

                const latestFile = await esFindOne<File>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: fmIndexName,
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.data.id } },
                                    { term: { "locale.keyword": locale.code } }
                                ]
                            }
                        },
                        sort: [
                            {
                                "id.keyword": { order: "desc", unmapped_type: "keyword" }
                            }
                        ]
                    }
                });

                if (!latestFile) {
                    logger.info(
                        `No files found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                const fileCmsRecord = await queryOne<{ id: string }>({
                    entity: this.ddbEntryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#${latestFile.id}`,
                    options: {
                        eq: "L"
                    }
                });

                if (fileCmsRecord) {
                    logger.info(
                        `Files already migrated to CMS content entries in tenant "${tenant.data.id}" and locale "${locale.code}".`
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

                const tenantId = tenant.data.id;
                const localeCode = locale.code;

                const searchRecords = await this.listSearchRecords(tenantId, localeCode);

                if (searchRecords.length === 0) {
                    migrationStatus[groupId] = true;
                    continue;
                }

                let batch = 0;
                await esQueryAllWithCallback<File>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName({
                        tenant: tenant.data.id,
                        locale: locale.code,
                        type: "file-manager"
                    }),
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
                                "id.keyword": { order: "asc", unmapped_type: "keyword" }
                            }
                        ],
                        search_after: status
                    },
                    callback: async (files, cursor) => {
                        batch++;

                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                        );

                        const ddbItems: ReturnType<
                            ReturnType<typeof createDdbEntryEntity>["putBatch"]
                        >[] = [];

                        const ddbEsItems: ReturnType<
                            ReturnType<typeof createDdbEntryEntity>["putBatch"]
                        >[] = [];

                        for (const file of files) {
                            const entry = this.createContentEntryCommonFields(file);
                            this.assignLocationFromSearchRecord(entry, searchRecords);

                            const fileId = file.id;

                            const latestEntry = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${fileId}`,
                                SK: "L",
                                TYPE: "cms.entry.l",
                                ...entry
                            };

                            const revisionEntry = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${fileId}`,
                                SK: "REV#0001",
                                TYPE: "cms.entry",
                                ...entry
                            };

                            const latestDdbEs = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#${fileId}`,
                                SK: "L",
                                data: await getCompressedData({
                                    latest: true,
                                    __type: "cms.entry.l",
                                    ...latestEntry,
                                    rawValues: {
                                        "object@location": {},
                                        "object@meta": {}
                                    }
                                }),
                                index: esGetIndexName({
                                    tenant: tenantId,
                                    locale: localeCode,
                                    type: "fmfile",
                                    isHeadlessCmsModel: true
                                })
                            };

                            ddbItems.push(this.ddbEntryEntity.putBatch(latestEntry));
                            ddbItems.push(this.ddbEntryEntity.putBatch(revisionEntry));
                            ddbEsItems.push(this.ddbEsEntryEntity.putBatch(latestDdbEs));
                        }

                        const executeDdb = () => {
                            return Promise.all(
                                chunk(ddbItems, 200).map(ddbItemsChunk => {
                                    return batchWriteAll({
                                        table: this.ddbEntryEntity.table,
                                        items: ddbItemsChunk
                                    });
                                })
                            );
                        };

                        const executeDdbEs = () => {
                            return Promise.all(
                                chunk(ddbEsItems, 200).map(ddbEsItemsChunk => {
                                    return batchWriteAll({
                                        table: this.ddbEsEntryEntity.table,
                                        items: ddbEsItemsChunk
                                    });
                                })
                            );
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

    private async listSearchRecords(tenant: string, locale: string) {
        const esParams = {
            tenant,
            locale,
            type: "acosearchrecord",
            isHeadlessCmsModel: true
        };

        const acoIndex = esGetIndexName(esParams);

        const indexExists = await esGetIndexExist({
            elasticsearchClient: this.elasticsearchClient,
            ...esParams
        });

        if (!indexExists) {
            return [];
        }

        const searchRecords: CmsEntry<FileSearchRecordValues>[] = [];

        await esQueryAllWithCallback<CmsEntry<FileSearchRecordValues>>({
            elasticsearchClient: this.elasticsearchClient,
            index: acoIndex,
            body: {
                query: {
                    bool: {
                        filter: [
                            { term: { "tenant.keyword": tenant } },
                            { term: { "locale.keyword": locale } }
                        ]
                    }
                },
                size: 10000,
                sort: [
                    {
                        "id.keyword": { order: "asc", unmapped_type: "keyword" }
                    }
                ]
            },
            callback: async records => {
                for (const record of records) {
                    searchRecords.push(record);
                }
            }
        });

        return searchRecords;
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

    private assignLocationFromSearchRecord(
        fileEntry: CmsEntry<FileEntryValues>,
        search: CmsEntry<FileSearchRecordValues>[]
    ) {
        const searchRecord = search.find(
            rec => rec.values["wby-aco-json@data"].id === fileEntry.entryId
        );
        if (!searchRecord) {
            return;
        }

        const folderId = searchRecord.values["object@location"]["text@folderId"].toLowerCase();
        fileEntry.location = {
            folderId
        };
        fileEntry.values["object@location"] = {
            "text@folderId": folderId
        };
    }

    private createContentEntryCommonFields(file: File): CmsEntry<FileEntryValues> {
        return {
            createdBy: file.createdBy,
            createdOn: file.createdOn,
            entryId: file.id,
            id: `${file.id}#0001`,
            locked: false,
            locale: file.locale,
            location: {
                folderId: "root"
            },
            modelId: "fmFile",
            modifiedBy: file.createdBy,
            ownedBy: file.createdBy,
            savedOn: file.createdOn,
            status: "draft",
            tenant: file.tenant,
            version: 1,
            webinyVersion: String(process.env.WEBINY_VERSION),
            values: {
                "number@size": file.size,
                "object@location": {
                    "text@folderId": "root"
                },
                "object@meta": {
                    "boolean@private": file.meta?.private || false,
                    "number@width": file.meta?.width,
                    "number@height": file.meta?.height
                },
                "text@aliases": file.aliases,
                "text@key": file.key,
                "text@name": file.name,
                "text@tags": file.tags.filter(tag => !tag.startsWith("mime:")),
                "text@type": file.type
            }
        };
    }
}

makeInjectable(FileManager_5_37_0_005, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
