import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createDdbFileEntity } from "../entities/createFileEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { batchWriteAll, ddbQueryAllWithCallback, queryAll, queryOne } from "~/utils";
import {
    I18NLocale,
    ListLocalesParams,
    Tenant,
    CmsEntry,
    FileSearchRecordValues,
    FileEntryValues,
    FileItem
} from "../types";
import { inject, makeInjectable } from "@webiny/ioc";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

type FileDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class FileManager_5_37_0_005 implements DataMigration<FileDataMigrationCheckpoint> {
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
                const lastLegacyFile = await queryOne<FileItem>({
                    entity: this.fileEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#FM#FILES`,
                    options: {
                        index: "GSI1",
                        gte: " ",
                        reverse: true
                    }
                });

                if (!lastLegacyFile) {
                    logger.info(
                        `No file found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }

                const fileCmsRecord = await queryOne<{ id: string }>({
                    entity: this.entryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#CME#${lastLegacyFile.data.id}`,
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

                        const items: ReturnType<
                            ReturnType<typeof createDdbEntryEntity>["putBatch"]
                        >[] = [];

                        for (const file of files) {
                            const entry = this.createContentEntryCommonFields(file);
                            this.assignLocationFromSearchRecord(entry, searchRecords);

                            const fileId = file.data.id;

                            const latestEntry = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${fileId}`,
                                SK: "L",
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fmFile#L`,
                                GSI1_SK: `${fileId}#0001`,
                                TYPE: "cms.entry.l",
                                ...entry
                            };

                            const revisionEntry = {
                                PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${fileId}`,
                                SK: "REV#0001",
                                GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fmFile#A`,
                                GSI1_SK: `${fileId}#0001`,
                                TYPE: "cms.entry",
                                ...entry
                            };

                            items.push(this.entryEntity.putBatch(latestEntry));
                            items.push(this.entryEntity.putBatch(revisionEntry));
                        }

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

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = files[files.length - 1]?.data.id;

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

    private async listSearchRecords(tenant: string, locale: string) {
        const records = await queryAll<CmsEntry<FileSearchRecordValues>>({
            entity: this.entryEntity,
            partitionKey: `T#${tenant}#L#${locale}#CMS#CME#M#acoSearchRecord#L`,
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        return records.filter(record => record.values["text@type"] === "FmFile");
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

    private createContentEntryCommonFields(file: FileItem): CmsEntry<FileEntryValues> {
        return {
            createdBy: file.data.createdBy,
            createdOn: file.data.createdOn,
            entryId: file.data.id,
            id: `${file.data.id}#0001`,
            locked: false,
            locale: file.data.locale,
            location: {
                folderId: "root"
            },
            modelId: "fmFile",
            modifiedBy: file.data.createdBy,
            ownedBy: file.data.createdBy,
            savedOn: file.data.createdOn,
            status: "draft",
            tenant: file.data.tenant,
            version: 1,
            webinyVersion: String(process.env.WEBINY_VERSION),
            values: {
                "number@size": file.data.size,
                "object@location": {
                    "text@folderId": "root"
                },
                "object@meta": {
                    "boolean@private": file.data.meta?.private || false,
                    "number@width": file.data.meta?.width,
                    "number@height": file.data.meta?.height
                },
                "text@aliases": file.data.aliases,
                "text@key": file.data.key,
                "text@name": file.data.name,
                "text@tags": file.data.tags.filter(tag => !tag.startsWith("mime:")),
                "text@type": file.data.type
            }
        };
    }
}

makeInjectable(FileManager_5_37_0_005, [inject(PrimaryDynamoTableSymbol)]);
