import { CreateUserInput, System } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import WebinyError from "@webiny/error";

export default new ContextPlugin<AdminUsersContext>(async context => {
    context.security.system = {
        async get() {
            const rootTenant = await context.tenancy.getRootTenant();
            if (!rootTenant) {
                return null;
            }

            try {
                return await storageOperations.get();
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the system data.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getVersion() {
            const rootTenant = await context.tenancy.getRootTenant();
            if (!rootTenant) {
                return null;
            }
            const system = await context.security.system.get();

            return system ? system.version : null;
        },
        async setVersion(version: string): Promise<System> {
            const original = await context.security.system.get();

            const system: System = {
                version
            };

            if (original) {
                try {
                    return await storageOperations.update({
                        original,
                        system
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update existing system data.",
                        ex.code || "UPDATE_SYSTEM_ERROR",
                        {
                            original,
                            system
                        }
                    );
                }
            }
            try {
                return await storageOperations.create({
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create the system data.",
                    ex.code || "CREATE_SYSTEM_ERROR",
                    {
                        system
                    }
                );
            }
        },
        async install(input) {
            const user: CreateUserInput = {
                ...input,
                group: fullAccessGroup.slug
            };
            try {
                // Create new user
                await context.security.users.createUser(user, { auth: false });
            } catch (ex) {
                throw new WebinyError(ex.message, "SECURITY_INSTALL_ABORTED", ex.data || {});
            }

            // Store app version
            await context.security.system.setVersion(context.WEBINY_VERSION);
        }
    };
});
