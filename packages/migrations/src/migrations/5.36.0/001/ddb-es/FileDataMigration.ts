import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { executeWithRetry } from "@webiny/utils";
import chunk from "lodash/chunk";

import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.36.0/001/entities/createEntryEntity";
import { addMimeTag } from "~/migrations/5.36.0/001/utils/createMimeTag";
import { getCompressedData } from "~/migrations/5.36.0/001/utils/getCompressedData";

import {
    batchWriteAll,
    esFindOne,
    esGetIndexExist,
    esGetIndexName,
    esGetIndexSettings,
    esPutIndexSettings,
    esQueryAllWithCallback,
    queryAll,
    queryOne
} from "~/utils";

import { I18NLocale, ListLocalesParams, File, Tenant } from "../types";

import { ACO_SEARCH_MODEL_ID, FM_FILE_TYPE, ROOT_FOLDER } from "../constants";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type FileDataMigrationCheckpoint = Record<string, PrimitiveValue[] | boolean | undefined>;

export class AcoRecords_5_36_0_001_FileData implements DataMigration<FileDataMigrationCheckpoint> {
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
        return "FileData";
    }

    getDescription() {
        return "Migrate FmFile Data -> Create ACO Search Records";
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
                    type: "file-manager",
                    isHeadlessCmsModel: false
                });

                if (!indexExists) {
                    logger.info(
                        `No elastic search index found for files in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                // Fetch latest file record from ES
                const latestFile = await esFindOne<File>({
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
                        sort: [
                            {
                                "id.keyword": { order: "asc", unmapped_type: "keyword" }
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

                // Fetch latest aco search record from DDB using latest file "id"
                const latestSearchRecord = await queryOne<{ id: string }>({
                    entity: this.ddbEntryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#wby-aco-${latestFile.id}`,
                    options: {
                        eq: "L"
                    }
                });

                if (latestSearchRecord) {
                    logger.info(
                        `Files already migrated to Search Records in tenant "${tenant.data.id}" and locale "${locale.code}".`
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
    }: DataMigrationContext<FileDataMigrationCheckpoint>): Promise<void> {
        const tenants = await this.listTenants();

        const migrationStatus: FileDataMigrationCheckpoint = context.checkpoint || {};

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });

            for (const locale of locales) {
                const groupId = `${tenant.data.id}:${locale.code}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;

                const acoIndex = esGetIndexName({
                    tenant: tenant.data.id,
                    locale: locale.code,
                    type: "acosearchrecord",
                    isHeadlessCmsModel: true
                });

                // Saving ACO index settings, we are going to reset them and save the original ones later
                const settings = await esGetIndexSettings({
                    elasticsearchClient: this.elasticsearchClient,
                    index: acoIndex,
                    fields: ["number_of_replicas", "refresh_interval"]
                });

                await esPutIndexSettings({
                    elasticsearchClient: this.elasticsearchClient,
                    index: acoIndex,
                    settings: {
                        number_of_replicas: 0,
                        refresh_interval: -1
                    }
                });

                try {
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
                                    "id.keyword": "asc"
                                }
                            ],
                            search_after: status
                        },
                        callback: async (files, cursor) => {
                            batch++;
                            logger.info(
                                `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                            );

                            const ddbItems: Array<any> | null | undefined = [];
                            const ddbEsItems: Array<any> | null | undefined = [];

                            for (const file of files) {
                                const {
                                    tenant: fileTenant,
                                    id,
                                    key,
                                    size,
                                    type,
                                    name,
                                    meta,
                                    createdOn,
                                    createdBy,
                                    tags,
                                    aliases,
                                    locale: fileLocale
                                } = file;

                                if (meta?.private) {
                                    logger.info(
                                        `File "${name}" is marked as private, skipping migration.`
                                    );
                                    continue;
                                }

                                const entry = await this.createSearchRecordCommonFields(file);

                                const rawDatas = {
                                    modelId: ACO_SEARCH_MODEL_ID,
                                    version: 1,
                                    locale: fileLocale,
                                    status: "draft",
                                    values: {
                                        "text@type": FM_FILE_TYPE,
                                        "text@title": name,
                                        "text@tags": addMimeTag(tags, type),
                                        "object@location": {
                                            "text@folderId": ROOT_FOLDER
                                        },
                                        "wby-aco-json@data": {
                                            id,
                                            key,
                                            size,
                                            type,
                                            name,
                                            createdOn,
                                            createdBy,
                                            aliases,
                                            meta
                                        }
                                    },
                                    createdBy,
                                    entryId: `wby-aco-${id}`,
                                    tenant: fileTenant,
                                    createdOn,
                                    savedOn: createdOn,
                                    locked: false,
                                    ownedBy: createdBy,
                                    webinyVersion: process.env.WEBINY_VERSION,
                                    id: `wby-aco-${id}#0001`,
                                    modifiedBy: createdBy,
                                    latest: true,
                                    TYPE: "cms.entry.l",
                                    __type: "cms.entry.l",
                                    rawValues: {
                                        "object@location": {}
                                    }
                                };

                                const latestDdb = {
                                    PK: `T#${fileTenant}#L#${fileLocale}#CMS#CME#wby-aco-${id}`,
                                    SK: "L",
                                    TYPE: "L",
                                    ...entry
                                };

                                const revisionDdb = {
                                    PK: `T#${fileTenant}#L#${fileLocale}#CMS#CME#wby-aco-${id}`,
                                    SK: "REV#0001",
                                    TYPE: "cms.entry",
                                    ...entry
                                };

                                const latestDdbEs = {
                                    PK: `T#${fileTenant}#L#${fileLocale}#CMS#CME#wby-aco-${id}`,
                                    SK: "L",
                                    data: await getCompressedData(rawDatas),
                                    index: esGetIndexName({
                                        tenant: fileTenant,
                                        locale: fileLocale,
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
                    await context.createCheckpoint(migrationStatus);
                } finally {
                    // Saving back ACO original settings
                    await esPutIndexSettings({
                        elasticsearchClient: this.elasticsearchClient,
                        index: acoIndex,
                        settings: {
                            number_of_replicas: settings.number_of_replicas || null,
                            refresh_interval: settings.refresh_interval || null
                        }
                    });
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

    private async createSearchRecordCommonFields(file: File) {
        const {
            tenant,
            id,
            key,
            size,
            type,
            name,
            meta,
            createdOn,
            createdBy,
            tags,
            aliases,
            locale
        } = file;

        return {
            createdBy,
            createdOn,
            entryId: `wby-aco-${id}`,
            id: `wby-aco-${id}#0001`,
            locked: false,
            locale,
            modelId: ACO_SEARCH_MODEL_ID,
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn: createdOn,
            status: "draft",
            tenant,
            version: 1,
            webinyVersion: process.env.WEBINY_VERSION,
            values: {
                "text@title": name,
                "wby-aco-json@data": {
                    id,
                    key,
                    size,
                    type,
                    name,
                    createdOn,
                    createdBy,
                    aliases,
                    meta
                },
                "object@location": {
                    "text@folderId": ROOT_FOLDER
                },
                "text@tags": addMimeTag(tags, type),
                "text@type": FM_FILE_TYPE
            }
        };
    }
}
