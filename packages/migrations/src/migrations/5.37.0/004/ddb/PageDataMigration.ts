import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createDdbPageEntity } from "../entities/createPageEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import {
    AcoSearchRecord,
    ExistingAcoSearchRecord,
    I18NLocale,
    ListLocalesParams,
    Tenant
} from "../types";
import {
    batchWriteAll,
    BatchWriteItem,
    ddbQueryAllWithCallback,
    queryAll,
    queryOne
} from "~/utils";
import { PB_ACO_SEARCH_MODEL_ID, ROOT_FOLDER, UPPERCASE_ROOT_FOLDER } from "../constants";
import { PB_PAGE_TYPE } from "~/migrations/5.35.0/006/constants";
import { Page } from "~/migrations/5.35.0/006/types";
import { get } from "@webiny/db-dynamodb";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export type PageDataMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_37_0_004_PageData implements DataMigration<PageDataMigrationCheckpoint> {
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
                /**
                 * First we check if there are any pages.
                 */
                const lastPage = await queryOne<{ pid: string }>({
                    entity: this.pageEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#PB#L`,
                    options: {
                        gt: " ",
                        reverse: true
                    }
                });

                if (!lastPage) {
                    logger.info(
                        `No pages found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }
                /**
                 * And we need to check if the search records were already migrated to the new ACO Models.
                 */
                const lastSearchRecord = await queryOne({
                    entity: this.entryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#M#${PB_ACO_SEARCH_MODEL_ID}#A`,
                    options: {
                        index: "GSI1",
                        eq: `wby-aco-${lastPage.pid}#0001`
                    }
                });

                if (lastSearchRecord) {
                    logger.info(
                        `Pages already migrated to New Search Records in tenant "${tenant.data.id}" and locale "${locale.code}".`
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

            const tenantId = tenant.data.id;

            for (const locale of locales) {
                const groupId = `${tenant.data.id}:${locale.code}`;
                const status = migrationStatus[groupId];

                const localeCode = locale.code;

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;
                /**
                 * We need to load all the pages because search records are mixed.
                 */
                await ddbQueryAllWithCallback<Page>(
                    {
                        entity: this.pageEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#PB#L`,
                        options: {
                            gt: status || " "
                        }
                    },
                    async pages => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${pages.length} pages).`
                        );

                        const items = await pages.reduce<Promise<BatchWriteItem[]>>(
                            async (accumulator: Promise<BatchWriteItem[]>, current) => {
                                /**
                                 * We need to get the search record for the page as it contains necessary data and adjustments.
                                 */
                                const existingAcoRecord = await get<ExistingAcoSearchRecord>({
                                    entity: this.entryEntity,
                                    keys: {
                                        PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#wby-aco-${current.pid}`,
                                        SK: "L"
                                    }
                                });
                                if (!existingAcoRecord) {
                                    return await accumulator;
                                }

                                const { tenant, locale, values } = existingAcoRecord;
                                const { ["wby-aco-json@data"]: data } = values;
                                const { pid } = data;

                                const entry = this.createSearchRecord(existingAcoRecord);

                                const latestEntry = {
                                    ...entry,
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                                    SK: "L",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${PB_ACO_SEARCH_MODEL_ID}#L`,
                                    GSI1_SK: `wby-aco-${pid}#0001`,
                                    TYPE: "cms.entry.l"
                                };

                                const revisionEntry = {
                                    ...entry,
                                    PK: `T#${tenant}#L#${locale}#CMS#CME#CME#wby-aco-${pid}`,
                                    SK: "REV#0001",
                                    GSI1_PK: `T#${tenant}#L#${locale}#CMS#CME#M#${PB_ACO_SEARCH_MODEL_ID}#A`,
                                    GSI1_SK: `wby-aco-${pid}#0001`,
                                    TYPE: "cms.entry"
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

                        // Update checkpoint after every batch.
                        migrationStatus[groupId] = pages[pages.length - 1]?.id ?? true;

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
