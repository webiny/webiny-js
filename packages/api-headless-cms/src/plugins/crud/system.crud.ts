import crypto from "crypto";
import { NotAuthorizedError } from "@webiny/api-security";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import WebinyError from "@webiny/error";
import { InstallationPlugin } from "~/plugins/InstallationPlugin";
import { executeCallbacks } from "~/utils";
import { CmsContext, CmsSystemStorageOperationsProviderPlugin } from "~/types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

export default new ContextPlugin<CmsContext>(async context => {
    /**
     * If cms is not defined on the context, do not continue, but log it.
     */
    if (!context.cms) {
        console.log("Missing cms on context. Skipping System crud.");
        return;
    }

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

    const createReadAPIKey = () => {
        return crypto.randomBytes(Math.ceil(48 / 2)).toString("hex");
    };

    context.cms = {
        ...context.cms,
        system: {
            async getVersion() {
                if (!context.tenancy.getCurrentTenant()) {
                    return null;
                }

                const system = await storageOperations.get();

                return system ? system.version : null;
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
            getReadAPIKey: async () => {
                const system = await storageOperations.get();

                if (!system) {
                    return null;
                }

                if (!system.readAPIKey) {
                    const apiKey = createReadAPIKey();
                    await context.cms.system.setReadAPIKey(apiKey);
                    return apiKey;
                }

                return system.readAPIKey;
            },
            setReadAPIKey: async apiKey => {
                await storageOperations.update({
                    readAPIKey: apiKey
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

                const installationPlugins = context.plugins.byType<InstallationPlugin>(
                    InstallationPlugin.type
                );

                await executeCallbacks<InstallationPlugin["beforeInstall"]>(
                    installationPlugins,
                    "beforeInstall",
                    { context }
                );

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

                await executeCallbacks<InstallationPlugin["afterInstall"]>(
                    installationPlugins,
                    "afterInstall",
                    { context }
                );

                // Set app version
                await context.cms.system.setVersion(context.WEBINY_VERSION);

                // Set internal API key to access Read API
                await context.cms.system.setReadAPIKey(createReadAPIKey());
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
});
