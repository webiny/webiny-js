import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

export class AuthorizationContext implements Abstraction.Interface {
    private permissions?: SecurityPermission[];
    private permissionsLoader?: Promise<SecurityPermission[]>;

    constructor(
        private getAuthorizers: () => Authorizer.Interface[],
        private getTransformers: () => PermissionTransformer.Interface[]
    ) {}

    async loadPermissions(identity: Identity): Promise<SecurityPermission[]> {
        if (this.permissions) {
            return this.permissions;
        }

        if (this.permissionsLoader) {
            return this.permissionsLoader;
        }

        this.permissionsLoader = new Promise<SecurityPermission[]>(async resolve => {
            // Execute authorizers in sequence until one returns permissions
            const authorizers = this.getAuthorizers();
            for (const authorizer of authorizers) {
                const permissions = await authorizer.authorize(identity);
                if (Array.isArray(permissions)) {
                    this.permissions = this.transformPermissions(permissions);
                    return resolve(this.permissions);
                }
            }

            // No authorizer returned permissions
            this.permissions = [];
            resolve(this.permissions);
        });

        return this.permissionsLoader;
    }

    isAuthorizationEnabled(): boolean {
        const override = authorizationEnabledStorage.getStore();
        return override ?? true;
    }

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(false, cb);
    }

    clearPermissionsCache(): void {
        this.permissions = undefined;
        this.permissionsLoader = undefined;
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
