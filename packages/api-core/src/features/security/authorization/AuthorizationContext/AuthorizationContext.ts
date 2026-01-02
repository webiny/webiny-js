import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

export class AuthorizationContext implements Abstraction.Interface {
    private permissions?: SecurityPermission[];
    private permissionsLoader?: Promise<SecurityPermission[]>;

    constructor(private getAuthorizers: () => Authorizer.Interface[]) {}

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
                const result = await authorizer.authorize(identity);
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
