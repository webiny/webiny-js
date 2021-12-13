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

export interface Params {
    context: PbContext;
}

export interface PartitionKeyOptions {
    tenant?: string | boolean;
    locale?: string | boolean;
}

export class SettingsStorageOperationsDdb implements SettingsStorageOperations {
    protected readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineSettingsEntity({
            context,
            table: this.table
        });
    }
    /**
     * We can simply return the partition key for this storage operations.
     */
    public createCacheKey(options: DefaultSettingsCrudOptions): string {
        return this.createPartitionKey(options);
    }

    public async get(params: SettingsStorageOperationsGetParams): Promise<Settings> {
        const { where } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: where.tenant,
                locale: where.locale
            }),
            SK: this.createSortKey(where)
        };
        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(this.entity, result.Item);
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
        const { settings } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: settings.tenant,
                locale: settings.locale
            }),
            SK: this.createSortKey(settings)
        };
        try {
            await this.entity.put({
                ...settings,
                TYPE: this.createType(),
                ...keys
            });

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
        const { original, settings } = params;
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
                tenant: settings.tenant,
                locale: settings.locale
            }),
            SK: this.createSortKey(original)
        };
        try {
            await this.entity.put({
                ...settings,
                TYPE: this.createType(),
                ...keys
            });

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
    protected createPartitionKey(options: PartitionKeyOptions): string {
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
                locale = this.context.i18nContent.getCurrentLocale().code;
            }
            parts.push(`L#${locale}`);
        }
        parts.push("PB#SETTINGS");

        return parts.join("#");
    }
    /**
     * We expect any object that has type property in it.
     * This way we can either receive a settings object or where conditions
     */
    protected createSortKey({ type }: { type: string }): string {
        switch (type) {
            case "default":
                return type;
            default:
                throw new WebinyError("Unsupported type for the sort key.", "UNSUPPORTED_TYPE", {
                    type
                });
        }
    }

    protected createType(): string {
        return "pb.settings";
    }
}
