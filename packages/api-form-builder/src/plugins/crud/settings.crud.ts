import * as models from "./settings.models";
import {
    Settings,
    FormBuilderContext,
    SettingsCRUD,
    FormBuilder,
    OnSettingsBeforeCreate,
    OnSettingsAfterCreate,
    OnSettingsBeforeUpdate,
    OnSettingsAfterUpdate,
    OnSettingsBeforeDelete,
    OnSettingsAfterDelete
} from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import { SettingsPermissions } from "./permissions/SettingsPermissions";

export interface CreateSettingsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    settingsPermissions: SettingsPermissions;
    context: FormBuilderContext;
}

export const createSettingsCrud = (params: CreateSettingsCrudParams): SettingsCRUD => {
    const { getTenant, getLocale, settingsPermissions } = params;

    // create
    const onSettingsBeforeCreate = createTopic<OnSettingsBeforeCreate>(
        "formBuilder.onSettingsBeforeCreate"
    );
    const onSettingsAfterCreate = createTopic<OnSettingsAfterCreate>(
        "formBuilder.onSettingsAfterCreate"
    );

    // update
    const onSettingsBeforeUpdate = createTopic<OnSettingsBeforeUpdate>(
        "formBuilder.onSettingsBeforeUpdate"
    );
    const onSettingsAfterUpdate = createTopic<OnSettingsAfterUpdate>(
        "formBuilder.onSettingsAfterUpdate"
    );

    // delete
    const onSettingsBeforeDelete = createTopic<OnSettingsBeforeDelete>(
        "formBuilder.onSettingsBeforeDelete"
    );
    const onSettingsAfterDelete = createTopic<OnSettingsAfterDelete>(
        "formBuilder.onSettingsAfterDelete"
    );

    return {
        onSettingsBeforeCreate,
        onSettingsAfterCreate,
        onSettingsBeforeUpdate,
        onSettingsAfterUpdate,
        onSettingsBeforeDelete,
        onSettingsAfterDelete,
        async getSettings(this: FormBuilder, params) {
            const { auth, throwOnNotFound, locale } = params || {};

            if (auth !== false) {
                await settingsPermissions.ensure();
            }

            let settings: Settings | null = null;
            try {
                settings = await this.storageOperations.getSettings({
                    tenant: getTenant().id,
                    locale: locale || getLocale().code
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

            const original = await this.getSettings({
                auth: false,
                locale: input.locale
            });

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
                locale: input.locale || getLocale().code
            };
            try {
                await onSettingsBeforeCreate.publish({
                    settings
                });
                const result = await this.storageOperations.createSettings({
                    settings
                });
                await onSettingsAfterCreate.publish({
                    settings: result
                });
                return result;
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
            await settingsPermissions.ensure();

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
            const settings = Object.keys(newSettings).reduce(
                (collection, key) => {
                    if (newSettings[key] === undefined) {
                        return collection;
                    }
                    collection[key as keyof Settings] = newSettings[key];
                    return collection;
                },
                {
                    ...original,
                    tenant: getTenant().id,
                    locale: getLocale().code
                } as Settings
            );
            try {
                await onSettingsBeforeUpdate.publish({
                    original,
                    settings
                });
                const result = await this.storageOperations.updateSettings({
                    settings,
                    original
                });

                await onSettingsAfterUpdate.publish({
                    original,
                    settings
                });

                return result;
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
        async deleteSettings(this: FormBuilder, params) {
            const { locale } = params || {};
            await settingsPermissions.ensure();

            const settings = await this.getSettings({ locale });
            if (!settings) {
                return;
            }
            try {
                await onSettingsBeforeDelete.publish({
                    settings
                });

                await this.storageOperations.deleteSettings({ settings });

                await onSettingsAfterDelete.publish({
                    settings
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete settings.",
                    ex.code || "DELETE_SETTINGS_ERROR"
                );
            }
        }
    };
};
