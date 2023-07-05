import WebinyError from "@webiny/error";
import {
    ErrorEvent,
    InstallEvent,
    Security,
    SecurityConfig,
    System as SystemRecord
} from "../types";
import { createTopic } from "@webiny/pubsub";

export const createSystemMethods = ({
    getTenant: initialGetTenant,
    storageOperations
}: SecurityConfig) => {
    const getTenant = () => {
        const tenant = initialGetTenant();
        if (!tenant) {
            throw new WebinyError("Missing tenant.");
        }
        return tenant;
    };
    const onSystemBeforeInstall = createTopic<InstallEvent>("security.onSystemBeforeInstall");
    const onSystemAfterInstall = createTopic<InstallEvent>("security.onSystemAfterInstall");

    return {
        onBeforeInstall: onSystemBeforeInstall,
        onAfterInstall: onSystemAfterInstall,
        onSystemBeforeInstall,
        onSystemAfterInstall,
        onInstall: createTopic<InstallEvent>("security.onInstall"),
        onCleanup: createTopic<ErrorEvent>("security.onCleanup"),
        async getVersion(): Promise<string | null> {
            const tenantId = initialGetTenant();

            if (!tenantId) {
                return null;
            }

            const system = await storageOperations.getSystemData({ tenant: getTenant() });

            return system ? system.version : null;
        },

        async setVersion(version: string): Promise<SystemRecord> {
            const original = await storageOperations.getSystemData({ tenant: getTenant() });

            const system: SystemRecord = {
                tenant: getTenant(),
                version,
                installedOn: new Date().toISOString()
            };

            if (original) {
                try {
                    return await storageOperations.updateSystemData({ original, system });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update existing system data.",
                        ex.code || "UPDATE_SYSTEM_ERROR",
                        { original, system }
                    );
                }
            }
            try {
                return await storageOperations.createSystemData({ system });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create the system data.",
                    ex.code || "CREATE_SYSTEM_ERROR",
                    { system }
                );
            }
        },

        async install(this: Security): Promise<void> {
            if (await this.getVersion()) {
                throw new WebinyError("Security is already installed.", "SECURITY_INSTALL_ABORTED");
            }

            const installEvent = {
                tenant: getTenant()
            };

            await this.withoutAuthorization(async () => {
                try {
                    await this.onSystemBeforeInstall.publish(installEvent);
                    await this.onInstall.publish(installEvent);
                    await this.onSystemAfterInstall.publish(installEvent);
                } catch (err) {
                    await this.onCleanup.publish({ error: err, tenant: getTenant() });

                    throw new WebinyError(err.message, "SECURITY_INSTALL_ABORTED", err.data || {});
                }
            });

            // Store app version
            await this.setVersion(process.env.WEBINY_VERSION as string);
        }
    };
};
