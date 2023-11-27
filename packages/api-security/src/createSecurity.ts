import { AsyncLocalStorage } from "async_hooks";
import minimatch from "minimatch";
import { createAuthentication } from "@webiny/api-authentication/createAuthentication";
import { Authorizer, Security, SecurityPermission, SecurityConfig } from "./types";
import { createApiKeysMethods } from "~/createSecurity/createApiKeysMethods";
import { createGroupsMethods } from "~/createSecurity/createGroupsMethods";
import { createTeamsMethods } from "~/createSecurity/createTeamsMethods";
import { createSystemMethods } from "~/createSecurity/createSystemMethods";
import { createTenantLinksMethods } from "~/createSecurity/createTenantLinksMethods";
import { filterOutCustomWbyAppsPermissions } from "~/createSecurity/filterOutCustomWbyAppsPermissions";
import { createTopic } from "@webiny/pubsub";
import { AaclPermission } from "@webiny/api-wcp/types";

export interface GetTenant {
    (): string | undefined;
}

const asyncLocalStorage = new AsyncLocalStorage<boolean>();

export const createSecurity = async (config: SecurityConfig): Promise<Security> => {
    const authentication = createAuthentication();
    const authorizers: Authorizer[] = [];

    let permissions: SecurityPermission[];
    let permissionsLoader: Promise<SecurityPermission[]>;

    const loadPermissions = async (): Promise<SecurityPermission[]> => {
        if (permissions) {
            return permissions;
        }

        if (permissionsLoader) {
            return permissionsLoader;
        }

        permissionsLoader = new Promise<SecurityPermission[]>(async resolve => {
            // Authorizers often need to query business-related data, and since the identity is not yet
            // authorized, these operations can easily trigger a NOT_AUTHORIZED error.
            // To avoid this, we disable permission checks (assume `full-access` permissions) for
            // the duration of the authorization process.
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
        });

        return permissionsLoader;
    };

    return {
        ...authentication,
        config,
        onBeforeLogin: createTopic("security.onBeforeLogin"),
        onLogin: createTopic("security.onLogin"),
        onAfterLogin: createTopic("security.onAfterLogin"),
        onIdentity: createTopic("security.onIdentity"),
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
        isAuthorizationEnabled: () => {
            return asyncLocalStorage.getStore() ?? true;
        },
        async withoutAuthorization<T = any>(this: Security, cb: () => Promise<T>): Promise<T> {
            return await asyncLocalStorage.run(false, cb);
        },
        async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
            this: Security,
            permission: string
        ): Promise<TPermission | null> {
            if (!this.isAuthorizationEnabled()) {
                return { name: "*" } as TPermission;
            }

            // We must resolve permissions first
            const perms = await this.listPermissions();

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

        async getPermissions<TPermission extends SecurityPermission = SecurityPermission>(
            this: Security,
            permission: string
        ): Promise<TPermission[]> {
            if (!this.isAuthorizationEnabled()) {
                return [{ name: "*" }] as TPermission[];
            }

            const permissions = await this.listPermissions();
            return permissions.filter(current => {
                const exactMatch = current.name === permission;
                if (exactMatch) {
                    return true;
                }

                // Try matching using patterns.
                return minimatch(permission, current.name);
            }) as TPermission[];
        },

        async listPermissions(this: Security): Promise<SecurityPermission[]> {
            const permissions = await this.withoutAuthorization(() => loadPermissions());

            // Now we start checking whether we want to return all permissions, or we
            // need to omit the custom ones because of the one of the following reasons.

            let aaclEnabled: boolean | "legacy" =
                config.advancedAccessControlLayer?.enabled === true;
            let teamsEnabled = false;
            if (aaclEnabled) {
                teamsEnabled = config.advancedAccessControlLayer?.options?.teams === true;
            }

            if (!aaclEnabled) {
                // Are we dealing with an old Webiny project?
                // Older versions of Webiny do not have the `installedOn` value stored. So,
                // if missing, we don't want to make any changes to the existing behavior.
                const securitySystemRecord = await this.getStorageOperations().getSystemData({
                    tenant: "root"
                });

                // If `installedOn` value exists, we know we're not dealing with
                // legacy security system. It's the new AACL one.
                const isWcpAacl = securitySystemRecord?.installedOn;
                const isLegacyAacl = !isWcpAacl;

                if (isLegacyAacl) {
                    aaclEnabled = "legacy";
                }
            }

            // If Advanced Access Control Layer (AACL) can be used or if we are
            // dealing with an old Webiny project, we don't need to do anything.
            if (aaclEnabled === true || aaclEnabled === "legacy") {
                // Pushing the value of `aacl` can help us in making similar checks on the frontend side.
                permissions.push({
                    name: "aacl",
                    legacy: aaclEnabled === "legacy",
                    teams: teamsEnabled
                } as AaclPermission);

                return permissions;
            }

            // If Advanced Access Control Layer (AACL) cannot be used,
            // we omit all the Webiny apps-related custom permissions.
            return filterOutCustomWbyAppsPermissions(permissions);
        },

        async hasFullAccess(this: Security): Promise<boolean> {
            const permissions = (await this.listPermissions()) as SecurityPermission[];

            return permissions.some(p => p.name === "*");
        },
        ...createTenantLinksMethods(config),
        ...createGroupsMethods(config),
        ...createTeamsMethods(config),
        ...createApiKeysMethods(config),
        ...createSystemMethods(config)
    };
};
