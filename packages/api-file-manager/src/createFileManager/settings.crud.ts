import { createTopic } from "@webiny/pubsub";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string, number, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { FileManagerSettings, SettingsCRUD } from "~/types";
import { FileManagerConfig } from "~/createFileManager/index";

const CreateDataModel = withFields({
    uploadMinFileSize: number({ value: 0, validation: validation.create("gte:0") }),
    uploadMaxFileSize: number({ value: 10737418240 }),
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

export const createSettingsCrud = ({
    storageOperations,
    getTenantId
}: FileManagerConfig): SettingsCRUD => {
    return {
        onSettingsBeforeUpdate: createTopic("fileManager.onSettingsBeforeUpdate"),
        onSettingsAfterUpdate: createTopic("fileManager.onSettingsAfterUpdate"),
        async getSettings() {
            return storageOperations.settings.get({ tenant: getTenantId() });
        },
        async createSettings(data) {
            const settings = new CreateDataModel().populate(data);
            await settings.validate();

            const settingsData: FileManagerSettings = await settings.toJSON();

            return storageOperations.settings.create({
                data: { ...settingsData, tenant: getTenantId() }
            });
        },
        async updateSettings(data) {
            const updatedValue = new UpdateDataModel().populate(data);
            await updatedValue.validate();

            const existingSettings = (await storageOperations.settings.get({
                tenant: getTenantId()
            })) as FileManagerSettings;

            const updatedSettings: Partial<FileManagerSettings> = await updatedValue.toJSON({
                onlyDirty: true
            });

            const settings: FileManagerSettings = {
                ...existingSettings,
                ...updatedSettings,
                tenant: getTenantId()
            };

            await this.onSettingsBeforeUpdate.publish({
                input: data,
                original: existingSettings,
                settings
            });
            const result = await storageOperations.settings.update({
                original: existingSettings,
                data: settings
            });
            await this.onSettingsAfterUpdate.publish({
                input: data,
                original: existingSettings,
                settings: result
            });

            return result;
        },
        async deleteSettings() {
            await storageOperations.settings.delete({ tenant: getTenantId() });

            return true;
        }
    };
};
