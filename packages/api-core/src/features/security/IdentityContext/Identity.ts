import type { SecurityPermission } from "~/types/security.js";

export namespace Identity {
    export type Profile = IdentityProfile;
}

export interface IdentityContext {
    /**
     * Which tenant is the home tenant for this identity?
     * If omitted, it will default to `root`.
     */
    defaultTenantId?: string;
    /**
     * Can this identity access the current tenant?
     * If omitted, it will default to `true`.
     */
    canAccessTenant?: boolean;
    /**
     * Any other custom context data.
     */
    [key: string]: any;
}

/**
 * Abstract base class for all identity types.
 * Provides a common interface for identity checks across the codebase.
 */
export abstract class Identity {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
    readonly permissions: SecurityPermission[];
    readonly profile: IdentityProfile;
    readonly context: IdentityContext;

    constructor(identityData: IdentityData) {
        this.id = identityData.id;
        this.displayName = identityData.displayName;
        this.type = identityData.type;
        this.permissions = identityData.permissions ?? [];
        this.profile = new IdentityProfile(this.id, identityData.profile || {});
        this.context = identityData.context ?? {};
    }

    /**
     * Check if this identity represents an anonymous (unauthenticated) user.
     */
    abstract isAnonymous(): boolean;

    toJson(): Required<Omit<IdentityData, "context">> {
        return {
            id: this.id,
            displayName: this.displayName,
            type: this.type,
            permissions: this.permissions,
            profile: this.profile.toJson()
        };
    }
}

interface IdentityProfileData {
    groups?: string[];
    teams?: string[];
    firstName?: string;
    lastName?: string;
    email?: string;
    external?: boolean;
}

class IdentityProfile {
    constructor(
        private id: string,
        private data: Partial<IdentityProfileData>
    ) {}

    get groups(): string[] {
        return this.data.groups ?? [];
    }

    get teams(): string[] {
        return this.data.teams ?? [];
    }

    get firstName(): string {
        return this.data.firstName ?? "";
    }

    get lastName(): string {
        return this.data.lastName ?? "";
    }

    get email(): string {
        return this.data.email ?? `id:${this.id}`;
    }

    get external(): boolean {
        return this.data.external ?? false;
    }

    toJson() {
        return {
            groups: this.groups,
            teams: this.teams,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            external: this.external
        };
    }
}

interface IdentityProfileContext {
    canAccessTenant?: boolean;
    defaultTenantId?: string;
    [key: string]: any;
}

export type IdentityData = {
    id: string;
    displayName: string;
    type: string;
    permissions?: SecurityPermission[];
    profile?: IdentityProfileData;
    context?: IdentityProfileContext;
};
