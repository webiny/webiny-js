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

            /**
             * Prepare "settings" data
             */
            const data: Partial<Settings> = {};

            if (domain) {
                data.domain = domain;
            }

            try {
                await onBeforeInstall.publish({
                    tenant
                });

                await this.createSettings(data);

                await onAfterInstall.publish({
                    tenant
                });
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

            const upgradePlugins: UpgradePlugin[] = [];

            /**
             * There are no more registered plugins for the upgrades because each storage operations gives it's own, if some upgrade exists.
             */
            if (this.storageOperations.upgrade) {
                upgradePlugins.push(this.storageOperations.upgrade);
            }

            const installedAppVersion = await this.getSystemVersion();

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion,
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            /**
             * Store new app version
             */
            await this.setSystemVersion(version);

            return true;
        }
    };
};
