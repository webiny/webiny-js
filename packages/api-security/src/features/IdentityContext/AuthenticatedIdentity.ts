import { Identity, type IdentityData } from "./Identity.js";

/**
 * Represents an authenticated user identity.
 */
export class AuthenticatedIdentity extends Identity {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
    private data: IdentityData;

    constructor(data: IdentityData) {
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
    getData(): IdentityData {
        return this.data;
    }

    /**
     * Get a specific property from identity data.
     */
    get<T = any>(key: string): T | undefined {
        return this.data[key];
    }
}
