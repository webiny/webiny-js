import Error from "@webiny/error";
import { Tenancy, TenancyStorageOperations } from "~/types";

export function createSystemMethods(storageOperations: TenancyStorageOperations) {
    return {
        async getVersion() {
            const system = await storageOperations.getSystemData();
            
            return system ? system.version : null;
        },

        async setVersion(version: string) {
            const system = await storageOperations.getSystemData();

            if (system) {
                const data = {
                    ...system,
                    version
                };
                try {
                    await storageOperations.updateSystemData(data);
                    return;
                } catch (ex) {
                    throw new Error("Could not update the system data.", "SYSTEM_UPDATE_ERROR", {
                        data
                    });
                }
            }

            const data = { version };
            try {
                await storageOperations.createSystemData(data);
                return;
            } catch (ex) {
                throw new Error("Could not create the system data.", "SYSTEM_CREATE_ERROR", {
                    data
                });
            }
        },

        async isInstalled() {
            try {
                return !!(await storageOperations.getSystemData());
            } catch (ex) {
                throw new Error(
                    ex.message || "Could not load root tenant.",
                    ex.code || "TENANCY_SYSTEM_ERROR"
                );
            }
        },

        async install(this: Tenancy) {
            if (await this.isInstalled()) {
                throw new Error("Tenancy is already installed.", "TENANCY_INSTALL_ABORTED");
            }

            try {
                /**
                 * `install` will only ever be executed for the initial "root" tenant.
                 * Other tenants are created manually, using Tenant Manager application.
                 */
                await this.createTenant({ id: "root", name: "Root" });
                await this.setVersion(process.env.WEBINY_VERSION);
            } catch (err) {
                throw new Error(err.message, "TENANCY_INSTALL_ABORTED", err.data || {});
            }
        }
    };
}
