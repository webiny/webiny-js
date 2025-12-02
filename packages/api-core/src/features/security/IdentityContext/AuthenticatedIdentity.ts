import { Identity } from "./Identity.js";

/**
 * Represents an authenticated user identity.
 */
export class AuthenticatedIdentity extends Identity {
    isAnonymous(): boolean {
        return false;
    }
}
