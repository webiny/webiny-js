import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { withFields, string, boolean, number, setOnce, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";

export const SETTINGS_KEY = "file-manager";
// A simple data model
const FilesSettings = withFields({
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

const keys = [
    { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
];

export const PK_FILE_SETTINGS = "S";

export type FileSettings = {
    key: string;
    installed: boolean;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.filesSettings = {
            async get(key: string) {
                const [[settings]] = await db.read<FileSettings>({
                    keys,
                    query: { PK: PK_FILE_SETTINGS, SK: key },
                    limit: 1
                });

                return settings;
            },
            async list(args) {
                const [settingsList] = await db.read<FileSettings>({
                    keys,
                    query: { PK: PK_FILE_SETTINGS, SK: { $gt: " " } },
                    ...args
                });

                return settingsList;
            },
            async create(data) {
                // Use `WithFields` model for data validation and setting default value.
                const filesSettings = new FilesSettings().populate(data);
                await filesSettings.validate();

                return db.create({
                    data: {
                        PK: PK_FILE_SETTINGS,
                        SK: filesSettings.key,
                        key: filesSettings.key,
                        installed: filesSettings.installed,
                        uploadMinFileSize: filesSettings.uploadMinFileSize,
                        uploadMaxFileSize: filesSettings.uploadMaxFileSize,
                        srcPrefix: filesSettings.srcPrefix
                    }
                });
            },
            async update(data) {
                const { key } = data;
                // Use `WithFields` model for data validation and setting default value.
                const filesSettings = new FilesSettings().populate(data);
                await filesSettings.validate();

                return db.update({
                    keys,
                    query: { PK: PK_FILE_SETTINGS, SK: key },
                    data: {
                        key: filesSettings.key,
                        installed: filesSettings.installed,
                        uploadMinFileSize: filesSettings.uploadMinFileSize,
                        uploadMaxFileSize: filesSettings.uploadMaxFileSize,
                        srcPrefix: filesSettings.srcPrefix
                    }
                });
            },
            delete(key: string) {
                return db.delete({
                    keys,
                    query: { PK: PK_FILE_SETTINGS, SK: key }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
