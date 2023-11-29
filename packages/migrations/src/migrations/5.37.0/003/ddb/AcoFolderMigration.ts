import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import { createDdbEntryEntity } from "../entities/createEntryEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { CmsEntryAcoFolder, I18NLocale, ListLocalesParams, Tenant } from "../types";
import { batchWriteAll, BatchWriteItem, ddbQueryAllWithCallback, queryAll } from "~/utils";
import { ACO_FOLDER_MODEL_ID, ROOT_FOLDER } from "../constants";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

const hasAcoFolderBug = (entry: CmsEntryAcoFolder): boolean => {
    const parentId = String(entry.values.parentId || "").toLowerCase();
    return parentId === ROOT_FOLDER;
};

export type AcoFolderMigrationCheckpoint = Record<string, string | boolean | undefined>;

export class AcoRecords_5_37_0_003_AcoFolders
    implements DataMigration<AcoFolderMigrationCheckpoint>
{
    private readonly entryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.entryEntity = createDdbEntryEntity(table);
        this.localeEntity = createLocaleEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "AcoFolderParentId";
    }

    getDescription() {
        return "Fix the ACO Folders having set ROOT as parentId";
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
                const folders = await queryAll<CmsEntryAcoFolder>({
                    entity: this.entryEntity,
                    partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#A`,
                    options: {
                        index: "GSI1",
                        gt: " "
                    }
                });

                if (!folders.some(hasAcoFolderBug)) {
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
                const groupId = `${tenantId}:${locale.code}`;
                const status = migrationStatus[groupId];

                const localeCode = locale.code;

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;

                await ddbQueryAllWithCallback<CmsEntryAcoFolder>(
                    {
                        entity: this.entryEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#A`,
                        options: {
                            index: "GSI1",
                            gt: status || " "
                        }
                    },
                    async folders => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${folders.length} folder entries).`
                        );

                        const items = await folders.reduce<Promise<BatchWriteItem[]>>(
                            async (accumulator: Promise<BatchWriteItem[]>, current) => {
                                const { entryId, values: initialValues } = current;

                                if (!hasAcoFolderBug(current)) {
                                    return await accumulator;
                                }

                                const values = {
                                    ...initialValues,
                                    parentId: null
                                };

                                const latestEntry = {
                                    ...current,
                                    PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${entryId}`,
                                    SK: "L",
                                    GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#L`,
                                    GSI1_SK: current.id,
                                    TYPE: "cms.entry.l",
                                    values
                                };

                                const revisionEntry = {
                                    ...current,
                                    PK: `T#${tenantId}#L#${localeCode}#CMS#CME#CME#${entryId}`,
                                    SK: `REV#0001`,
                                    GSI1_PK: `T#${tenantId}#L#${localeCode}#CMS#CME#M#${ACO_FOLDER_MODEL_ID}#A`,
                                    GSI1_SK: current.id,
                                    TYPE: "cms.entry",
                                    values
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

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = folders[folders.length - 1].id;

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
}
