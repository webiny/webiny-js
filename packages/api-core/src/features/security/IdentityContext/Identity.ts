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

interface IdentityProfileContext {
    canAccessTenant?: boolean;
    defaultTenantId?: string;
    [key: string]: any;
}

export type IdentityData = {
    id: string;
    displayName: string;
    type: string;
    roles?: string[];
    teams?: string[];
    permissions?: SecurityPermission[];
    profile?: IdentityProfileData;
    context?: IdentityProfileContext;
};

/**
 * Abstract base class for all identity types.
 * Provides a common interface for identity checks across the codebase.
 */
export abstract class Identity {
    private readonly data: IdentityData;
    public readonly profile: IdentityProfile;
    public readonly context: IdentityContext;

    constructor(identityData: IdentityData) {
        this.data = identityData;
        this.profile = new IdentityProfile(this.id, identityData.profile || {});
        this.context = identityData.context ?? {};
    }

    get id() {
        return this.data.id;
    }

    get displayName() {
        return this.data.displayName;
    }
    get type() {
        return this.data.type;
    }

    get permissions(): SecurityPermission[] {
        return this.data.permissions ?? [];
    }

    get roles(): string[] {
        return this.data.roles ?? [];
    }

    get teams(): string[] {
        return this.data.teams ?? [];
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
            roles: this.roles,
            teams: this.teams,
            permissions: this.permissions,
            profile: this.profile.toJson()
        };
    }
}

interface IdentityProfileData {
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
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            external: this.external
        };
    }
}
