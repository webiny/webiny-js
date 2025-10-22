import { AsyncLocalStorage } from "async_hooks";
import { createImplementation } from "@webiny/di-container";
import { AuthorizationContext as Abstraction } from "./abstractions.js";
import { Authorizer } from "~/features/authorization/shared/abstractions.js";
import type { SecurityPermission } from "~/types.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

class AuthorizationContextImpl implements Abstraction.Interface {
    private permissions?: SecurityPermission[];
    private permissionsLoader?: Promise<SecurityPermission[]>;

    constructor(private authorizers: Authorizer.Interface[]) {
        const b = 12;
    }

    async loadPermissions(): Promise<SecurityPermission[]> {
        if (this.permissions) {
            return this.permissions;
        }

        if (this.permissionsLoader) {
            return this.permissionsLoader;
        }

        this.permissionsLoader = new Promise<SecurityPermission[]>(async resolve => {
            // Execute authorizers in sequence until one returns permissions
            for (const authorizer of this.authorizers) {
                const result = await authorizer.authorize();
                if (Array.isArray(result)) {
                    this.permissions = result;
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
}

export const AuthorizationContext = createImplementation({
    abstraction: Abstraction,
    implementation: AuthorizationContextImpl,
    dependencies: [[Authorizer, { multiple: true }]]
});
