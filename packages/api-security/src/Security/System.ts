import Error from "@webiny/error";
import { Security } from "../Security";
import {
    SystemStorageOperations,
    System as SystemRecord,
    Installable,
    SystemStorageOperationsFactory
} from "../types";

export class System {
    private security: Security;
    private storage: SystemStorageOperations;
    private installers: Installable[] = [];

    constructor(security: Security) {
        this.security = security;
    }

    setStorageOperations(storageFactory: SystemStorageOperationsFactory) {
        this.storage = storageFactory({
            tenant: this.security.getTenant(),
            plugins: this.security.getPlugins()
        });
    }

    addInstaller(installer: Installable) {
        this.installers.push(installer);
    }

    async get() {
        try {
            return await this.storage.get();
        } catch (ex) {
            throw new Error(
                ex.message || "Could not load the system data.",
                ex.code || "GET_SYSTEM_ERROR"
            );
        }
    }

    async getVersion() {
        const system = await this.storage.get();

        return system ? system.version : null;
    }

    async setVersion(version: string): Promise<SystemRecord> {
        const original = await this.storage.get();

        const system: SystemRecord = { version };

        if (original) {
            try {
                return await this.storage.update({ original, system });
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not update existing system data.",
                    ex.code || "UPDATE_SYSTEM_ERROR",
                    { original, system }
                );
            }
        }
        try {
            return await this.storage.create({ system });
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create the system data.",
                ex.code || "CREATE_SYSTEM_ERROR",
                { system }
            );
        }
    }

    async install() {
        const params = { security: this.security };

        try {
            for (const installer of this.installers) {
                if (typeof installer.beforeInstall === "function") {
                    await installer.beforeInstall(params);
                }
            }
            for (const installer of this.installers) {
                if (typeof installer.install === "function") {
                    await installer.install(params);
                }
            }
            for (const installer of this.installers) {
                if (typeof installer.afterInstall === "function") {
                    await installer.afterInstall(params);
                }
            }
        } catch (err) {
            for (const installer of this.installers) {
                if (typeof installer.cleanup === "function") {
                    await installer.cleanup(params);
                }
            }

            throw new Error(err.message, "SECURITY_INSTALL_ABORTED", err.data || {});
        }

        // Store app version
        await this.setVersion(this.security.version);
    }
}
