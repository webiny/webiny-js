import { NotAuthorizedError } from "@webiny/api-security";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import Error from "@webiny/error";
import { FileManagerContext, FileManagerSettings } from "~/types";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { executeCallbacks } from "~/utils";
import { InstallationPlugin, SystemStorageOperationsProviderPlugin } from "~/plugins/definitions";

const systemCrudContextPlugin = new ContextPlugin<FileManagerContext>(async context => {
    const pluginType = SystemStorageOperationsProviderPlugin.type;
    const providerPlugin = context.plugins
        .byType<SystemStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    if (!context.fileManager) {
        context.fileManager = {} as any;
    }

    context.fileManager.system = {
        async getVersion() {
            const { fileManager } = context;
            const system = await storageOperations.get();
            // Backwards compatibility check
            if (!system) {
                // If settings exist, it means this system was installed before versioning was introduced.
                // 5.0.0-beta.4 is the last version before versioning was introduced.
                const settings = await fileManager.settings.getSettings();
                return settings ? "5.0.0-beta.4" : null;
            }

            return system.version;
        },
        async setVersion(version: string) {
            const system = await storageOperations.get();

            if (system) {
                const data = {
                    ...system,
                    version
                };
                try {
                    await storageOperations.update({
                        original: system,
                        data
                    });
                    return;
                } catch (ex) {
                    throw new WebinyError(
                        "Could not update the system data.",
                        "SYSTEM_UPDATE_ERROR",
                        {
                            data
                        }
                    );
                }
            }

            const data = {
                version
            };
            try {
                await storageOperations.create({
                    data
                });
                return;
            } catch (ex) {
                throw new WebinyError("Could not create the system data.", "SYSTEM_CREATE_ERROR", {
                    data
                });
            }
        },
        async install({ srcPrefix }) {
            const { fileManager } = context;
            const version = await fileManager.system.getVersion();

            if (version) {
                throw new Error("File Manager is already installed.", "FILES_INSTALL_ABORTED");
            }

            const data: Partial<FileManagerSettings> = {};

            if (srcPrefix) {
                data.srcPrefix = srcPrefix;
            }

            const installationPlugins = context.plugins.byType<InstallationPlugin>(
                InstallationPlugin.type
            );

            await executeCallbacks<InstallationPlugin["beforeInstall"]>(
                installationPlugins,
                "beforeInstall",
                { context }
            );

            await fileManager.settings.createSettings(data);

            await fileManager.system.setVersion(context.WEBINY_VERSION);

            await executeCallbacks<InstallationPlugin["afterInstall"]>(
                installationPlugins,
                "afterInstall",
                { context }
            );

            return true;
        },
        async upgrade(version) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "file-manager");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await this.getVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await context.fileManager.system.setVersion(version);

            return true;
        }
    };
});

systemCrudContextPlugin.name = "FileManagerSystemCrud";

export default systemCrudContextPlugin;
