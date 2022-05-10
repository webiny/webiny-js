import * as utils from "~/utils";
import {
    CmsContext,
    CmsSettingsPermission,
    CmsSettings,
    HeadlessCmsStorageOperations,
    CmsSettingsContext
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";

export interface CreateSettingsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
}
export const createSettingsCrud = (params: CreateSettingsCrudParams): CmsSettingsContext => {
    const { storageOperations, context, getTenant, getLocale } = params;

    const checkPermissions = (): Promise<CmsSettingsPermission> => {
        return utils.checkPermissions(context, "cms.settings");
    };

    return {
        getSettings: async (): Promise<CmsSettings | null> => {
            await checkPermissions();
            return await storageOperations.settings.get({
                tenant: getTenant().id,
                locale: getLocale().code
            });
        },
        updateModelLastChange: async (): Promise<void> => {
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
        getModelLastChange: async (): Promise<Date> => {
            try {
                const settings = await storageOperations.settings.get({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
                if (!settings || !settings.contentModelLastChange) {
                    return new Date();
                }
                return settings.contentModelLastChange;
            } catch (ex) {
                console.log({
                    error: {
                        message: ex.message,
                        code: ex.code || "COULD_NOT_FETCH_CONTENT_MODEL_LAST_CHANGE",
                        data: ex
                    }
                });
            }
            return new Date();
        }
    };
};
