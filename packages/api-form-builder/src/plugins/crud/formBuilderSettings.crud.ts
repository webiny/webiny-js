import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { withFields, string, boolean, fields, setOnce } from "@commodo/fields";
import merge from "merge";
import defaults from "./defaults";
import { FormBuilderSettingsCRUD, FormBuilderSettings } from "../../types";

export const PK_SETTINGS = "S";
export const FB_SETTINGS_KEY = "form-builder";

const CreateDataModel = withFields({
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

const UpdateDataModel = withFields({
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

export default {
    type: "context",
    apply(context) {
        const { db } = context;

        if (!context?.formBuilder?.crud) {
            context.formBuilder = merge({}, context.formBuilder);
            context.formBuilder.crud = {};
        }

        context.formBuilder.crud.formBuilderSettings = {
            async getSettings() {
                const [[settings]] = await db.read<FormBuilderSettings>({
                    ...defaults.db,
                    query: { PK: PK_SETTINGS, SK: FB_SETTINGS_KEY },
                    limit: 1
                });

                return settings;
            },
            async createSettings(data) {
                const formBuilderSettings = new CreateDataModel().populate(data);
                await formBuilderSettings.validate();

                const dataJSON = await formBuilderSettings.toJSON();

                await db.create({
                    data: {
                        PK: PK_SETTINGS,
                        SK: formBuilderSettings.key,
                        TYPE: "FormBuilderSettings",
                        ...dataJSON
                    }
                });

                return dataJSON;
            },
            async updateSettings(data) {
                const updatedData = new UpdateDataModel().populate(data);

                await updatedData.validate();

                const dataJSON = await updatedData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.db,
                    query: { PK: PK_SETTINGS, SK: FB_SETTINGS_KEY },
                    data: dataJSON
                });

                return true;
            },
            deleteSettings() {
                return db.delete({
                    ...defaults.db,
                    query: { PK: PK_SETTINGS, SK: FB_SETTINGS_KEY }
                });
            }
        } as FormBuilderSettingsCRUD;
    }
} as HandlerContextPlugin<HandlerContextDb>;
