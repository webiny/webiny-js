import Error from "@webiny/error";
import { Tenancy } from "~/Tenancy";
import { SystemStorageOperations, SystemStorageOperationsFactory } from "~/types";

export class System {
    protected tenancy: Tenancy;
    protected storage: SystemStorageOperations;

    constructor(security: Tenancy) {
        this.tenancy = security;
    }

    setStorageOperations(factory: SystemStorageOperationsFactory) {
        this.storage = factory({ plugins: this.tenancy.getPlugins() });
    }

    async getVersion() {
        const system = await this.storage.get();

        return system ? system.version : null;
    }

    async setVersion(version: string) {
        const system = await this.storage.get();

        if (system) {
            const data = {
                ...system,
                version
            };
            try {
                await this.storage.update(data);
                return;
            } catch (ex) {
                throw new Error("Could not update the system data.", "SYSTEM_UPDATE_ERROR", {
                    data
                });
            }
        }

        const data = { version };
        try {
            await this.storage.create(data);
            return;
        } catch (ex) {
            throw new Error("Could not create the system data.", "SYSTEM_CREATE_ERROR", {
                data
            });
        }
    }

    async isInstalled() {
        try {
            return !!(await this.storage.get());
        } catch (ex) {
            throw new Error(
                ex.message || "Could not load root tenant.",
                ex.code || "TENANCY_SYSTEM_ERROR"
            );
        }
    }

    async install() {
        if (await this.isInstalled()) {
            throw new Error("Tenancy is already installed.", "TENANCY_INSTALL_ABORTED");
        }

        try {
            /**
             * `install` will only ever be executed for the initial "root" tenant.
             * Other tenants are created manually, using Tenant Manager application.
             */
            await this.tenancy.tenants.createTenant({ id: "root", name: "Root" });
            await this.setVersion(this.tenancy.getVersion());
        } catch (err) {
            throw new Error(err.message, "TENANCY_INSTALL_ABORTED", err.data || {});
        }
    }
}
