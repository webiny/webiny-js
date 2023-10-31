import { CmsContext, CmsSettingsContext, HeadlessCmsStorageOperations } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SettingsPermissions } from "~/utils/permissions/SettingsPermissions";

export interface CreateSettingsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    settingsPermissions: SettingsPermissions;
    context: CmsContext;
}

export const createSettingsCrud = (params: CreateSettingsCrudParams): CmsSettingsContext => {
    const { storageOperations, settingsPermissions, getTenant, getLocale } = params;

    return {
        getSettings: async () => {
            await settingsPermissions.ensure();
            return await storageOperations.settings.get({
                tenant: getTenant().id,
                locale: getLocale().code
            });
        }
    };
};
