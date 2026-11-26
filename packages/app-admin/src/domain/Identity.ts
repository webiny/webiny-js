import { makeAutoObservable, runInAction } from "mobx";
import { minimatch } from "minimatch";
import type { Tenant } from "~/features/tenancy/abstractions.js";
import { ROOT_TENANT_ID } from "~/features/tenancy/rootTenant.js";

export interface IPermission {
    name: string;
    [key: string]: any;
}

export interface IRole {
    id: string;
    slug: string;
    name: string;
}

export interface ITeam {
    id: string;
    slug: string;
    name: string;
}

export interface IProfile {
    external: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: {
        src?: string;
    };
}

export interface IdentityData {
    id: string;
    type: string;
    displayName: string;
    roles: IRole[];
    teams: ITeam[];
    permissions: Identity.Permission[];
    profile: Identity.Profile;
    currentTenant: Tenant;
    defaultTenant: Tenant;
    /** The enabled tenants in which the identity has a user record, sorted by name. */
    tenants?: Tenant[];
}

const anonymousData: IdentityData = {
    id: "anonymous",
    displayName: "Anonymous",
    type: "admin",
    roles: [],
    teams: [],
    permissions: [],
    profile: {
        external: false
    },
    currentTenant: {
        id: "root",
        name: "Root"
    },
    defaultTenant: {
        id: "root",
        name: "Root"
    }
};

export class Identity {
    private constructor(
        private data: Identity.Data,
        private identityType: "anonymous" | "authenticated"
    ) {
        makeAutoObservable(this);
    }

    static createAuthenticated(data: Identity.Data) {
        return new Identity(data, "authenticated");
    }

    static createAnonymous() {
        return new Identity(anonymousData, "anonymous");
    }

    get isAuthenticated(): boolean {
        return this.identityType === "authenticated";
    }

    get id() {
        return this.data.id;
    }

    get type() {
        return this.data.type;
    }

    get displayName() {
        return this.data.displayName;
    }

    get roles() {
        return this.data.roles ?? [];
    }

    get teams() {
        return this.data.teams ?? [];
    }

    get profile() {
        return this.data.profile;
    }

    get currentTenant() {
        return this.data.currentTenant;
    }

    get defaultTenant() {
        return this.data.defaultTenant;
    }

    get tenants(): Tenant[] {
        return this.data.tenants ?? [];
    }

    /**
     * Whether the identity is a user of the root tenant: one with a user record there. Without a
     * tenant list, the default tenant decides, which identity providers that set none report as root.
     */
    get isRootUser(): boolean {
        if (this.tenants.length > 0) {
            return this.tenants.some(tenant => tenant.id === ROOT_TENANT_ID);
        }

        return this.defaultTenant?.id === ROOT_TENANT_ID;
    }

    /**
     * Whether the identity is linked to several tenants and can switch between them. Root users
     * aren't counted: whether they can switch is up to the tenant switcher, which Tenant Manager
     * extends with every tenant for root admins.
     */
    get canSwitchTenant(): boolean {
        return this.tenants.length > 1 && !this.isRootUser;
    }

    getPermission<T extends Identity.Permission = Identity.Permission>(
        name: string,
        exact?: boolean
    ): T | null {
        const perms = (this.data.permissions || []) as T[];
        const exactMatch = perms.find(p => p.name === name);
        if (exactMatch) {
            return exactMatch as T;
        } else if (exact) {
            return null;
        }

        // Try matching using patterns
        return perms.find(p => minimatch(name, p.name)) || null;
    }

    getPermissions<T extends Identity.Permission = Identity.Permission>(name?: string): Array<T> {
        const permissions = this.data.permissions || [];
        if (!name) {
            return permissions as T[];
        }

        return permissions.filter(current => {
            const exactMatch = current.name === name;
            if (exactMatch) {
                return true;
            }

            // Try matching using patterns.
            return minimatch(name, current.name);
        }) as T[];
    }

    update(updates: Partial<Pick<Identity.Data, "displayName" | "profile">>) {
        runInAction(() => {
            this.data.displayName = updates.displayName || this.data.displayName;
            this.data.profile = updates.profile || this.data.profile;
        });
    }
}

export namespace Identity {
    export type Data = IdentityData;
    export type Permission = IPermission;
    export type Profile = IProfile;
}
