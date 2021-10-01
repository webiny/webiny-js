import * as utils from "./utils";
import * as models from "./settings.models";
import { Settings, FormBuilderContext, SettingsCRUD, FormBuilder } from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";

export interface Params {
    tenant: Tenant;
    locale: I18NLocale;
    context: FormBuilderContext;
}

export const createSettingsCrud = (params: Params): SettingsCRUD => {
    const { tenant, locale, context } = params;

    return {
        async getSettings(this: FormBuilder, options = { auth: true }) {
            if (!options || options.auth !== false) {
                await utils.checkBaseSettingsPermissions(context);
            }

            try {
                return await this.storageOperations.getSettings({
                    tenant: tenant.id,
                    locale: locale.code
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load settings.",
                    ex.code || "GET_SETTINGS_ERROR"
                );
            }
        },
        async createSettings(this: FormBuilder, input) {
            const formBuilderSettings = new models.CreateDataModel().populate(input);
            await formBuilderSettings.validate();

            const data = await formBuilderSettings.toJSON();
            const settings: Settings = {
                ...data,
                tenant: tenant.id,
                locale: locale.code
            };
            try {
                return await this.storageOperations.createSettings({
                    settings
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create settings.",
                    ex.code || "CREATE_SETTINGS_ERROR",
                    {
                        settings,
                        input
                    }
                );
            }
        },
        async updateSettings(this: FormBuilder, data) {
            await utils.checkBaseSettingsPermissions(context);
            const updatedData = new models.UpdateDataModel().populate(data);
            await updatedData.validate();

            const newSettings = await updatedData.toJSON({ onlyDirty: true });
            const original = await this.getSettings();

            const settings: Settings = {
                ...original,
                ...newSettings,
                tenant: tenant.id,
                locale: locale.code
            };
            try {
                return await this.storageOperations.updateSettings({
                    settings,
                    original
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update settings.",
                    ex.code || "UPDATE_SETTINGS_ERROR",
                    {
                        settings,
                        original
                    }
                );
            }
        },

        async deleteSettings(this: FormBuilder) {
            await utils.checkBaseSettingsPermissions(context);
            const settings = await this.getSettings();

            try {
                await this.storageOperations.deleteSettings({ settings });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete settings.",
                    ex.code || "DELETE_SETTINGS_ERROR"
                );
            }
        }
    };
};
