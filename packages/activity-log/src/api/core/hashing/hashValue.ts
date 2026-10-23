import { createHash } from "node:crypto";
import { canonicalize } from "./canonicalize.js";

/**
 * 128 bits of a SHA-256 over the canonical form.
 *
 * These hashes never leave the differ. They exist so that comparing two value trees can skip
 * descending into a subtree whose contents match, and so that an item appearing under a new id
 * can be recognised as the one that disappeared. Both operate on two trees hashed fresh within a
 * single save, so there is nothing to salt against and no reason for this to be injectable: a
 * constant salt cancels out inside one comparison.
 *
 * Truncated to 128 bits, which keeps collisions out of reach. That matters more than it looks:
 * a collision makes the differ skip a subtree that did change, hiding a modification rather than
 * inventing one, and that is the more expensive direction to be wrong in.
 */
const HASH_LENGTH = 32;

export const hashValue = (value: unknown): string => {
    return createHash("sha256").update(canonicalize(value)).digest("hex").slice(0, HASH_LENGTH);
};
