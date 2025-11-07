import { Identity } from "./Identity.js";

/**
 * Represents an anonymous (unauthenticated) user.
 * This identity has no permissions by default.
 */
export class AnonymousIdentity extends Identity {
    constructor() {
        super({
            id: "anonymous",
            displayName: "Anonymous",
            type: "anonymous"
        });
    }

    isAnonymous(): boolean {
        return true;
    }
}
