import { createAbstraction } from "@webiny/feature/api";

export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    /** Constant-time compare of `password` against a previously produced hash string. */
    verify(password: string, storedHash: string): Promise<boolean>;
}

/**
 * Hashes and verifies passwords. Swap the implementation (register a different `PasswordHasher`)
 * to change algorithms — e.g. Argon2id. Stored hashes are self-describing, so old hashes keep
 * verifying after a swap.
 */
export const PasswordHasher = createAbstraction<IPasswordHasher>("PasswordHasher");

export namespace PasswordHasher {
    export type Interface = IPasswordHasher;
}
