import { AsyncLocalStorage } from "async_hooks";
import minimatch from "minimatch";
import { createTopic } from "@webiny/pubsub";
import type { Identity } from "@webiny/api-authentication/types.js";
import { createAuthentication } from "@webiny/api-authentication/createAuthentication.js";
import type {
    Authorizer,
    Security,
    SecurityPermission,
    SecurityConfig,
    AuthenticationToken
} from "./types.js";
import { createApiKeysMethods } from "~/createSecurity/createApiKeysMethods.js";
import { createGroupsMethods } from "~/createSecurity/createGroupsMethods.js";
import { createTeamsMethods } from "~/createSecurity/createTeamsMethods.js";
import { createTenantLinksMethods } from "~/createSecurity/createTenantLinksMethods.js";

export interface GetTenant {
    (): string | undefined;
}

const authorizationLocalStorage = new AsyncLocalStorage<boolean>();
const identityLocalStorage = new AsyncLocalStorage<Identity | undefined>();

export const createSecurity = async (config: SecurityConfig): Promise<Security> => {
    const authentication = createAuthentication();
    const authorizers: Authorizer[] = [];

    let authenticationToken: AuthenticationToken | undefined;
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
        // config,
        async authenticate(this: Security, token: string): Promise<void> {
            await authentication.authenticate(token);
            if (authentication.getIdentity()) {
                authenticationToken = token;
            }
            await this.withoutAuthorization(() => loadPermissions());
        },
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
        getIdentity<TIdentity extends Identity = Identity>(): TIdentity {
            const localIdentity = identityLocalStorage.getStore();

            if (localIdentity) {
                return localIdentity as TIdentity;
            }

            return authentication.getIdentity();
        },
        setIdentity(this: Security, identity) {
            authentication.setIdentity(identity);
            this.onIdentity.publish({ identity });
        },
        isAuthorizationEnabled: () => {
            return authorizationLocalStorage.getStore() ?? true;
        },
        getToken(): AuthenticationToken | undefined {
            return authenticationToken;
        },
        withoutAuthorization<T = any>(this: Security, cb: () => Promise<T>): Promise<T> {
            return authorizationLocalStorage.run(false, cb);
        },
        withIdentity<T = any>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T> {
            return identityLocalStorage.run(identity, cb);
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

        // @ts-expect-error
        async listPermissions(this: Security): Promise<SecurityPermission[]> {
            // No longer used
        },

        async hasFullAccess(this: Security): Promise<boolean> {
            const permissions = (await this.listPermissions()) as SecurityPermission[];

            return permissions.some(p => p.name === "*");
        },
        ...createTenantLinksMethods(config),
        ...createGroupsMethods(config),
        ...createTeamsMethods(config),
        ...createApiKeysMethods(config)
    };
};
