import { Identity } from "./Identity.js";

/**
 * Represents an anonymous (unauthenticated) user.
 * This identity has no permissions by default.
 */
export class AnonymousIdentity extends Identity {
    readonly id = "anonymous";
    readonly displayName = "Anonymous";
    readonly type = "anonymous";

    isAnonymous(): boolean {
        return true;
    }
}
