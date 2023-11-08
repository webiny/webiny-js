import WebinyError from "@webiny/error";
import {
    PrerenderingServiceSaveSettingsParams,
    PrerenderingServiceSettingsStorageOperations,
    PrerenderingSettings
} from "@webiny/api-prerendering-service/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { get } from "@webiny/db-dynamodb/utils/get";
import { put } from "@webiny/db-dynamodb";

export interface CreateSettingsStorageOperationsParams {
    entity: Entity<any>;
}

export const createSettingsStorageOperations = (
    params: CreateSettingsStorageOperationsParams
): PrerenderingServiceSettingsStorageOperations => {
    const { entity } = params;

    const getSettings = async (variant = "default"): Promise<PrerenderingSettings> => {
        const keys = {
            PK: "PS#SETTINGS",
            SK: variant
        };

        try {
            const result = await get<{ data: PrerenderingSettings }>({
                entity,
                keys
            });

            if (!result) {
                throw Error();
            }

            return result.data;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load prerendering settings!",
                ex.code || "GET_SETTINGS_ERROR",
                {
                    keys,
                    params
                }
            );
        }
    };

    const saveSettings = async (params: PrerenderingServiceSaveSettingsParams) => {
        const { settings, variant = "default" } = params;
        const keys = {
            PK: "PS#SETTINGS",
            SK: variant
        };

        try {
            await put({
                entity,
                item: {
                    ...keys,
                    TYPE: "ps.settings",
                    data: settings
                }
            });

            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not save settings.",
                ex.code || "SAVE_SETTINGS_ERROR",
                {
                    keys
                }
            );
        }
    };

    return {
        getSettings,
        saveSettings
    };
};
