import { ContextPlugin } from "@webiny/handler/types";
import * as utils from "../../utils";
import { CmsContext, CmsSettingsContextType, CmsSettingsType, DbItemTypes } from "../../types";

const initialEnvironment = {
    name: "Production",
    slug: "production",
    description: "This is the production environment"
};
const initialEnvironmentAlias = {
    slug: "production",
    name: "Production",
    description: `This is the "production" environment alias`
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
        const { db } = context;

        const settings: CmsSettingsContextType = {
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
            install: async (): Promise<void> => {
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

                // create base environment
                const environment = await context.cms.environments.create(
                    initialEnvironment,
                    createdBy,
                    true
                );

                // need to attach environment to the context
                // so cms content group can be created
                if (!context.cms.environment) {
                    context.cms.environment = environment.slug;
                }

                // and its alias
                const environmentAlias = await context.cms.environmentAliases.create(
                    {
                        ...initialEnvironmentAlias,
                        environment: environment.id
                    },
                    createdBy
                );
                // then add default content model group
                await context.cms.groups.create(initialContentModelGroup, createdBy);
                // mark as installed in settings
                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: utils.createSettingsPk(context),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: DbItemTypes.CMS_SETTINGS,
                        isInstalled: true,
                        environment: environment.id,
                        environmentAlias: environmentAlias.id
                    }
                });
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            settings
        };
    }
} as ContextPlugin<CmsContext>;
