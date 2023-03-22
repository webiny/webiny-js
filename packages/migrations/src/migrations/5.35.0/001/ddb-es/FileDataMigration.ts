import pRetry from "p-retry";
import { Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { DataMigrationContext } from "@webiny/data-migration";
import {
    createStandardEntity,
    queryOne,
    queryAll,
    batchWriteAll,
    esQueryAllWithCallback,
    getIndexName
} from "~/utils";
import { createFileEntity, getFileData, legacyAttributes } from "../entities/createFileEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { File } from "./types";

export class FileManager_5_35_0_001_FileData {
    private readonly elasticsearchClient: Client;
    private readonly newFileEntity: ReturnType<typeof createFileEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    constructor(table: Table, elasticsearchClient: Client) {
        this.elasticsearchClient = elasticsearchClient;
        this.newFileEntity = createStandardEntity(table, "File", legacyAttributes);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    getId() {
        return "FileData";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const defaultLocale = await queryOne<{ code: string }>({
            entity: this.localeEntity,
            partitionKey: `T#root#I18N#L#D`,
            options: {
                eq: "default"
            }
        });

        if (!defaultLocale) {
            logger.info(`Default locale not found; system is not yet installed.`);
            // The system is not yet installed, skip migration.
            return false;
        }

        // Check if there are files stored in the GSI1 index, which means files are already migrated.
        const PK = `T#root#L#${defaultLocale.code}#FM#FILES`;
        const newFile = await queryOne<{ id: string }>({
            entity: this.newFileEntity,
            partitionKey: PK,
            options: { gt: " ", index: "GSI1" }
        });

        if (newFile) {
            logger.info(`Looks like files have already been migrated. Skipping migration.`);
            return false;
        }

        return true;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            const locales = await queryAll<{ code: string }>({
                entity: this.localeEntity,
                partitionKey: `T#${tenant.id}#I18N#L`,
                options: {
                    gt: " "
                }
            });

            for (const locale of locales) {
                let batch = 0;
                await esQueryAllWithCallback<File>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: getIndexName(tenant.id, locale.code),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.id } },
                                    { term: { "locale.keyword": locale.code } }
                                ]
                            }
                        },
                        size: 1000,
                        sort: [
                            {
                                "id.keyword": "asc"
                            }
                        ]
                    },
                    callback: async files => {
                        batch++;
                        logger.info(`Processing batch #${batch} (${files.length} files).`);
                        const items = files.map(file => {
                            return this.newFileEntity.putBatch({
                                PK: `T#${tenant.id}#L#${locale.code}#FM#F${file.id}`,
                                SK: "A",
                                GSI1_PK: `T#${tenant.id}#L#${locale.code}#FM#FILES`,
                                GSI1_SK: file.id,
                                TYPE: "fm.file",
                                ...getFileData(file),
                                data: {
                                    ...getFileData(file),
                                    webinyVersion: process.env.WEBINY_VERSION
                                }
                            });
                        });

                        const execute = () =>
                            batchWriteAll({ table: this.newFileEntity.table, items });

                        const retries = 20;
                        await pRetry(execute, {
                            maxRetryTime: 300000,
                            retries,
                            minTimeout: 1500,
                            maxTimeout: 30000,
                            onFailedAttempt: error => {
                                /**
                                 * We will only log attempts which are after 3/4 of total attempts.
                                 */
                                if (error.attemptNumber < retries * 0.75) {
                                    return;
                                }
                                console.error(`Attempt #${error.attemptNumber} failed.`);
                                console.error(error.message);
                            }
                        });
                    }
                });
            }
        }
    }
}
