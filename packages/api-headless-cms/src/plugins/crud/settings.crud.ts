import { ContextPlugin } from "@webiny/handler/types";
import * as utils from "../../utils";
import { CmsContext, CmsSettingsContext, CmsSettingsPermission, CmsSettings } from "../../types";
import configurations from "../../configurations";

const SETTINGS_SECONDARY_KEY = "settings";

export default {
    type: "context",
    name: "context-settings-crud",
    apply(context) {
        const { db } = context;

        const PK_SETTINGS = () => `${utils.createCmsPK(context)}#SETTINGS`;

        const checkPermissions = (): Promise<CmsSettingsPermission> => {
            return utils.checkPermissions(context, "cms.settings");
        };

        const settingsGet = async (): Promise<CmsSettings> => {
            const [[settings]] = await db.read<CmsSettings>({
                ...configurations.db(),
                query: { PK: PK_SETTINGS(), SK: SETTINGS_SECONDARY_KEY }
            });

            return settings;
        };

        const settings: CmsSettingsContext = {
            noAuth: () => {
                return {
                    get: settingsGet
                };
            },
            get: async (): Promise<CmsSettings | null> => {
                await checkPermissions();
                return settingsGet();
            },
            updateContentModelLastChange: async (): Promise<void> => {
                const data: CmsSettings = {
                    contentModelLastChange: new Date().toISOString()
                };

                const settings = await settingsGet();
                if (!settings) {
                    await db.create({
                        ...configurations.db(),
                        data: {
                            PK: PK_SETTINGS(),
                            SK: SETTINGS_SECONDARY_KEY,
                            ...data
                        }
                    });
                    return;
                }

                await db.update({
                    ...configurations.db(),
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY
                    },
                    data
                });
            },
            getContentModelLastChange: async (): Promise<Date> => {
                try {
                    const settings = await settingsGet();
                    if (!settings || !settings.contentModelLastChange) {
                        return new Date();
                    }
                    return new Date(settings.contentModelLastChange);
                } catch (ex) {
                    console.log({
                        error: {
                            message: ex.message,
                            code: ex.code || "COULD_NOT_FETCH_CONTENT_MODEL_LAST_CHANGE",
                            data: ex
                        }
                    });
                }
                return new Date();
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings
        };
    }
} as ContextPlugin<CmsContext>;
