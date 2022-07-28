import crypto from "crypto";
import { NotAuthorizedError } from "@webiny/api-security";
import { ErrorCode, getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import WebinyError from "@webiny/error";
import {
    AfterInstallTopicParams,
    BeforeInstallTopicParams,
    CmsContext,
    CmsSystem,
    CmsSystemContext,
    HeadlessCms,
    HeadlessCmsStorageOperations
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { I18NLocale } from "@webiny/api-i18n/types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

interface CreateSystemCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}
export const createSystemCrud = (params: CreateSystemCrudParams): CmsSystemContext => {
    const { getTenant, getLocale, storageOperations, context, getIdentity } = params;

    const onBeforeInstall = createTopic<BeforeInstallTopicParams>();
    const onAfterInstall = createTopic<AfterInstallTopicParams>();

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

        return system ? system.version || null : null;
    };

    const setVersion = async (version: string) => {
        const original = await storageOperations.system.get({
            tenant: getTenant().id
        });
        const system: CmsSystem = {
            ...(original || {}),
            version,
            tenant: getTenant().id
        };
        if (!original) {
            await storageOperations.system.create({
                system
            });
            return;
        }
        await storageOperations.system.update({
            system
        });
    };

    return {
        onBeforeSystemInstall: onBeforeInstall,
        onAfterSystemInstall: onAfterInstall,
        getSystemVersion: getVersion,
        setSystemVersion: setVersion,
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
                    system
                });
                return readAPIKey;
            }

            return original.readAPIKey;
        },
        installSystem: async (): Promise<void> => {
            const identity = getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const version = await getVersion();
            if (version) {
                return;
            }
            /**
             * First trigger before install event.
             */
            await onBeforeInstall.publish({
                tenant: getTenant().id,
                locale: getLocale().code
            });

            /**
             * Add default content model group.
             */
            try {
                await context.cms.createGroup(initialContentModelGroup);
            } catch (ex) {
                throw new WebinyError(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR", {
                    group: initialContentModelGroup
                });
            }

            const system: CmsSystem = {
                version: context.WEBINY_VERSION,
                readAPIKey: createReadAPIKey(),
                tenant: getTenant().id
            };
            /**
             * We need to create the system data.
             */
            await storageOperations.system.create({
                system
            });
            /**
             * And trigger after install event.
             */
            await onAfterInstall.publish({
                tenant: getTenant().id,
                locale: getLocale().code
            });
        },
        async upgradeSystem(this: HeadlessCms, version) {
            const identity = getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "headless-cms");

            const installedAppVersion = await this.getSystemVersion();

            let plugin: UpgradePlugin | undefined = undefined;
            try {
                plugin = getApplicablePlugin({
                    deployedVersion: context.WEBINY_VERSION,
                    installedAppVersion,
                    upgradePlugins,
                    upgradeToVersion: version
                });
            } catch (ex) {
                /**
                 * We just let the error disappear if is UPGRADE_NOT_AVAILABLE code
                 * and rethrow if is not.
                 * This is because we want upgrade to pass if there is no plugin available.
                 */
                if (ex.code !== ErrorCode.UPGRADE_NOT_AVAILABLE) {
                    throw ex;
                }
            }

            if (plugin) {
                await plugin.apply(context);
            }

            /**
             * Store new app version.
             */
            await setVersion(version);

            return true;
        }
    };
};
