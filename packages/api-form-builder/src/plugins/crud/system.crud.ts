import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import {
    FormBuilderContext,
    FormBuilderStorageOperationsGetSystemParams,
    Settings,
    System
} from "~/types";
import { executeCallbacks } from "~/plugins/crud/utils";
import { FormBuilderSystemPlugin } from "~/plugins/definitions/FormBuilderSystemPlugin";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export default new ContextPlugin<FormBuilderContext>(async context => {
    /**
     * If formsBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.formBuilder) {
        console.log("Missing formBuilder on context. Skipping Forms crud.");
        return;
    }

    const tenant = context.tenancy.getCurrentTenant();

    const storageOperations = context.formBuilder.storageOperations;

    const getSystem = async (params: FormBuilderStorageOperationsGetSystemParams) => {
        try {
            return await storageOperations.getSystem(params);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load system.",
                ex.code || "GET_SYSTEM_ERROR"
            );
        }
    };

    context.formBuilder.system = {
        async getVersion() {
            const system = await getSystem({
                tenant: tenant.id
            });
            return system ? system.version : null;
        },
        async setVersion(version: string) {
            const original = await getSystem({
                tenant: tenant.id
            });
            const system: System = {
                version,
                tenant: tenant.id
            };
            if (!original) {
                try {
                    await storageOperations.createSystem({
                        system
                    });
                    return;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create system.",
                        ex.code || "CREATE_SYSTEM_ERROR",
                        {
                            system
                        }
                    );
                }
            }

            try {
                await storageOperations.updateSystem({
                    original,
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update system.",
                    ex.code || "UPDATE_SYSTEM_ERROR",
                    {
                        system,
                        original
                    }
                );
            }
        },
        async install({ domain }) {
            const version = await context.formBuilder.system.getVersion();
            if (version) {
                throw new WebinyError(
                    "Form builder is already installed.",
                    "FORM_BUILDER_INSTALL_ABORTED"
                );
            }

            // Prepare "settings" data
            const data: Partial<Settings> = {};

            if (domain) {
                data.domain = domain;
            }

            const systemPlugins = context.plugins.byType<FormBuilderSystemPlugin>(
                FormBuilderSystemPlugin.type
            );

            // Create ES index if it doesn't already exist.
            try {
                await executeCallbacks<FormBuilderSystemPlugin["beforeInstall"]>(
                    systemPlugins,
                    "beforeInstall",
                    {
                        settings: data,
                        tenant
                    }
                );
                const settings = await context.formBuilder.settings.createSettings(data);
                await executeCallbacks<FormBuilderSystemPlugin["afterInstall"]>(
                    systemPlugins,
                    "afterInstall",
                    {
                        settings,
                        tenant
                    }
                );
                await context.formBuilder.system.setVersion(context.WEBINY_VERSION);
            } catch (err) {
                await context.formBuilder.settings.deleteSettings();

                throw new WebinyError(
                    "Form builder failed to install!",
                    "FORM_BUILDER_INSTALL_ABORTED",
                    {
                        reason: err.message
                    }
                );
            }
        },
        async upgrade(version) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "form-builder");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await context.formBuilder.system.getVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await context.formBuilder.system.setVersion(version);

            return true;
        }
    };
});
