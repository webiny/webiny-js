import { CmsCrudContextType, CmsSettingsContextType, CmsSettingsType } from "../../types";
import defaults from "../../common/defaults";
import { ContextPlugin } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { createSettingsPk } from "../../common/partitionKeys";
import { SecurityContext } from "@webiny/api-security/types";
import { DbItemTypes } from "../../common/dbItemTypes";

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
    apply(context) {
        const { db } = context;

        const settings: CmsSettingsContextType = {
            get: async (): Promise<CmsSettingsType | null> => {
                const [settings] = await db.read<CmsSettingsType>({
                    ...defaults.db,
                    query: { PK: createSettingsPk(context), SK: SETTINGS_SECONDARY_KEY },
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
                    name: identity.displayName
                };

                // create base environment
                const environment = await context.cms.environments.create(
                    initialEnvironment,
                    createdBy,
                    true
                );
                // need to attach environment to the context
                // so cms content group can be created
                if (!context.environment) {
                    context.environment = environment;
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
                    ...defaults.db,
                    data: {
                        PK: createSettingsPk(context),
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
} as ContextPlugin<I18NContentContext, CmsCrudContextType, TenancyContext, SecurityContext>;
