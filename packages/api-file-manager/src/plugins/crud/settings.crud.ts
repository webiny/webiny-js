import { withFields, string, number, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";
import defaults from "./utils/defaults";
import { FileManagerContext, Settings, SettingsCRUD } from "~/types";

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

export default (context: FileManagerContext): SettingsCRUD => {
    const { db, tenancy } = context;
    const PK_SETTINGS = () => `T#${tenancy.getCurrentTenant().id}#FM#SETTINGS`;
    const SK_SETTINGS = () => `default`;

    return {
        async getSettings() {
            const [[settings]] = await db.read<Settings>({
                ...defaults.db,
                query: { PK: PK_SETTINGS(), SK: SK_SETTINGS() },
                limit: 1
            });

            return settings;
        },
        async createSettings(data) {
            const settings = new CreateDataModel().populate(data);
            await settings.validate();

            const settingsData: Settings = await settings.toJSON();

            await db.create({
                data: {
                    PK: PK_SETTINGS(),
                    SK: SK_SETTINGS(),
                    TYPE: "fm.settings",
                    ...settingsData
                }
            });

            return settingsData;
        },
        async updateSettings(data) {
            const updatedValue = new UpdateDataModel().populate(data);
            await updatedValue.validate();

            const existingSettings: Settings = await this.getSettings();

            const updatedSettings: Partial<Settings> = await updatedValue.toJSON({
                onlyDirty: true
            });

            await db.update({
                ...defaults,
                query: { PK: PK_SETTINGS(), SK: SK_SETTINGS() },
                data: updatedSettings
            });

            return { ...existingSettings, ...updatedSettings };
        },
        async deleteSettings() {
            await db.delete({
                ...defaults.db,
                query: { PK: PK_SETTINGS(), SK: SK_SETTINGS() }
            });

            return true;
        }
    };
};
