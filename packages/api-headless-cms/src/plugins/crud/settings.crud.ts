import crypto from "crypto";
import { ContextPlugin } from "@webiny/handler/types";
import Error from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import * as utils from "../../utils";
import {
    CmsContentModelGroup,
    CmsContext,
    CmsSettingsContext,
    CmsSettingsPermission,
    CmsSettings
} from "../../types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

const SK_SETTINGS = "settings";

export default {
    type: "context",
    name: "context-settings-crud",
    apply(context) {
        const { db, elasticSearch } = context;

        const PK_SETTINGS = () => `${utils.createCmsPK(context)}#SETTINGS`;

        const checkPermissions = (): Promise<CmsSettingsPermission> => {
            return utils.checkPermissions(context, "cms.settings");
        };

        const createAPIKey = () => {
            return crypto.randomBytes(Math.ceil(48 / 2)).toString("hex");
        };

        const settingsGet = async () => {
            const [[settings]] = await db.read<CmsSettings>({
                ...utils.defaults.db,
                query: { PK: PK_SETTINGS(), SK: SK_SETTINGS }
            });

            if (settings && !settings.readAPIKey) {
                settings.readAPIKey = createAPIKey();
                await db.update({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SK_SETTINGS
                    },
                    data: {
                        readAPIKey: settings.readAPIKey
                    }
                });
            }

            return settings;
        };

        const settings: CmsSettingsContext = {
            contentModelLastChange: new Date(),
            noAuth: () => {
                return {
                    get: settingsGet
                };
            },
            get: async (): Promise<CmsSettings | null> => {
                await checkPermissions();
                return settingsGet();
            },
            install: async (): Promise<CmsSettings> => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    throw new NotAuthorizedError({
                        message: `There is no "identity" in the "context.security", presumably because you are not logged in.`,
                        code: "IDENTITY_ERROR"
                    });
                }

                // Get settings without any permission checks.
                const settings = await settingsGet();
                if (!!settings?.isInstalled) {
                    throw new Error("The app is already installed.", "CMS_INSTALLATION_ERROR");
                }

                // Create ES index if it doesn't already exist.
                const esIndex = utils.defaults.es(context);
                const { body: exists } = await elasticSearch.indices.exists(esIndex);
                if (!exists) {
                    await elasticSearch.indices.create({
                        ...esIndex,
                        body: {
                            // we are disabling indexing of rawValues property in object that is inserted into ES
                            mappings: {
                                properties: {
                                    rawValues: { type: "object", enabled: false }
                                }
                            }
                        }
                    });
                }

                // Add default content model group.
                let contentModelGroup: CmsContentModelGroup;
                try {
                    contentModelGroup = await context.cms.groups.create(initialContentModelGroup);
                } catch (ex) {
                    throw new Error(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR");
                }

                const model: CmsSettings = {
                    isInstalled: true,
                    contentModelLastChange: contentModelGroup.savedOn,
                    readAPIKey: createAPIKey()
                };

                // Store the initial timestamp which is then used to determine if CMS Schema was changed.
                context.cms.settings.contentModelLastChange = contentModelGroup.savedOn;

                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: PK_SETTINGS(),
                        SK: SK_SETTINGS,
                        TYPE: "cms.settings",
                        ...model
                    }
                });

                return model;
            },
            updateContentModelLastChange: async (): Promise<void> => {
                const updatedDate = new Date();

                await db.update({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SK_SETTINGS
                    },
                    data: {
                        lastContentModelChange: updatedDate
                    }
                });

                context.cms.settings.contentModelLastChange = updatedDate;
            },
            getContentModelLastChange: (): Date => {
                return context.cms.settings.contentModelLastChange;
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings,
            async getReadAPIKey() {
                const settings = await settingsGet();
                return settings ? settings.readAPIKey : null;
            }
        };
    }
} as ContextPlugin<CmsContext>;
