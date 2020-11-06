import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { withFields, string, boolean, fields, setOnce } from "@commodo/fields";

// TODO: Use `toJSON` function from "@commodo/fields"
export const getJSON = instance => {
    const output = {};
    const fields = Object.keys(instance.getFields());

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (
            typeof instance[field] === "object" &&
            !Array.isArray(instance[field]) &&
            instance[field]
        ) {
            output[field] = getJSON(instance[field]);
        } else if (instance[field]) {
            output[field] = instance[field];
        }
    }
    return output;
};

export const PK_SETTINGS = "S";

export const FB_SETTINGS_KEY = "form-builder";
// A simple data model
const FormBuilderSettings = withFields({
    key: setOnce()(string({ value: FB_SETTINGS_KEY })),
    installed: boolean({ value: false }),
    domain: string(),
    reCaptcha: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            siteKey: string({ validation: validation.create("maxLength:100") }),
            secretKey: string({ validation: validation.create("maxLength:100") })
        })()
    })
})();

export const dbArgs = {
    table: process.env.DB_TABLE_FORM_BUILDER,
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};

export type FormBuilderSettingsType = {
    key: string;
    installed: boolean;
    domain: string;
    reCaptcha: Record<string, any>;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.formBuilderSettings = {
            async get(key = FB_SETTINGS_KEY) {
                const [[settings]] = await db.read<FormBuilderSettingsType>({
                    ...dbArgs,
                    query: { PK: PK_SETTINGS, SK: key },
                    limit: 1
                });

                return settings;
            },
            async list(args) {
                const [settingsList] = await db.read<FormBuilderSettingsType>({
                    ...dbArgs,
                    query: { PK: PK_SETTINGS, SK: { $gt: " " } },
                    ...args
                });

                return settingsList;
            },
            async create(data) {
                // Use `WithFields` model for data validation and setting default value.
                const formBuilderSettings = new FormBuilderSettings().populate(data);
                await formBuilderSettings.validate();

                await db.create({
                    data: {
                        PK: PK_SETTINGS,
                        SK: formBuilderSettings.key,
                        ...getJSON(formBuilderSettings)
                    }
                });

                return formBuilderSettings;
            },
            async update({ data, existingSettings }) {
                // Only update incoming props
                const propsToUpdate = Object.keys(data);
                propsToUpdate.forEach(key => {
                    existingSettings[key] = data[key];
                });

                // Use `WithFields` model for data validation and setting default value.
                const formBuilderSettings = new FormBuilderSettings().populate(existingSettings);
                await formBuilderSettings.validate();

                await db.update({
                    ...dbArgs,
                    query: { PK: PK_SETTINGS, SK: formBuilderSettings.key },
                    data: getJSON(formBuilderSettings)
                });

                return formBuilderSettings;
            },
            delete(key = FB_SETTINGS_KEY) {
                return db.delete({
                    ...dbArgs,
                    query: { PK: PK_SETTINGS, SK: key }
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
