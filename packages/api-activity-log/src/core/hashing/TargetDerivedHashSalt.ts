import { ActivityHashSalt } from "./abstractions.js";
import type { ActivityTarget } from "../types.js";

/**
 * Derives the salt from the target's own identity.
 *
 * This defeats cross-target correlation, which is what it is for. It does NOT defeat brute force:
 * the salt is derivable by anyone who can read the log, so a field with few possible values (a
 * boolean, a status enum, a short date range) can be recovered by hashing the candidates. Fields
 * with real entropy are safe.
 *
 * Replacing this implementation with one backed by a per-installation secret closes that hole, at
 * the cost of making hashes unverifiable outside the installation. Left as a decision rather than
 * taken silently.
 */
class TargetDerivedHashSaltImpl implements ActivityHashSalt.Interface {
    forTarget(target: ActivityTarget): string {
        return `${target.type}:${target.id}`;
    }
}

export const TargetDerivedHashSalt = ActivityHashSalt.createImplementation({
    implementation: TargetDerivedHashSaltImpl,
    dependencies: []
});
