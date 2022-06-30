import {
    DefaultSettings,
    DefaultSettingsCrudOptions,
    SettingsStorageOperations,
    SettingsStorageOperationsCreateParams,
    SettingsStorageOperationsGetParams,
    SettingsStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";

/**
 * Because it is a possibility that tenant and locale are set as false (for the global settings) we must take
 * it in consideration and create the partition key for the global settings.
 */
interface PartitionKeyParams {
    tenant: string | boolean | undefined;
    locale: string | boolean | undefined;
}

const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    const parts: string[] = [];
    if (tenant !== false) {
        parts.push(`T#${tenant}`);
    }
    if (locale !== false) {
        parts.push(`L#${locale}`);
    }
    parts.push("PB#SETTINGS");

    return parts.join("#");
};

/**
 * We expect any object that has type property in it.
 * This way we can either receive a settings object or where conditions
 */
interface SortKeyParams {
    type: string;
}
const createSortKey = (params: SortKeyParams): string => {
    const { type } = params;
    switch (type) {
        case "default":
            return type;
        default:
            throw new WebinyError("Unsupported type for the sort key.", "UNSUPPORTED_TYPE", {
                type
            });
    }
};

const createType = (): string => {
    return "pb.settings";
};

export interface CreateSettingsStorageOperationsParams {
    entity: Entity<any>;
}

export const createSettingsStorageOperations = ({
    entity
}: CreateSettingsStorageOperationsParams): SettingsStorageOperations => {
    const getDefaults = async (): Promise<DefaultSettings | null> => {
        const keys = {
            PK: "PS#SETTINGS",
            SK: "default"
        };

        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }

            const { appUrl, deliveryUrl } = result.Item.data;

            return { websiteUrl: deliveryUrl, websitePreviewUrl: appUrl };
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load default settings record.",
                ex.code || "DEFAULT_SETTINGS_GET_ERROR",
                {
                    keys
                }
            );
        }
    };

    const get = async (params: SettingsStorageOperationsGetParams) => {
        const { where } = params;

        const keys = {
            PK: createPartitionKey(where),
            SK: createSortKey(where)
        };
        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load settings record.",
                ex.code || "SETTINGS_GET_ERROR",
                {
                    keys
                }
            );
        }
    };

    const create = async (params: SettingsStorageOperationsCreateParams) => {
        const { settings } = params;
        const keys = {
            PK: createPartitionKey(settings),
            SK: createSortKey(settings)
        };
        try {
            await entity.put({
                ...settings,
                TYPE: createType(),
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
    };

    const update = async (params: SettingsStorageOperationsUpdateParams) => {
        const { original, settings } = params;
        const keys = {
            PK: createPartitionKey(settings),
            SK: createSortKey(settings)
        };
        try {
            await entity.put({
                ...settings,
                TYPE: createType(),
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
    };
    /**
     * We can simply return the partition key for this storage operations.
     */
    const createCacheKey = (params: DefaultSettingsCrudOptions): string => {
        return createPartitionKey(params);
    };

    return {
        get,
        getDefaults,
        create,
        update,
        createCacheKey
    };
};
