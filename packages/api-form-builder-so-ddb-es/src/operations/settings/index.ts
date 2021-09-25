import {
    FormBuilderStorageOperationsCreateSettingsParams,
    FormBuilderStorageOperationsUpdateSettingsParams,
    Settings
} from "@webiny/api-form-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { FormBuilderSettingsStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";

export interface Params {
    entity: Entity<any>;
    table: Table;
    tenant: Tenant;
    locale: I18NLocale;
}

export const createSettingsStorageOperations = (
    params: Params
): FormBuilderSettingsStorageOperations => {
    const { entity, tenant, locale } = params;

    const createPartitionKey = (): string => {
        return `T#${tenant.id}#L#${locale.code}#FB#SETTINGS`;
    };

    const createSortKey = (): string => {
        return "default";
    };

    const createKeys = () => {
        return {
            PK: createPartitionKey(),
            SK: createSortKey()
        };
    };

    const createSettings = async (
        params: FormBuilderStorageOperationsCreateSettingsParams
    ): Promise<Settings> => {
        const { settings } = params;
        const keys = createKeys();

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

    const getSettings = async (): Promise<Settings> => {
        const keys = createKeys();

        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
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
        const keys = createKeys();

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

    const deleteSettings = async (): Promise<void> => {
        const keys = createKeys();
        try {
            await entity.delete();
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

    return <FormBuilderSettingsStorageOperations>(<FormBuilderSettingsStorageOperations>{
        createSettings,
        getSettings,
        updateSettings,
        deleteSettings,
        createPartitionKey,
        createSortKey
    });
};
