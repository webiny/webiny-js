import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";
import { createAbstraction, createFeature } from "@webiny/feature/api";

// `promisify(scryptCb)` resolves to the no-options overload, so we wrap by hand
// to keep the cost parameters (N, r, p).
const scrypt = (
    password: string,
    salt: Buffer,
    keylen: number,
    options: ScryptOptions
): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scryptCb(password, salt, keylen, options, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(derivedKey);
            }
        });
    });

export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    /** Constant-time compare of `password` against a previously produced hash string. */
    verify(password: string, storedHash: string): Promise<boolean>;
}

/** Hashes and verifies passwords. Swap the implementation to change algorithms. */
export const PasswordHasher = createAbstraction<IPasswordHasher>("PasswordHasher");

export namespace PasswordHasher {
    export type Interface = IPasswordHasher;
}

/**
 * Default hasher, built on Node's `crypto.scrypt` — no native dependency, so it
 * runs anywhere Node runs. This mirrors what self-hosted CMSes (e.g. Payload)
 * do with PBKDF2: pick a KDF that ships with the runtime.
 *
 * To upgrade to Argon2id later, register a different `PasswordHasher`
 * implementation — the stored hash string is self-describing (its prefix names
 * the algorithm), so old scrypt hashes keep verifying while new logins get the
 * new algorithm.
 */
const PREFIX = "scrypt";
const KEYLEN = 64;
const SALT_BYTES = 16;

interface ScryptCost {
    N: number;
    r: number;
    p: number;
}

const DEFAULT_COST: ScryptCost = { N: 16384, r: 8, p: 1 };

class ScryptPasswordHasher implements IPasswordHasher {
    constructor(private cost: ScryptCost = DEFAULT_COST) {}

    async hash(password: string): Promise<string> {
        const { N, r, p } = this.cost;
        const salt = randomBytes(SALT_BYTES);
        const derived = (await scrypt(password, salt, KEYLEN, { N, r, p })) as Buffer;

        return [PREFIX, N, r, p, salt.toString("base64"), derived.toString("base64")].join("$");
    }

    async verify(password: string, storedHash: string): Promise<boolean> {
        const parts = storedHash.split("$");
        if (parts.length !== 6 || parts[0] !== PREFIX) {
            return false;
        }

        const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
        const N = Number(nRaw);
        const r = Number(rRaw);
        const p = Number(pRaw);
        const salt = Buffer.from(saltB64, "base64");
        const expected = Buffer.from(hashB64, "base64");

        const derived = (await scrypt(password, salt, expected.length, { N, r, p })) as Buffer;

        // Lengths always match here, so timingSafeEqual is safe to call directly.
        return timingSafeEqual(derived, expected);
    }
}

export const PasswordHasherFeature = createFeature({
    name: "PasswordHasher",
    register(container) {
        container.registerInstance(PasswordHasher, new ScryptPasswordHasher());
    }
});
