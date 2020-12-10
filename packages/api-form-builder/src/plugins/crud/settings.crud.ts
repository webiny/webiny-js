import { ContextPlugin } from "@webiny/handler/types";
import * as utils from "./utils";
import * as models from "./settings.models";
import defaults from "./defaults";
import { Settings, FormBuilderContext } from "../../types";

export const FB_SETTINGS_KEY = "default";

export default {
    type: "context",
    apply(context) {
        const { db } = context;

        const PK_SETTINGS = () => `${utils.getPKPrefix(context)}SETTINGS`;

        context.formBuilder = {
            ...context.formBuilder,
            settings: {
                async getSettings() {
                    await utils.checkBaseSettingsPermissions(context);
                    
                    const [[settings]] = await db.read<Settings>({
                        ...defaults.db,
                        query: { PK: PK_SETTINGS(), SK: FB_SETTINGS_KEY }
                    });

                    return settings;
                },
                async createSettings(data) {
                    const formBuilderSettings = new models.CreateDataModel().populate(data);
                    await formBuilderSettings.validate();

                    const dataJSON = await formBuilderSettings.toJSON();

                    await db.create({
                        data: {
                            PK: PK_SETTINGS(),
                            SK: FB_SETTINGS_KEY,
                            TYPE: "fb.settings",
                            ...dataJSON
                        }
                    });

                    return dataJSON;
                },
                async updateSettings(data) {
                    await utils.checkBaseSettingsPermissions(context);
                    const updatedData = new models.UpdateDataModel().populate(data);
                    await updatedData.validate();

                    const newSettings = await updatedData.toJSON({ onlyDirty: true });

                    const settings = await this.getSettings();

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK_SETTINGS(), SK: FB_SETTINGS_KEY },
                        data: newSettings
                    });

                    return { ...settings, ...newSettings };
                }
            }
        };
    }
} as ContextPlugin<FormBuilderContext>;
