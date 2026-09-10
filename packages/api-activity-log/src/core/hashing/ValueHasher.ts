import { createHash } from "node:crypto";
import { ActivityHashSalt, ActivityValueHasher } from "./abstractions.js";
import { canonicalize } from "./canonicalize.js";
import type { ActivityTarget } from "../types.js";

/**
 * 128 bits of a SHA-256 over the canonical form.
 *
 * Truncated because these are stored per changed field on every save and the record envelope is
 * already the dominant storage cost. 128 bits keeps collisions out of reach, which matters more
 * here than it looks: the differ skips descending into a subtree whose hash matches, so a
 * collision would silently hide a change rather than report a spurious one, and that is the more
 * expensive direction to be wrong in.
 */
const HASH_LENGTH = 32;

class ValueHasherImpl implements ActivityValueHasher.Interface {
    constructor(private salt: ActivityHashSalt.Interface) {}

    hash(value: unknown, target: ActivityTarget): string {
        return createHash("sha256")
            .update(this.salt.forTarget(target))
            .update(" ")
            .update(canonicalize(value))
            .digest("hex")
            .slice(0, HASH_LENGTH);
    }
}

export const ValueHasher = ActivityValueHasher.createImplementation({
    implementation: ValueHasherImpl,
    dependencies: [ActivityHashSalt]
});
