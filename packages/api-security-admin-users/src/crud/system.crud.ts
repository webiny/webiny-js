import {
    AdminUsersContext,
    CreateUserInput,
    CrudOptions,
    Group,
    System,
    SystemStorageOperations
} from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SystemStorageOperationsProvider } from "~/plugins/SystemStorageOperationsProvider";
import WebinyError from "@webiny/error";
import { getStorageOperations } from "~/crud/storageOperations";

const createDefaultGroups = async (
    context: AdminUsersContext
): Promise<Record<"fullAccessGroup" | "anonymousGroup", Group>> => {
    let anonymousGroup: Group = null;
    let fullAccessGroup: Group = null;

    const options: CrudOptions = {
        auth: false
    };

    const groups = await context.security.groups.listGroups(options);

    groups.forEach(group => {
        if (group.slug === "full-access") {
            fullAccessGroup = group;
        }

        if (group.slug === "anonymous") {
            anonymousGroup = group;
        }
    });

    if (!fullAccessGroup) {
        fullAccessGroup = await context.security.groups.createGroup(
            {
                name: "Full Access",
                description: "Grants full access to all apps.",
                system: true,
                slug: "full-access",
                permissions: [{ name: "*" }]
            },
            options
        );
    }

    if (!anonymousGroup) {
        anonymousGroup = await context.security.groups.createGroup(
            {
                name: "Anonymous",
                description: "Permissions for anonymous users (public access).",
                system: true,
                slug: "anonymous",
                permissions: []
            },
            options
        );
    }

    return { fullAccessGroup, anonymousGroup };
};

export default new ContextPlugin<AdminUsersContext>(async context => {
    const storageOperations = await getStorageOperations<SystemStorageOperations>(
        context,
        SystemStorageOperationsProvider.type
    );

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
            const rootTenant = await context.tenancy.getRootTenant();

            if (rootTenant) {
                throw new WebinyError("Security is already installed.", "SECURITY_INSTALL_ABORTED");
            }

            // Create root tenant
            const tenant = await context.tenancy.createTenant({
                id: "root",
                name: "Root",
                parent: null
            });

            context.tenancy.setCurrentTenant(tenant);

            let fullAccessGroup;
            try {
                // Create default groups
                const { fullAccessGroup: group } = await createDefaultGroups(context);
                fullAccessGroup = group;
            } catch (ex) {
                throw new WebinyError(
                    "Could not create default groups.",
                    "CREATE_DEFAULT_GROUPS_ERROR",
                    {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    }
                );
            }

            const user: CreateUserInput = {
                ...input,
                group: fullAccessGroup.slug
            };
            try {
                // Create new user
                await context.security.users.createUser(user, { auth: false });
            } catch (ex) {
                await context.tenancy.deleteTenant("root");

                throw new WebinyError(ex.message, "SECURITY_INSTALL_ABORTED", ex.data || {});
            }

            // Store app version
            await context.security.system.setVersion(context.WEBINY_VERSION);
        }
    };
});
