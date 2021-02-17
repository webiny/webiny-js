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
import { isSystemUpgradeable, systemUpgrade } from "@webiny/system-upgrade";
import WebinyError from "@webiny/error";
import { UpgradeSystemResults } from "@webiny/system-upgrade/types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

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

        const settingsGet = async () => {
            const [[settings]] = await db.read<CmsSettings>({
                ...utils.defaults.db(),
                query: { PK: PK_SETTINGS(), SK: SETTINGS_SECONDARY_KEY }
            });

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
                // const esIndex = utils.defaults.es(context);
                // const { body: exists } = await elasticSearch.indices.exists(esIndex);
                // if (!exists) {
                //     await elasticSearch.indices.create({
                //         ...esIndex,
                //         body: {
                //             // we are disabling indexing of rawValues property in object that is inserted into ES
                //             mappings: {
                //                 properties: {
                //                     rawValues: { type: "object", enabled: false }
                //                 }
                //             }
                //         }
                //     });
                // }

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
                    webinyVersion: context.WEBINY_VERSION
                };

                // Store the initial timestamp which is then used to determine if CMS Schema was changed.
                context.cms.settings.contentModelLastChange = contentModelGroup.savedOn;

                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db(),
                    data: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: "cms.settings",
                        ...model
                    }
                });

                return model;
            },
            isSystemUpgradeAvailable: async () => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    throw new NotAuthorizedError({
                        message: `There is no "identity" in the "context.security", presumably because you are not logged in.`,
                        code: "IDENTITY_ERROR"
                    });
                }
                const fullAccess = await context.security.hasFullAccess();
                if (!fullAccess) {
                    throw new NotAuthorizedError();
                }
                try {
                    return await isSystemUpgradeable(context);
                } catch (ex) {
                    throw new WebinyError(ex.message, ex.code, ex.data);
                }
            },
            systemUpgrade: async () => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    throw new NotAuthorizedError({
                        message: `There is no "identity" in the "context.security", presumably because you are not logged in.`,
                        code: "IDENTITY_ERROR"
                    });
                }
                const fullAccess = await context.security.hasFullAccess();
                if (!fullAccess) {
                    throw new NotAuthorizedError();
                }
                // we need as because typescript does not see correctly what is systemUpgrade returning
                const response = (await systemUpgrade(context)) as UpgradeSystemResults<CmsContext>;
                const errors = Object.values(response.results)
                    .filter(result => !!result.error)
                    .map(result => result.error);

                if (errors.length) {
                    throw new WebinyError(
                        "Could not finish system upgrade.",
                        "SYSTEM_UPGRADE_ERROR",
                        {
                            errors: errors
                        }
                    );
                }
                await db.update({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY
                    },
                    data: {
                        webinyVersion: context.WEBINY_VERSION
                    }
                });

                return response;
            },
            updateContentModelLastChange: async (): Promise<CmsSettings> => {
                const updatedDate = new Date();

                await db.update({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY
                    },
                    data: {
                        lastContentModelChange: updatedDate
                    }
                });

                context.cms.settings.contentModelLastChange = updatedDate;

                return {
                    isInstalled: true,
                    contentModelLastChange: updatedDate,
                    webinyVersion: context.WEBINY_VERSION
                };
            },
            getContentModelLastChange: (): Date => {
                return context.cms.settings.contentModelLastChange;
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings
        };
    }
} as ContextPlugin<CmsContext>;
