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
import { AACL_RELEASE_DATE } from "@webiny/api-wcp";
import { WcpPermission } from "@webiny/api-wcp/types";

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
                security.enableAuthorization();
            }

            return permissions;
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
        enableAuthorization() {
            performAuthorization = true;
        },
        disableAuthorization() {
            performAuthorization = false;
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
        async withoutAuthorization<T = any>(cb: () => Promise<T>): Promise<T> {
            const isAuthorizationEnabled = performAuthorization;
            performAuthorization = false;
            try {
                return await cb();
            } finally {
                if (isAuthorizationEnabled) {
                    performAuthorization = true;
                }
            }
        },
        async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
            this: Security,
            permission: string
        ): Promise<TPermission | null> {
            if (!performAuthorization) {
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
            if (!performAuthorization) {
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
            const permissions = await loadPermissions(this);

            // Now we start checking whether we want to return all permissions, or we
            // need to omit the custom ones because of the one of the following reasons.

            let aaclEnabled: WcpPermission["aacl"] =
                config.advancedAccessControlLayer?.enabled === true;

            if (!aaclEnabled) {
                // Are we dealing with an old Webiny project?
                // Older versions of Webiny do not have the `installedOn` value stored. So,
                // if missing, we don't want to make any changes to the existing behavior.
                const securitySystemRecord = await this.getStorageOperations().getSystemData({
                    tenant: "root"
                });
                const securityInstalledOn = securitySystemRecord?.installedOn;
                const isWcpAdvancedAccessControlLayer =
                    securityInstalledOn && securityInstalledOn >= AACL_RELEASE_DATE;

                if (!isWcpAdvancedAccessControlLayer) {
                    aaclEnabled = null;
                }
            }

            // If Advanced Access Control Layer (AACL) can be used or if we are
            // dealing with an old Webiny project, we don't need to do anything.
            if (aaclEnabled || aaclEnabled === null) {
                // Pushing the value of `aacl` can help us in making similar checks on the frontend side.
                permissions.push({
                    name: "aacl",
                    legacy: aaclEnabled === null,
                    teams: !!config.advancedAccessControlLayer?.teams
                });

                return permissions;
            }

            // If Advanced Access Control Layer (AACL) cannot be used,
            // we omit all of the Webiny apps-related custom permissions.
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
