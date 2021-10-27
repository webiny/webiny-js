import Error from "@webiny/error";
import {
    System as SystemRecord,
    SecurityConfig,
    Security,
    ErrorEvent,
    InstallEvent
} from "../types";
import { createTopic } from "@webiny/pubsub";

export const createSystemMethods = ({ getTenant, storageOperations }: SecurityConfig) => {
    return {
        onBeforeInstall: createTopic<InstallEvent>("security.onBeforeInstall"),
        onInstall: createTopic<InstallEvent>("security.onInstall"),
        onAfterInstall: createTopic<InstallEvent>("security.onAfterInstall"),
        onCleanup: createTopic<ErrorEvent>("security.onCleanup"),
        async getVersion() {
            const tenantId = getTenant();

            if (!tenantId) {
                return null;
            }

            const system = await storageOperations.getSystemData({ tenant: getTenant() });

            return system ? system.version : null;
        },

        async setVersion(version: string): Promise<SystemRecord> {
            const original = await storageOperations.getSystemData({ tenant: getTenant() });

            const system: SystemRecord = { tenant: getTenant(), version };

            if (original) {
                try {
                    return await storageOperations.updateSystemData({ original, system });
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not update existing system data.",
                        ex.code || "UPDATE_SYSTEM_ERROR",
                        { original, system }
                    );
                }
            }
            try {
                return await storageOperations.createSystemData({ system });
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not create the system data.",
                    ex.code || "CREATE_SYSTEM_ERROR",
                    { system }
                );
            }
        },

        async install(this: Security) {
            if (await this.getVersion()) {
                throw new Error("Security is already installed.", "SECURITY_INSTALL_ABORTED");
            }

            const installEvent = { tenant: getTenant() };

            try {
                this.disableAuthorization();
                await this.onBeforeInstall.publish(installEvent);
                await this.onInstall.publish(installEvent);
                await this.onAfterInstall.publish(installEvent);
                this.enableAuthorization();
            } catch (err) {
                await this.onCleanup.publish({ error: err, tenant: getTenant() });

                throw new Error(err.message, "SECURITY_INSTALL_ABORTED", err.data || {});
            }

            // Store app version
            await this.setVersion(process.env.WEBINY_VERSION);
        }
    };
};
