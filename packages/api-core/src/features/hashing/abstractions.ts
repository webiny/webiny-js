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

export interface IHashingConfig {
    /** Server-side secret folded into every hash. Empty when none is configured. */
    readonly pepper: string;
    /** scrypt cost parameter N. `null` uses the default. */
    readonly costN: number | null;
}

/**
 * Where `Hasher` gets its pepper and cost. The default reads the `HashingPepper` and `HashingCost`
 * build params (`<Infra.Crypto.Hashing>`). A hosting type can replace it, e.g. to read the pepper
 * from env at startup.
 */
export const HashingConfig = createAbstraction<IHashingConfig>("HashingConfig");

export namespace HashingConfig {
    export type Interface = IHashingConfig;
}
