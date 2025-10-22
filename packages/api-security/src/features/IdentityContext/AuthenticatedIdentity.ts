import { Identity } from "./Identity.js";

export interface AuthenticatedIdentityData {
    id: string;
    displayName: string;
    type: string;
    [key: string]: any;
}

/**
 * Represents an authenticated user identity.
 */
export class AuthenticatedIdentity extends Identity {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
    private data: AuthenticatedIdentityData;

    constructor(data: AuthenticatedIdentityData) {
        super();
        this.id = data.id;
        this.displayName = data.displayName;
        this.type = data.type;
        this.data = data;
    }

    isAnonymous(): boolean {
        return false;
    }

    /**
     * Get additional identity data.
     */
    getData(): AuthenticatedIdentityData {
        return this.data;
    }

    /**
     * Get a specific property from identity data.
     */
    get<T = any>(key: string): T | undefined {
        return this.data[key];
    }
}
