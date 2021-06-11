import { withFields, string, number, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import { FileManagerContext, FileManagerSettings, SettingsCRUD } from "~/types";
import {
    SettingsStorageOperationsProviderPlugin,
    SystemStorageOperationsProviderPlugin
} from "~/plugins/definitions";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export const SETTINGS_KEY = "file-manager";

const CreateDataModel = withFields({
    uploadMinFileSize: number({ value: 0, validation: validation.create("gte:0") }),
    uploadMaxFileSize: number({ value: 26214401 }),
    srcPrefix: onSet(value => {
        // Make sure srcPrefix always ends with forward slash.
        if (typeof value === "string") {
            return value.endsWith("/") ? value : value + "/";
        }
        return value;
    })(string({ value: "/files/" }))
})();

const UpdateDataModel = withFields({
    uploadMinFileSize: number({
        validation: validation.create("gte:0")
    }),
    uploadMaxFileSize: number(),
    srcPrefix: onSet(value => {
        // Make sure srcPrefix always ends with forward slash.
        if (typeof value === "string") {
            return value.endsWith("/") ? value : value + "/";
        }
        return value;
    })(string())
})();

export default new ContextPlugin<FileManagerContext>(async context => {
    const pluginType = SystemStorageOperationsProviderPlugin.type;

    const providerPlugin = context.plugins
        .byType<SettingsStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    context.fileManager.settings = {
        async getSettings() {
            return storageOperations.get();
        },
        async createSettings(data) {
            const settings = new CreateDataModel().populate(data);
            await settings.validate();

            const settingsData: FileManagerSettings = await settings.toJSON();

            return storageOperations.create({
                data: settingsData
            });
        },
        async updateSettings(data) {
            const updatedValue = new UpdateDataModel().populate(data);
            await updatedValue.validate();

            const existingSettings = await storageOperations.get();

            const updatedSettings: Partial<FileManagerSettings> = await updatedValue.toJSON({
                onlyDirty: true
            });

            return storageOperations.update({
                original: existingSettings,
                data: {
                    ...existingSettings,
                    ...updatedSettings
                }
            });
        },
        async deleteSettings() {
            await storageOperations.delete();

            return true;
        }
    };
});
