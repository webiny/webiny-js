import WebinyError from "@webiny/error";
import { Tenancy, TenancyStorageOperations } from "~/types";

interface CreateSystemMethodsParams {
    storageOperations: TenancyStorageOperations;
}

export function createSystemMethods({ storageOperations }: CreateSystemMethodsParams) {
    return {
        async getVersion(this: Tenancy): Promise<string | null> {
            const system = await storageOperations.getSystemData();

            // BC check
            if (!system) {
                const rootTenant = await this.getTenantById("root");
                if (rootTenant) {
                    await this.setVersion(process.env.WEBINY_VERSION as string);
                    return process.env.WEBINY_VERSION as string;
                }
                return null;
            }

            return system?.version || null;
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
                } catch {
                    throw new WebinyError(
                        "Could not update the system data.",
                        "SYSTEM_UPDATE_ERROR",
                        {
                            data
                        }
                    );
                }
            }

            const data = { version };
            try {
                await storageOperations.createSystemData(data);
                return;
            } catch {
                throw new WebinyError("Could not create the system data.", "SYSTEM_CREATE_ERROR", {
                    data
                });
            }
        },

        async install(this: Tenancy) {
            if (await this.getVersion()) {
                throw new WebinyError("Tenancy is already installed.", "TENANCY_INSTALL_ABORTED");
            }

            try {
                /**
                 * `install` will only ever be executed for the initial "root" tenant.
                 * Other tenants are created using the Tenant Manager application or programmatically.
                 */
                await this.createTenant({
                    id: "root",
                    name: "Root",
                    tags: [],
                    description: "The top-level Webiny tenant.",
                    parent: ""
                });
                await this.setVersion(process.env.WEBINY_VERSION as string);
            } catch (err) {
                throw new WebinyError(err.message, "TENANCY_INSTALL_ABORTED", err.data || {});
            }
        }
    };
}
