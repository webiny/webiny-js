import {
    CmsSettings,
    CmsSettingsStorageOperations,
    CmsSettingsStorageOperationsCreateParams,
    CmsSettingsStorageOperationsGetParams,
    CmsSettingsStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types";
import { Entity } from "dynamodb-toolbox";
import { get as getRecord } from "@webiny/db-dynamodb/utils/get";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

interface CmsSettingsDb extends Omit<CmsSettings, "contentModelLastChange"> {
    contentModelLastChange: string;
}

const convertToDbData = (settings: CmsSettings): CmsSettingsDb => {
    return {
        ...settings,
        contentModelLastChange: settings.contentModelLastChange.toISOString()
    };
};

const convertFromDbData = (settings?: CmsSettingsDb): CmsSettings | null => {
    if (!settings) {
        return null;
    }
    let contentModelLastChange;
    try {
        contentModelLastChange = new Date(settings.contentModelLastChange);
    } catch {
        contentModelLastChange = new Date();
    }
    return {
        ...settings,
        contentModelLastChange
    };
};

interface PartitionKeyParams {
    tenant: string;
    locale: string;
}

const createPartitionKey = ({ tenant, locale }: PartitionKeyParams): string => {
    return `T#${tenant}#L#${locale}#CMS#SETTINGS`;
};

const createSortKey = (): string => {
    return "settings";
};

interface Keys {
    PK: string;
    SK: string;
}
const createKeys = (params: PartitionKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKey()
    };
};

export interface CreateSettingsStorageOperationsParams {
    entity: Entity<any>;
}

export const createSettingsStorageOperations = (
    params: CreateSettingsStorageOperationsParams
): CmsSettingsStorageOperations => {
    const { entity } = params;

    const create = async (params: CmsSettingsStorageOperationsCreateParams) => {
        const { settings } = params;
        const keys = createKeys(settings);

        const dbSettings: CmsSettingsDb = convertToDbData(settings);

        try {
            await entity.put({
                ...dbSettings,
                ...keys
            });
            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create settings.",
                ex.code || "CREATE_SETTINGS_ERROR",
                {
                    error: ex,
                    settings,
                    dbSettings,
                    keys
                }
            );
        }
    };

    const update = async (params: CmsSettingsStorageOperationsUpdateParams) => {
        const { settings } = params;

        const keys = createKeys(settings);

        const dbSettings: CmsSettingsDb = convertToDbData(settings);

        try {
            await entity.put({
                ...dbSettings,
                ...keys
            });
            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update settings.",
                ex.code || "UPDATE_SETTINGS_ERROR",
                {
                    error: ex,
                    settings,
                    dbSettings,
                    keys
                }
            );
        }
    };

    const get = async (params: CmsSettingsStorageOperationsGetParams) => {
        const keys = createKeys(params);
        try {
            const record = await getRecord<CmsSettingsDb>({
                entity,
                keys
            });
            if (!record) {
                return null;
            }
            const settings = cleanupItem(entity, record) as CmsSettingsDb;
            return convertFromDbData(settings);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get settings.",
                ex.code || "GET_SETTINGS_ERROR",
                {
                    error: ex,
                    keys
                }
            );
        }
    };

    return {
        create,
        get,
        update
    };
};
