import { ContextPlugin } from "@webiny/handler/types";
import * as utils from "../../utils";
import { CmsContext, CmsSettingsContextType, CmsSettingsType, DbItemTypes } from "../../types";

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

        const settings: CmsSettingsContextType = {
            contentModelLastChange: new Date(),
            get: async (): Promise<CmsSettingsType | null> => {
                const [settings] = await db.read<CmsSettingsType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createSettingsPk(context), SK: SETTINGS_SECONDARY_KEY },
                    limit: 1
                });
                if (!settings || settings.length === 0) {
                    return null;
                }
                return settings.find(() => true);
            },
            install: async (): Promise<CmsSettingsType> => {
                const settings = await context.cms.settings.get();
                if (!!settings?.isInstalled) {
                    throw new Error("The app is already installed.");
                }
                const identity = context.security.getIdentity();
                const createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                // then add default content model group
                const contentModel = await context.cms.groups.create(
                    initialContentModelGroup,
                    createdBy
                );

                const model: CmsSettingsType = {
                    isInstalled: true,
                    contentModelLastChange: contentModel.savedOn
                };
                context.cms.settings.contentModelLastChange = contentModel.savedOn;
                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: utils.createSettingsPk(context),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: DbItemTypes.CMS_SETTINGS,
                        ...model
                    }
                });
                return model;
            },
            updateContentModelLastChange: async (): Promise<CmsSettingsType> => {
                const updatedDate = new Date();
                await db.update({
                    ...utils.defaults.db,
                    query: {
                        PK: utils.createSettingsPk(context),
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
