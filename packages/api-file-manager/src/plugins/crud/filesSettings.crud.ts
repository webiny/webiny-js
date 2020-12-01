import { withFields, string, boolean, number, setOnce, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";

import defaults from "./defaults";
import { FileManagerContextPlugin } from "@webiny/api-file-manager/plugins/context";
import { FileManagerSettings, FileManagerSettingsCRUD } from "@webiny/api-file-manager/types";

export const SETTINGS_KEY = "file-manager";

const CreateDataModel = withFields({
    key: setOnce()(string({ value: SETTINGS_KEY })),
    installed: boolean({ value: false }),
    uploadMinFileSize: number({
        value: 0,
        validation: validation.create("required,gte:0")
    }),
    uploadMaxFileSize: number({
        value: 26214401,
        validation: validation.create("required")
    }),
    srcPrefix: onSet(value => {
        // Make sure srcPrefix always ends with forward slash.
        if (typeof value === "string") {
            return value.endsWith("/") ? value : value + "/";
        }
        return value;
    })(
        string({
            validation: validation.create("required"),
            value: "/files/"
        })
    )
})();

const UpdateDataModel = withFields({
    installed: boolean(),
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

export default (context: FileManagerContextPlugin) => {
    const { db, security } = context;
    const tenant = security.getTenant();
    const PK_FILE_SETTINGS = `T#${tenant.id}#SETTINGS`;

    return {
        async getSettings() {
            const [[settings]] = await db.read<FileManagerSettings>({
                ...defaults.db,
                query: { PK: PK_FILE_SETTINGS, SK: SETTINGS_KEY },
                limit: 1
            });

            return settings;
        },
        async createSettings(data) {
            const settings = new CreateDataModel().populate(data);
            await settings.validate();

            const settingsData = await settings.toJSON();

            await db.create({
                data: {
                    PK: PK_FILE_SETTINGS,
                    SK: SETTINGS_KEY,
                    TYPE: "fm.settings",
                    ...settingsData
                }
            });

            return settingsData;
        },
        async updateSettings(data) {
            const updatedValue = new UpdateDataModel().populate(data);
            await updatedValue.validate();

            const updatedSettings = await updatedValue.toJSON({ onlyDirty: true });

            await db.update({
                ...defaults,
                query: { PK: PK_FILE_SETTINGS, SK: SETTINGS_KEY },
                data: updatedSettings
            });

            return updatedSettings;
        },
        async deleteSettings() {
            await db.delete({
                ...defaults.db,
                query: { PK: PK_FILE_SETTINGS, SK: SETTINGS_KEY }
            });

            return true;
        }
    } as FileManagerSettingsCRUD;
};
