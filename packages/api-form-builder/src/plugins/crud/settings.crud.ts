import * as utils from "./utils";
import * as models from "./settings.models";
import { Settings, FormBuilderContext, SettingsCRUD, FormBuilder } from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotFoundError } from "@webiny/handler-graphql";

export interface Params {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    context: FormBuilderContext;
}

export const createSettingsCrud = (params: Params): SettingsCRUD => {
    const { getTenant, getLocale, context } = params;

    return {
        async getSettings(this: FormBuilder, params) {
            const { auth, throwOnNotFound } = params || {};

            if (auth !== false) {
                await utils.checkBaseSettingsPermissions(context);
            }

            let settings: Settings = null;
            try {
                settings = await this.storageOperations.getSettings({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load settings.",
                    ex.code || "GET_SETTINGS_ERROR"
                );
            }
            if (throwOnNotFound === true && !settings) {
                throw new NotFoundError(`"Form Builder" settings not found!`);
            }
            return settings;
        },
        async createSettings(this: FormBuilder, input) {
            const formBuilderSettings = new models.CreateDataModel().populate(input);
            await formBuilderSettings.validate();

            const data = await formBuilderSettings.toJSON();

            const original = await this.getSettings({ auth: false });
            if (original) {
                throw new WebinyError(
                    `"Form Builder" settings already exist.`,
                    "FORM_BUILDER_SETTINGS_CREATE_ERROR",
                    {
                        settings: original
                    }
                );
            }
            /**
             * Assign specific properties, just to be sure nothing else gets in the record.
             */
            const settings: Settings = {
                domain: data.domain,
                reCaptcha: data.reCaptcha,
                tenant: getTenant().id,
                locale: getLocale().code
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
            if (!original) {
                throw new NotFoundError(`"Form Builder" settings not found!`);
            }

            /**
             * Assign specific properties, just to be sure nothing else gets in the record.
             */
            const settings: Settings = Object.keys(newSettings).reduce(
                (collection, key) => {
                    if (newSettings[key] === undefined) {
                        return collection;
                    }
                    collection[key] = newSettings[key];
                    return collection;
                },
                {
                    ...original,
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            );
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
