import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

// Per-request permission cache. Lambda runs one request per process,
// so the legacy instance-field cache was safe; in a long-lived host
// the singleton `AuthorizationContext` is shared across concurrent
// requests, and one request's loaded permissions would leak into
// another. The host opens a request scope at the top of every HTTP
// request via `enterAuthorizationRequestScope`; outside any scope
// the instance-field fallback is used (preserving Lambda / test
// behavior).
interface PermissionsScope {
    permissions?: SecurityPermission[];
    permissionsLoader?: Promise<SecurityPermission[]>;
}

const requestPermissionsStorage = new AsyncLocalStorage<PermissionsScope>();

export class AuthorizationContext implements Abstraction.Interface {
    private fallbackScope: PermissionsScope = {};

    constructor(
        private getAuthorizers: () => Authorizer.Interface[],
        private getTransformers: () => PermissionTransformer.Interface[]
    ) {}

    private getScope(): PermissionsScope {
        return requestPermissionsStorage.getStore() ?? this.fallbackScope;
    }

    async loadPermissions(identity: Identity): Promise<SecurityPermission[]> {
        const cache = this.getScope();
        if (cache.permissions) {
            return cache.permissions;
        }

        if (cache.permissionsLoader) {
            return cache.permissionsLoader;
        }

        cache.permissionsLoader = new Promise<SecurityPermission[]>(async resolve => {
            // Execute authorizers in sequence until one returns permissions
            const authorizers = this.getAuthorizers();
            for (const authorizer of authorizers) {
                const permissions = await authorizer.authorize(identity);
                if (Array.isArray(permissions)) {
                    cache.permissions = this.transformPermissions(permissions);
                    return resolve(cache.permissions);
                }
            }

            // No authorizer returned permissions
            cache.permissions = [];
            resolve(cache.permissions);
        });

        return cache.permissionsLoader;
    }

    isAuthorizationEnabled(): boolean {
        const override = authorizationEnabledStorage.getStore();
        return override ?? true;
    }

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(false, cb);
    }

    clearPermissionsCache(): void {
        const cache = this.getScope();
        cache.permissions = undefined;
        cache.permissionsLoader = undefined;
    }

    private transformPermissions(permissions: SecurityPermission[]) {
        const transformers = this.getTransformers();
        if (transformers.length === 0) {
            return this.deduplicatePermissions(permissions);
        }

        const transformed = permissions
            .map(permission => {
                // A transformer can return one or multiple permissions, so we flatten the result.
                return transformers.map(t => t.execute(permission)).flat();
            })
            .flat();

        return this.deduplicatePermissions(transformed);
    }

    private deduplicatePermissions(permissions: SecurityPermission[]) {
        const seen = new Set<string>();

        return permissions.filter(permission => {
            const key = JSON.stringify(permission);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

/**
 * Open a per-request permissions scope so concurrent requests
 * sharing the singleton `AuthorizationContext` don't share each
 * other's cached permissions. Long-lived hosts call this once at the
 * top of every HTTP request. Outside any scope, the singleton's
 * instance field is used (Lambda / test behavior).
 */
export const enterAuthorizationRequestScope = (): void => {
    requestPermissionsStorage.enterWith({});
};
