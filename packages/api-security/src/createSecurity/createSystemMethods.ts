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
        onBeforeInstall: createTopic<InstallEvent>("security.beforeInstall"),
        onInstall: createTopic<InstallEvent>("security.install"),
        onAfterInstall: createTopic<InstallEvent>("security.afterInstall"),
        onCleanup: createTopic<ErrorEvent>("security.cleanup"),
        async get() {
            try {
                return await storageOperations.getSystemData({ tenant: getTenant() });
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not load the system data.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },

        async getVersion() {
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

        async isInstalled() {
            try {
                return !!(await storageOperations.getSystemData({ tenant: getTenant() }));
            } catch (ex) {
                return false;
            }
        },

        async install(this: Security) {
            if (await this.isInstalled()) {
                throw new Error("Security is already installed.", "SECURITY_INSTALL_ABORTED");
            }

            const installEvent = { tenant: getTenant() };

            try {
                await this.onBeforeInstall.publish(installEvent);
                await this.onInstall.publish(installEvent);
                await this.onAfterInstall.publish(installEvent);
            } catch (err) {
                await this.onCleanup.publish({ error: err, tenant: getTenant() });

                throw new Error(err.message, "SECURITY_INSTALL_ABORTED", err.data || {});
            }

            // Store app version
            await this.setVersion(process.env.WEBINY_VERSION);
        }
    };
};
