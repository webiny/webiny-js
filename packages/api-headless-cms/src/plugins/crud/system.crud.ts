import crypto from "crypto";
import { NotAuthorizedError } from "@webiny/api-security";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import WebinyError from "@webiny/error";
import { InstallationPlugin } from "~/plugins/InstallationPlugin";
import { executeCallbacks } from "~/utils";
import {
    AfterInstallTopic,
    BeforeInstallTopic,
    CmsContext,
    CmsSystem,
    CmsSystemContext,
    HeadlessCmsStorageOperations
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

export interface Params {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}
export const createSystemCrud = (params: Params): CmsSystemContext => {
    const { getTenant, getLocale, storageOperations, context, getIdentity } = params;

    const onBeforeInstall = createTopic<BeforeInstallTopic>();
    const onAfterInstall = createTopic<AfterInstallTopic>();

    const createReadAPIKey = () => {
        return crypto.randomBytes(Math.ceil(48 / 2)).toString("hex");
    };

    const getVersion = async () => {
        if (!getTenant()) {
            return null;
        }

        const system = await storageOperations.system.get({
            tenant: getTenant().id
        });

        return system ? system.version : null;
    };

    const setVersion = async (version: string) => {
        const original = await storageOperations.system.get({
            tenant: getTenant().id
        });
        const system: CmsSystem = {
            ...(original || {}),
            version,
            locale: getLocale().code,
            tenant: getTenant().id
        };
        if (!original) {
            await storageOperations.system.create({
                system
            });
            return;
        }
        await storageOperations.system.update({
            original,
            system
        });
    };

    return {
        onBeforeInstall,
        onAfterInstall,
        getVersion,
        setVersion,
        getReadAPIKey: async () => {
            const original = await storageOperations.system.get({
                tenant: getTenant().id
            });

            if (!original) {
                return null;
            }

            if (!original.readAPIKey) {
                const readAPIKey = createReadAPIKey();
                const system: CmsSystem = {
                    ...original,
                    readAPIKey
                };
                await storageOperations.system.update({
                    original,
                    system
                });
                return readAPIKey;
            }

            return original.readAPIKey;
        },
        install: async (): Promise<void> => {
            const identity = getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const version = await getVersion();
            if (version) {
                return;
            }

            const installationPlugins = context.plugins.byType<InstallationPlugin>(
                InstallationPlugin.type
            );

            await executeCallbacks<InstallationPlugin["beforeInstall"]>(
                installationPlugins,
                "beforeInstall",
                {
                    context: context
                }
            );

            /**
             * Add default content model group.
             */
            try {
                await context.cms.groups.create(initialContentModelGroup);
            } catch (ex) {
                throw new WebinyError(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR", {
                    group: initialContentModelGroup
                });
            }

            await executeCallbacks<InstallationPlugin["afterInstall"]>(
                installationPlugins,
                "afterInstall",
                {
                    context: context
                }
            );

            const system: CmsSystem = {
                version,
                readAPIKey: createReadAPIKey(),
                locale: getLocale().code,
                tenant: getTenant().id
            };
            /**
             * We need to create the system data.
             */
            await storageOperations.system.create({
                system
            });
        },
        async upgrade(version) {
            const identity = getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "headless-cms");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await this.getVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            /**
             * Store new app version.
             */
            await setVersion(version);

            return true;
        }
    };
};
