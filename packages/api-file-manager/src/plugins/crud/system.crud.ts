import { NotAuthorizedError } from "@webiny/api-security";
import { FileManagerContext, FileManagerSettings, FileManagerSystem } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { executeCallbacks } from "~/utils";
import { InstallationPlugin } from "~/plugins/definitions/InstallationPlugin";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/definitions/SystemStorageOperationsProviderPlugin";

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

    const getTenantId = (): string => {
        return context.tenancy.getCurrentTenant().id;
    };

    context.fileManager.system = {
        async getVersion() {
            const system = await storageOperations.get();

            return system ? system.version : null;
        },
        async setVersion(version: string) {
            const system = await storageOperations.get();

            if (system) {
                const data: FileManagerSystem = {
                    ...system,
                    tenant: system.tenant || getTenantId(),
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

            const data: FileManagerSystem = {
                version,
                tenant: getTenantId()
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
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }
            const { fileManager } = context;
            const version = await fileManager.system.getVersion();

            if (version) {
                throw new WebinyError(
                    "File Manager is already installed.",
                    "FILES_INSTALL_ABORTED"
                );
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
                {
                    context
                }
            );

            await fileManager.settings.createSettings(data);

            await fileManager.system.setVersion(context.WEBINY_VERSION);

            await executeCallbacks<InstallationPlugin["afterInstall"]>(
                installationPlugins,
                "afterInstall",
                {
                    context
                }
            );

            return true;
        }
    };
});

systemCrudContextPlugin.name = "FileManagerSystemCrud";

export default systemCrudContextPlugin;
