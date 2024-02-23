import {
    DefaultSettings,
    DefaultSettingsCrudOptions,
    Settings,
    SettingsStorageOperations,
    SettingsStorageOperationsCreateParams,
    SettingsStorageOperationsGetParams,
    SettingsStorageOperationsUpdateParams,
    SettingsStorageOperationsDeleteParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { getClean } from "@webiny/db-dynamodb/utils/get";
import WebinyError from "@webiny/error";
import { put } from "@webiny/db-dynamodb";

/**
 * Because it is a possibility that tenant and locale are set as false (for the global settings) we must take
 * it in consideration and create the partition key for the global settings.
 */
interface PartitionKeyParams {
    tenant?: string | boolean;
    locale?: string | boolean;
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

const createType = (): string => {
    return "pb.settings";
};

export interface CreateSettingsStorageOperationsParams {
    entity: Entity;
}

export interface DbDefaultSettings {
    data: {
        appUrl: string;
        deliveryUrl: string;
    };
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
            const result = await getClean<DbDefaultSettings>({
                entity,
                keys
            });
            if (!result) {
                return null;
            }

            return {
                websiteUrl: result.data.deliveryUrl,
                websitePreviewUrl: result.data.appUrl
            };
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
            SK: "A"
        };
        try {
            const result = await getClean<{ data: Settings }>({
                entity,
                keys
            });
            return result?.data || null;
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
            SK: "A"
        };
        try {
            await put({
                entity,
                item: {
                    TYPE: createType(),
                    data: settings,
                    ...keys
                }
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
            SK: "A"
        };
        try {
            await put({
                entity,
                item: {
                    data: settings,
                    TYPE: createType(),
                    ...keys
                }
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

    const deleteSettings = async (params: SettingsStorageOperationsDeleteParams) => {
        const { settings } = params;
        const keys = {
            PK: createPartitionKey(settings),
            SK: "A"
        };
        try {
            await entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the settings record by given keys.",
                ex.code || "DELETE_SETTINGS_ERROR",
                {
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
        delete: deleteSettings,
        createCacheKey
    };
};
