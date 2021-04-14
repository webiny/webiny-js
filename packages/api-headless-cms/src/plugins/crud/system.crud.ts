import { NotAuthorizedError } from "@webiny/api-security";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContext, CmsSystemStorageOperationsProviderPlugin } from "../../types";
import WebinyError from "@webiny/error";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

export default {
    type: "context",
    apply: async (context: CmsContext) => {
        const { security } = context;

        const pluginType = "cms-system-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsSystemStorageOperationsProviderPlugin>(
            pluginType
        );
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
        });

        context.cms = {
            ...context.cms,
            system: {
                async getVersion() {
                    if (!security.getTenant()) {
                        return null;
                    }

                    const system = await storageOperations.get();

                    // Backwards compatibility check
                    if (!system) {
                        // If settings already exist, it means this system was installed before versioning was introduced.
                        // 5.0.0-beta.4 is the last version before versioning was introduced.
                        const settings = await context.cms.settings.noAuth().get();

                        return settings ? "5.0.0-beta.4" : null;
                    }

                    return system.version;
                },
                async setVersion(version: string) {
                    const system = await storageOperations.get();
                    if (!system) {
                        await storageOperations.create({
                            version
                        });
                        return;
                    }
                    await storageOperations.update({
                        version
                    });
                },
                install: async (): Promise<void> => {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        throw new NotAuthorizedError();
                    }

                    const version = await context.cms.system.getVersion();
                    if (version) {
                        return;
                    }

                    if (storageOperations.beforeInstall) {
                        await storageOperations.beforeInstall();
                    }
                    // Add default content model group.
                    try {
                        await context.cms.groups.create(initialContentModelGroup);
                    } catch (ex) {
                        throw new WebinyError(
                            ex.message,
                            "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR",
                            {
                                group: initialContentModelGroup
                            }
                        );
                    }
                    if (storageOperations.beforeInstall) {
                        await storageOperations.beforeInstall();
                    }

                    // Set app version
                    await context.cms.system.setVersion(context.WEBINY_VERSION);
                },
                async upgrade(version) {
                    const identity = context.security.getIdentity();
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

                    // Store new app version
                    await context.cms.system.setVersion(version);

                    return true;
                }
            }
        };
    }
};
