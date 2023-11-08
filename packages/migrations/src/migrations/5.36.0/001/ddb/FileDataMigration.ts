import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";

import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createDdbFileEntity } from "../entities/createFileEntity";
import { createTenantEntity } from "../entities/createTenantEntity";

import { batchWriteAll, ddbQueryAllWithCallback, queryAll, queryOne } from "~/utils";
import { addMimeTag } from "~/migrations/5.36.0/001/utils/createMimeTag";

import { I18NLocale, ListLocalesParams, Tenant, File, FileItem } from "../types";

import { ACO_SEARCH_MODEL_ID, FM_FILE_TYPE, ROOT_FOLDER } from "../constants";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type FileDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_36_0_001_FileData implements DataMigration<FileDataMigrationCheckpoint> {
    private readonly entryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly fileEntity: ReturnType<typeof createDdbFileEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.entryEntity = createDdbEntryEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.fileEntity = createDdbFileEntity(table);
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
                const latestFile = await queryOne<FileItem>({
                    entity: this.fileEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#FM#FILES`,
                    options: {
                        index: "GSI1",
                        gte: " ",
                        reverse: true
                    }
                });

                if (!latestFile) {
                    logger.info(
                        `No file found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                const lastSearchRecord = await queryOne<{ id: string }>({
                    entity: this.entryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#CME#wby-aco-${latestFile.data.id}`,
                    options: {
                        eq: "L"
                    }
                });

                if (lastSearchRecord) {
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
                await ddbQueryAllWithCallback<FileItem>(
                    {
                        entity: this.fileEntity,
                        partitionKey: `T#${tenant.data.id}#L#${locale.code}#FM#FILES`,
                        options: {
                            index: "GSI1",
                            gt: status || " "
                        }
                    },
                    async files => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                        );

                        const items = await files.reduce(
                            async (accumulator: Promise<any>, current) => {
                                const data = current.data;
                                const { id, tenant, locale, meta, name } = data;

                                const acc = await accumulator;

                                if (meta?.private) {
                                    logger.info(
                                        `File "${name}" is marked as private, skipping migration.`
                                    );
                                    return acc;
                                }

                                const entry = await this.createSearchRecordCommonFields(data);

                                const latestEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${id}`,
                                    SK: "L",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
                                    GSI1_SK: `wby-aco-${id}#0001`,
                                    TYPE: "cms.entry.l",
                                    ...entry
                                };

                                const revisionEntry = {
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${id}`,
                                    SK: "REV#0001",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#A`,
                                    GSI1_SK: `wby-aco-${id}#0001`,
                                    TYPE: "cms.entry",
                                    ...entry
                                };

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

                        const cursor = files[files.length - 1]?.data.id;

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
