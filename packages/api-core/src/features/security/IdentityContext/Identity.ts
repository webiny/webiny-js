import type { SecurityPermission } from "~/types.js";

/**
 * Abstract base class for all identity types.
 * Provides a common interface for identity checks across the codebase.
 */
export abstract class Identity {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
    readonly groups: string[];
    readonly teams: string[];
    readonly permissions: SecurityPermission[];
    readonly data: Record<string, any> = {};

    constructor(identityData: IdentityData) {
        this.id = identityData.id;
        this.displayName = identityData.displayName;
        this.type = identityData.type;
        this.groups = identityData.groups ?? [];
        this.teams = identityData.teams ?? [];
        this.permissions = identityData.permissions ?? [];
        this.data = identityData.data ?? {};
    }

    /**
     * Check if this identity represents an anonymous (unauthenticated) user.
     */
    abstract isAnonymous(): boolean;

    /**
     * Get a specific property from custom data.
     */
    get<T = any>(key: string): T | undefined {
        return this.data[key];
    }

    toJson(): Required<IdentityData> {
        return {
            id: this.id,
            displayName: this.displayName,
            type: this.type,
            teams: this.teams,
            groups: this.groups,
            permissions: this.permissions,
            data: this.data
        };
    }
}

export type IdentityData = {
    id: string;
    displayName: string;
    type: string;
    groups?: string[];
    teams?: string[];
    permissions?: SecurityPermission[];
    data?: Record<string, any>;
};
