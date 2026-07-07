import { createAbstraction } from "@webiny/feature/api";

export interface IHasher {
    hash(value: string): Promise<string>;
    /** Constant-time compare of `value` against a previously produced hash string. */
    verify(value: string, storedHash: string): Promise<boolean>;
}

/**
 * Hashes and verifies secret values (passwords, API-key secrets, tokens, …) with a slow, salted
 * KDF — built for the "store a hash, later verify a presented value" pattern.
 *
 * NOT a general-purpose digest: output is salted and non-deterministic, so this is the wrong tool
 * for checksums / cache keys / dedup (use a fast deterministic digest util for those). Swap the
 * implementation to change algorithms (e.g. Argon2id); stored hashes are self-describing, so old
 * hashes keep verifying after a swap.
 */
export const Hasher = createAbstraction<IHasher>("Hasher");

export namespace Hasher {
    export type Interface = IHasher;
}
