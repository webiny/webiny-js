import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import * as utils from "./utils";
import * as models from "./settings.models";
import { Settings, FormBuilderContext } from "~/types";
import WebinyError from "@webiny/error";

export default new ContextPlugin<FormBuilderContext>(async context => {
    /**
     * If formsBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.formBuilder) {
        console.log("Missing formBuilder on context. Skipping Forms crud.");
        return;
    }
    const storageOperations = context.formBuilder.storageOperations;

    const tenant = context.tenancy.getCurrentTenant();
    const locale = context.i18n.getCurrentLocale();

    context.formBuilder.settings = {
        async getSettings(options = { auth: true }) {
            if (!options || options.auth !== false) {
                await utils.checkBaseSettingsPermissions(context);
            }

            try {
                return await storageOperations.getSettings({
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
        async createSettings(input) {
            const formBuilderSettings = new models.CreateDataModel().populate(input);
            await formBuilderSettings.validate();

            const data = await formBuilderSettings.toJSON();
            const settings: Settings = {
                ...data,
                tenant: tenant.id,
                locale: locale.code
            };
            try {
                return await storageOperations.createSettings({
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
        async updateSettings(data) {
            await utils.checkBaseSettingsPermissions(context);
            const updatedData = new models.UpdateDataModel().populate(data);
            await updatedData.validate();

            const newSettings = await updatedData.toJSON({ onlyDirty: true });
            const original = await context.formBuilder.settings.getSettings();

            const settings: Settings = {
                ...original,
                ...newSettings,
                tenant: tenant.id,
                locale: locale.code
            };
            try {
                return await storageOperations.updateSettings({
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

        async deleteSettings() {
            const settings = await context.formBuilder.settings.getSettings();

            try {
                await storageOperations.deleteSettings({ settings });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete settings.",
                    ex.code || "DELETE_SETTINGS_ERROR"
                );
            }
        }
    };
});
