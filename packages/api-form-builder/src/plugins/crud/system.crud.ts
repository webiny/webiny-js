import WebinyError from "@webiny/error";
import { NotAuthorizedError, SecurityIdentity } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import {
    AfterInstallTopic,
    BeforeInstallTopic,
    FormBuilder,
    FormBuilderContext,
    Settings,
    System,
    SystemCRUD
} from "~/types";
import { executeCallbacks } from "~/plugins/crud/utils";
import { FormBuilderSystemPlugin } from "~/plugins/definitions/FormBuilderSystemPlugin";
import { Tenant } from "@webiny/api-tenancy/types";
import { createTopic } from "@webiny/pubsub";

export interface Params {
    identity: SecurityIdentity;
    tenant: Tenant;
    context: FormBuilderContext;
}

export const createSystemCrud = (params: Params): SystemCRUD => {
    const { tenant, identity, context } = params;

    const onBeforeInstall = createTopic<BeforeInstallTopic>();
    const onAfterInstall = createTopic<AfterInstallTopic>();

    return {
        onBeforeInstall,
        onAfterInstall,
        async getSystem(this: FormBuilder) {
            try {
                return await this.storageOperations.getSystem({
                    tenant: tenant.id
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load system.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getSystemVersion(this: FormBuilder) {
            const system = await this.getSystem();
            return system ? system.version : null;
        },
        async setSystemVersion(this: FormBuilder, version: string) {
            const original = await this.getSystem();
            const system: System = {
                version,
                tenant: tenant.id
            };
            if (!original) {
                try {
                    await this.storageOperations.createSystem({
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
                await this.storageOperations.updateSystem({
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
        async installSystem(this: FormBuilder, { domain }) {
            const version = await this.getSystemVersion();
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
                const settings = await this.createSettings(data);
                await executeCallbacks<FormBuilderSystemPlugin["afterInstall"]>(
                    systemPlugins,
                    "afterInstall",
                    {
                        settings,
                        tenant
                    }
                );
                await this.setSystemVersion(context.WEBINY_VERSION);
            } catch (err) {
                await this.deleteSettings();

                throw new WebinyError(
                    "Form builder failed to install!",
                    "FORM_BUILDER_INSTALL_ABORTED",
                    {
                        reason: err.message
                    }
                );
            }
        },
        async upgradeSystem(this: FormBuilder, version: string) {
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "form-builder");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await this.getSystemVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await this.setSystemVersion(version);

            return true;
        }
    };
};
