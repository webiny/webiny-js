import { ContextPlugin } from "@webiny/handler/types";
import Error from "@webiny/error";
import * as utils from "../../utils";
import {
    CmsContentModelGroupType,
    CmsContext,
    CmsSettingsContextType,
    CmsSettingsPermissionType,
    CmsSettingsType,
    DbItemTypes
} from "../../types";
import { NotAuthorizedError } from "@webiny/api-security";
import WebinyError from "@webiny/error";

type SettingsGetOptionsArgsType = {
    auth?: boolean;
};

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
        const { db, elasticSearch } = context;

        const PK_SETTINGS = () => `${utils.createCmsPK(context)}#SETTINGS`;

        const checkPermissions = (): Promise<CmsSettingsPermissionType> => {
            return utils.checkPermissions(context, "cms.settings");
        };

        const settings: CmsSettingsContextType = {
            contentModelLastChange: new Date(),
            get: async (options): Promise<CmsSettingsType | null> => {
                const { auth = true } = options || {};
                if (auth !== false) {
                    await checkPermissions();
                }

                const [[settings]] = await db.read<CmsSettingsType>({
                    ...utils.defaults.db,
                    query: { PK: PK_SETTINGS(), SK: SETTINGS_SECONDARY_KEY }
                });

                return settings;
            },
            install: async (): Promise<CmsSettingsType> => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    throw new NotAuthorizedError();
                }

                // Get settings without any permission checks.
                const settings = await context.cms.settings.get({ auth: false });
                if (!!settings?.isInstalled) {
                    throw new Error("The app is already installed.", "CMS_INSTALLATION_ERROR");
                }

                // Add default content model group.
                let contentModelGroup: CmsContentModelGroupType;
                try {
                    contentModelGroup = await context.cms.groups.create(initialContentModelGroup);
                } catch (ex) {
                    throw new WebinyError(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR");
                }

                const model: CmsSettingsType = {
                    isInstalled: true,
                    contentModelLastChange: contentModelGroup.savedOn
                };

                // Store the initial timestamp which is then used to determine if CMS Schema was changed.
                context.cms.settings.contentModelLastChange = contentModelGroup.savedOn;

                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: PK_SETTINGS(),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: DbItemTypes.CMS_SETTINGS,
                        ...model
                    }
                });

                // Create ES index if it doesn't already exist.
                const esIndex = utils.defaults.es(context);
                const { body: exists } = await elasticSearch.indices.exists(esIndex);
                if (!exists) {
                    await elasticSearch.indices.create(esIndex);
                }

                return model;
            },
            updateContentModelLastChange: async (): Promise<CmsSettingsType> => {
                const updatedDate = new Date();

                await db.update({
                    ...utils.defaults.db,
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
                    contentModelLastChange: updatedDate
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
