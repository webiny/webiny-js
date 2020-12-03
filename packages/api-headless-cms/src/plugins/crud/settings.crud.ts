import mdbid from "mdbid";
import {
    CmsContextType,
    CmsSettingsContextType,
    CmsSettingsType
} from "@webiny/api-headless-cms/types";
import defaults from "@webiny/api-headless-cms/plugins/crud/defaults";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import {
    createContentModelGroupPk,
    createSettingsPk
} from "@webiny/api-headless-cms/plugins/crud/partitionKeys";
import { SecurityContext } from "@webiny/api-security/types";

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
const SETTINGS_TYPE = "cms#settings";
const CONTENT_MODEL_GROUP_TYPE = "cms#cmg";

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

                // base environment
                const environment = await context.cms.environment.create(
                    initialEnvironment,
                    createdBy,
                    true
                );
                // and its alias
                const environmentAlias = await context.cms.environmentAlias.create(
                    {
                        ...initialEnvironmentAlias,
                        environment: environment.id
                    },
                    createdBy
                );
                // then add default content model group
                const contentModelGroupId = mdbid();
                await db.create({
                    ...defaults.db,
                    data: {
                        PK: createContentModelGroupPk(context),
                        SK: contentModelGroupId,
                        TYPE: CONTENT_MODEL_GROUP_TYPE,
                        ...initialContentModelGroup,
                        environment: environment.id
                    }
                });
                // mark as installed in settings
                await db.create({
                    ...defaults.db,
                    data: {
                        PK: createSettingsPk(context),
                        SK: SETTINGS_SECONDARY_KEY,
                        TYPE: SETTINGS_TYPE,
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
} as ContextPlugin<DbContext, I18NContentContext, CmsContextType, TenancyContext, SecurityContext>;
