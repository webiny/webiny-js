import minimatch from "minimatch";
import { createAuthentication } from "@webiny/api-authentication/createAuthentication";
import { Authorizer, Security, SecurityPermission, SecurityConfig } from "./types";
import { createApiKeysMethods } from "~/createSecurity/createApiKeysMethods";
import { createGroupsMethods } from "~/createSecurity/createGroupsMethods";
import { createSystemMethods } from "~/createSecurity/createSystemMethods";
import { createTenantLinksMethods } from "~/createSecurity/createTenantLinksMethods";
import { createTopic } from "@webiny/pubsub";

export interface GetTenant {
    (): string | undefined;
}

export const createSecurity = async (config: SecurityConfig): Promise<Security> => {
    const authentication = createAuthentication();
    const authorizers: Authorizer[] = [];
    let performAuthorization = true;

    let permissions: SecurityPermission[];
    let permissionsLoader: Promise<SecurityPermission[]>;

    const loadPermissions = async (security: Security): Promise<SecurityPermission[]> => {
        if (permissions) {
            return permissions;
        }

        if (permissionsLoader) {
            return permissionsLoader;
        }

        const shouldEnableAuthorization = performAuthorization;

        permissionsLoader = new Promise<SecurityPermission[]>(async resolve => {
            // Authorizers often need to query business-related data, and since the identity is not yet
            // authorized, these operations can easily trigger a NOT_AUTHORIZED error.
            // To avoid this, we disable permission checks (assume `full-access` permissions) for
            // the duration of the authorization process.
            security.disableAuthorization();
            for (const authorizer of authorizers) {
                const result = await authorizer();
                if (Array.isArray(result)) {
                    permissions = result;
                    return resolve(permissions);
                }
            }
            // Set an empty array since no permissions were found.
            permissions = [];
            resolve(permissions);
        }).then(permissions => {
            // Re-enable authorization.
            if (shouldEnableAuthorization) {
                enableAuthorization();
            }

            return permissions;
        });

        return permissionsLoader;
    };

    const enableAuthorization = () => {
        performAuthorization = true;
    };

    const disableAuthorization = () => {
        performAuthorization = false;
    };

    return {
        ...authentication,
        onBeforeLogin: createTopic("security.onBeforeLogin"),
        onLogin: createTopic("security.onLogin"),
        onAfterLogin: createTopic("security.onAfterLogin"),
        onIdentity: createTopic("security.onIdentity"),
        enableAuthorization,
        disableAuthorization,
        getStorageOperations() {
            return config.storageOperations;
        },
        addAuthorizer(authorizer: Authorizer) {
            authorizers.push(authorizer);
        },
        getAuthorizers() {
            return authorizers;
        },
        setIdentity(this: Security, identity) {
            authentication.setIdentity(identity);
            this.onIdentity.publish({ identity });
        },
        async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
            this: Security,
            permission: string
        ): Promise<TPermission | null> {
            if (!performAuthorization) {
                return { name: "*" } as TPermission;
            }

            // We must resolve permissions first
            const perms = await this.getPermissions();

            const exactMatch = (perms || []).find(p => p.name === permission);
            if (exactMatch) {
                return exactMatch as TPermission;
            }

            // Try matching using patterns
            const matchedPermission = (perms || []).find(p => minimatch(permission, p.name));
            if (matchedPermission) {
                return matchedPermission as TPermission;
            }

            return null;
        },

        async getPermissions(this: Security): Promise<SecurityPermission[]> {
            return await loadPermissions(this);
        },

        async hasFullAccess(this: Security): Promise<boolean> {
            const permissions = (await this.getPermissions()) as SecurityPermission[];

            return permissions.some(p => p.name === "*");
        },

        // Utility to run any callback without authorization checks
        async withoutAuthorization(cb) {
            disableAuthorization();
            const result = await cb();
            enableAuthorization();
            return result;
        },

        ...createTenantLinksMethods(config),
        ...createGroupsMethods(config),
        ...createApiKeysMethods(config),
        ...createSystemMethods(config)
    };
};
