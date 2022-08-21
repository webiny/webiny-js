/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string, number, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { FileManagerContext, FileManagerSettings } from "~/types";
import { SettingsStorageOperationsProviderPlugin } from "~/plugins/definitions/SettingsStorageOperationsProviderPlugin";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";

// TODO @ts-refactor verify that this is not used and remove it
export const SETTINGS_KEY = "file-manager";

const CreateDataModel = withFields({
    uploadMinFileSize: number({ value: 0, validation: validation.create("gte:0") }),
    uploadMaxFileSize: number({ value: 26214401 }),
    srcPrefix: onSet((value?: string) => {
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
    srcPrefix: onSet((value?: string) => {
        // Make sure srcPrefix always ends with forward slash.
        if (typeof value === "string") {
            return value.endsWith("/") ? value : value + "/";
        }
        return value;
    })(string())
})();

const settingsCrudContextPlugin = new ContextPlugin<FileManagerContext>(async context => {
    const pluginType = SettingsStorageOperationsProviderPlugin.type;

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

    if (!context.fileManager) {
        context.fileManager = {} as any;
    }

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

            const existingSettings = (await storageOperations.get()) as FileManagerSettings;

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

settingsCrudContextPlugin.name = "FileMangerSettingsCrud";

export default settingsCrudContextPlugin;
