import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

/** Tenant key used when no tenant is set yet (before the tenant is resolved). */
const NO_TENANT = "";

type PermissionsByTenant = Map<string, Promise<SecurityPermission[]>>;

/**
 * Loads and caches permissions per identity object and tenant for the lifetime of the request.
 * `IdentityContext.withIdentity` can switch the identity mid-request and `TenantContext` the
 * tenant, so permissions loaded for one identity or tenant never answer for another. Keying by the
 * object (not by id or a fingerprint) means two identities with the same id but a different
 * context never share an entry (R69). A failed load is evicted, so the next check retries.
 */
export class AuthorizationContext implements Abstraction.Interface {
    private permissionsByIdentity = new WeakMap<Identity, PermissionsByTenant>();

    constructor(
        private getAuthorizers: () => Authorizer.Interface[],
        private getTransformers: () => PermissionTransformer.Interface[],
        private getTenantId: () => string | null
    ) {}

    loadPermissions(identity: Identity): Promise<SecurityPermission[]> {
        let byTenant = this.permissionsByIdentity.get(identity);
        if (!byTenant) {
            byTenant = new Map();
            this.permissionsByIdentity.set(identity, byTenant);
        }

        const tenantKey = this.getTenantId() ?? NO_TENANT;
        const cached = byTenant.get(tenantKey);
        if (cached) {
            return cached;
        }

        const loader = this.authorize(identity);
        byTenant.set(tenantKey, loader);
        const cache = byTenant;
        loader.catch(() => {
            if (cache.get(tenantKey) === loader) {
                cache.delete(tenantKey);
            }
        });
        return loader;
    }

    isAuthorizationEnabled(): boolean {
        const override = authorizationEnabledStorage.getStore();
        return override ?? true;
    }

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(false, cb);
    }

    withAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(true, cb);
    }

    clearPermissionsCache(): void {
        this.permissionsByIdentity = new WeakMap();
    }

    private async authorize(identity: Identity): Promise<SecurityPermission[]> {
        // Execute authorizers in sequence until one returns permissions
        const authorizers = this.getAuthorizers();
        for (const authorizer of authorizers) {
            const permissions = await authorizer.authorize(identity);
            if (Array.isArray(permissions)) {
                return this.transformPermissions(permissions);
            }
        }

        // No authorizer returned permissions
        return [];
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
