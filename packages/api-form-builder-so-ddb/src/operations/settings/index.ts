import {
    FormBuilderStorageOperationsCreateSettingsParams,
    FormBuilderStorageOperationsDeleteSettingsParams,
    FormBuilderStorageOperationsGetSettingsParams,
    FormBuilderStorageOperationsUpdateSettingsParams,
    Settings
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import {
    FormBuilderSettingsStorageOperations,
    FormBuilderSettingsStorageOperationsCreatePartitionKeyParams
} from "~/types";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { get } from "@webiny/db-dynamodb/utils/get";

export interface CreateSettingsStorageOperationsParams {
    entity: Entity<any>;
    table: Table<string, string, string>;
}

export const createSettingsStorageOperations = (
    params: CreateSettingsStorageOperationsParams
): FormBuilderSettingsStorageOperations => {
    const { entity } = params;

    const createSettingsPartitionKey = ({
        tenant,
        locale
    }: FormBuilderSettingsStorageOperationsCreatePartitionKeyParams): string => {
        return `T#${tenant}#L#${locale}#FB#SETTINGS`;
    };

    const createSettingsSortKey = (): string => {
        return "default";
    };

    const createKeys = (params: FormBuilderSettingsStorageOperationsCreatePartitionKeyParams) => {
        return {
            PK: createSettingsPartitionKey(params),
            SK: createSettingsSortKey()
        };
    };

    const createSettings = async (
        params: FormBuilderStorageOperationsCreateSettingsParams
    ): Promise<Settings> => {
        const { settings } = params;
        const keys = createKeys(settings);

        try {
            await entity.put({
                ...settings,
                ...keys
            });
            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create the settings record by given keys.",
                ex.code || "CREATE_SETTINGS_ERROR",
                {
                    keys,
                    settings
                }
            );
        }
    };

    const getSettings = async (
        params: FormBuilderStorageOperationsGetSettingsParams
    ): Promise<Settings | null> => {
        const keys = createKeys(params);

        try {
            const item = await get<Settings>({ entity, keys });
            return cleanupItem(entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get the settings record by given keys.",
                ex.code || "LOAD_SETTINGS_ERROR",
                {
                    keys
                }
            );
        }
    };

    const updateSettings = async (
        params: FormBuilderStorageOperationsUpdateSettingsParams
    ): Promise<Settings> => {
        const { settings, original } = params;
        const keys = createKeys(settings);

        try {
            await entity.put({
                ...settings,
                ...keys
            });
            return settings;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update the settings record by given keys.",
                ex.code || "UPDATE_SETTINGS_ERROR",
                {
                    keys,
                    original,
                    settings
                }
            );
        }
    };

    const deleteSettings = async (
        params: FormBuilderStorageOperationsDeleteSettingsParams
    ): Promise<void> => {
        const { settings } = params;
        const keys = createKeys(settings);
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

    return {
        createSettings,
        getSettings,
        updateSettings,
        deleteSettings,
        createSettingsPartitionKey,
        createSettingsSortKey
    };
};
