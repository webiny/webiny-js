import {
    CmsContext,
    CmsSettings,
    CmsSettingsContext,
    CmsSettingsPermission,
    HeadlessCmsStorageOperations
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { checkPermissions as baseCheckPermissions } from "~/utils/permissions";

export interface CreateSettingsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
}
export const createSettingsCrud = (params: CreateSettingsCrudParams): CmsSettingsContext => {
    const { storageOperations, context, getTenant, getLocale } = params;

    const checkPermissions = (): Promise<CmsSettingsPermission> => {
        return baseCheckPermissions(context, "cms.settings");
    };

    return {
        getSettings: async () => {
            await checkPermissions();
            return await storageOperations.settings.get({
                tenant: getTenant().id,
                locale: getLocale().code
            });
        },
        updateModelLastChange: async () => {
            const original = await storageOperations.settings.get({
                tenant: getTenant().id,
                locale: getLocale().code
            });

            const settings: CmsSettings = {
                ...(original || {}),
                contentModelLastChange: new Date(),
                tenant: getTenant().id,
                locale: getLocale().code
            };

            if (!original) {
                await storageOperations.settings.create({ settings });
                return;
            }

            await storageOperations.settings.update({
                settings
            });
        },
        getModelLastChange: async () => {
            try {
                const settings = await storageOperations.settings.get({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });

                return settings?.contentModelLastChange || null;
            } catch (ex) {
                console.log({
                    message: ex.message,
                    code: ex.code || "COULD_NOT_FETCH_CONTENT_MODEL_LAST_CHANGE",
                    data: ex
                });
            }
            return null;
        }
    };
};
