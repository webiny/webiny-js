import {
    DefaultSettingsCrudOptions,
    PbContext,
    Settings,
    SettingsStorageOperations,
    SettingsStorageOperationsCreateParams,
    SettingsStorageOperationsGetParams,
    SettingsStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { defineSettingsEntity } from "~/definitions/settingsEntity";
import { defineTable } from "~/definitions/table";
import { SettingsDataLoader } from "~/operations/settings/SettingsDataLoader";

const TYPE = "pb.settings";

interface Params {
    context: PbContext;
}

interface PartitionKeyOptions {
    tenant?: string | boolean;
    locale?: string | boolean;
}

export class SettingsStorageOperationsDdbEs implements SettingsStorageOperations {
    private readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    private dataLoader: SettingsDataLoader;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineSettingsEntity({
            context,
            table: this.table
        });

        this.dataLoader = new SettingsDataLoader({
            context: this.context,
            storageOperations: this
        });
    }
    /**
     * We can simply return the partition key for this storage operations.
     */
    public createCacheKey(options: DefaultSettingsCrudOptions): string {
        return this.createPartitionKey(options);
    }

    public async get(params: SettingsStorageOperationsGetParams): Promise<Settings> {
        const { tenant, locale, where } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant,
                locale
            }),
            SK: this.createSortKey(where.type)
        };
        try {
            const item = await this.entity.get(keys);

            return cleanupItem(this.entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load settings record.",
                ex.code || "SETTINGS_GET_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async create(params: SettingsStorageOperationsCreateParams): Promise<Settings> {
        const { tenant, locale, settings } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant,
                locale
            }),
            SK: this.createSortKey(settings.type)
        };
        try {
            await this.entity.put({
                ...settings,
                TYPE,
                ...keys
            });

            this.dataLoader.clear();

            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create settings record.",
                ex.code || "SETTINGS_CREATE_ERROR",
                {
                    settings,
                    keys
                }
            );
        }
    }

    public async update(params: SettingsStorageOperationsUpdateParams): Promise<Settings> {
        const { tenant, locale, original, settings } = params;
        if (original.type !== settings.type) {
            throw new WebinyError(
                `A "type" on both original and updated item must be identical.`,
                "UNSUPPORTED_UPDATE",
                {
                    original,
                    settings
                }
            );
        }
        const keys = {
            PK: this.createPartitionKey({
                tenant,
                locale
            }),
            SK: this.createSortKey(original.type)
        };
        try {
            await this.entity.put({
                ...settings,
                TYPE,
                ...keys
            });

            this.dataLoader.clear();

            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update settings record.",
                ex.code || "SETTINGS_UPDATE_ERROR",
                {
                    original,
                    settings,
                    keys
                }
            );
        }
    }
    /**
     * Because it is a possibility that tenant and locale are set as false (for the global settings) we must take
     * it in consideration and create the partition key for the global settings.
     */
    private createPartitionKey(options: PartitionKeyOptions): string {
        let { tenant, locale } = options;
        const parts: string[] = [];
        if (tenant !== false) {
            if (!tenant) {
                tenant = this.context.tenancy.getCurrentTenant().id;
            }
            parts.push(`T#${tenant}`);
        }
        if (locale !== false) {
            if (!locale) {
                locale = this.context.i18nContent.getLocale().code;
            }
            parts.push(`L#${locale}`);
        }
        parts.push("PB#SETTINGS");

        return parts.join("#");
    }

    private createSortKey(type: string): string {
        switch (type) {
            case "default":
                return type;
            default:
                throw new WebinyError("Unsupported type for the sort key.", "UNSUPPORTED_TYPE", {
                    type
                });
        }
    }
}
