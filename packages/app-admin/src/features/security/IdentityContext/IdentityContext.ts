import minimatch from "minimatch";
import { IdentityContext as Abstraction } from "./abstractions.js";
import { makeAutoObservable } from "mobx";

class IdentityContextImpl implements Abstraction.Interface {
    private identity: Abstraction.Identity | undefined = undefined;

    constructor() {
        makeAutoObservable(this, {
            getIdentity: true,
            setIdentity: true
        });
    }

    getIdentity(): Abstraction.Identity | undefined {
        return this.identity;
    }

    setIdentity(identity: Abstraction.Identity | undefined): void {
        this.identity = identity;
    }

    getPermission<T extends Abstraction.Permission = Abstraction.Permission>(
        name: string,
        exact?: boolean
    ): T | null {
        if (!this.identity) {
            return null;
        }

        const perms = (this.identity.permissions || []) as T[];
        const exactMatch = perms.find(p => p.name === name);
        if (exactMatch) {
            return exactMatch as T;
        } else if (exact) {
            return null;
        }

        // Try matching using patterns
        return perms.find(p => minimatch(name, p.name)) || null;
    }

    getPermissions<T extends Abstraction.Permission = Abstraction.Permission>(name: string): T[] {
        if (!this.identity) {
            return [];
        }

        const permissions = this.identity.permissions || [];

        return permissions.filter(current => {
            const exactMatch = current.name === name;
            if (exactMatch) {
                return true;
            }

            // Try matching using patterns.
            return minimatch(name, current.name);
        }) as T[];
    }
}

export const IdentityContext = Abstraction.createImplementation({
    implementation: IdentityContextImpl,
    dependencies: []
});
