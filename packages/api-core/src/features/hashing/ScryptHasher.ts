import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";
import { createImplementation } from "@webiny/feature/api";
import { Hasher as HasherAbstraction } from "./abstractions.js";
import type { IHasher } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";

// `promisify(scryptCb)` resolves to the no-options overload, so we wrap by hand
// to keep the cost parameters (N, r, p).
const scrypt = (
    value: string,
    salt: Buffer,
    keylen: number,
    options: ScryptOptions
): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scryptCb(value, salt, keylen, options, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(derivedKey);
            }
        });
    });

/**
 * Default hasher, built on Node's `crypto.scrypt` — no native dependency, so it runs anywhere Node
 * runs.
 *
 * Configuration (from `webiny.config.tsx` via `<Infra.Hashing>` → BuildParams):
 *  - `HashingPepper` — an optional server-side secret folded into every hash. Unlike the per-value
 *    salt (stored alongside the hash), the pepper is NOT stored, so a stolen database alone cannot
 *    be brute-forced without also holding the pepper. Changing it invalidates existing hashes (same
 *    trade-off as rotating the encryption passphrase). Omitted → no pepper, salt only.
 *  - `HashingCost` — optional override of the scrypt cost parameter N. Defaults to 16384.
 *
 * The stored value is self-describing (`scrypt$N$r$p$salt$hash`), so switching to Argon2id later is
 * a matter of registering a different `Hasher` — old scrypt hashes keep verifying.
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

export class ScryptHasher implements IHasher {
    private readonly cost: ScryptCost;
    private readonly pepper: string;

    constructor(buildParams: BuildParams.Interface) {
        this.pepper = buildParams.get<string>("HashingPepper") ?? "";
        const costN = buildParams.get<number | string>("HashingCost");
        this.cost = costN ? { ...DEFAULT_COST, N: Number(costN) } : DEFAULT_COST;
    }

    async hash(value: string): Promise<string> {
        const { N, r, p } = this.cost;
        const salt = randomBytes(SALT_BYTES);
        const derived = (await scrypt(this.withPepper(value), salt, KEYLEN, { N, r, p })) as Buffer;

        return [PREFIX, N, r, p, salt.toString("base64"), derived.toString("base64")].join("$");
    }

    async verify(value: string, storedHash: string): Promise<boolean> {
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

        const derived = (await scrypt(this.withPepper(value), salt, expected.length, {
            N,
            r,
            p
        })) as Buffer;

        // Lengths always match here, so timingSafeEqual is safe to call directly.
        return timingSafeEqual(derived, expected);
    }

    private withPepper(value: string): string {
        return this.pepper ? `${value}${this.pepper}` : value;
    }
}

export const Hasher = createImplementation({
    abstraction: HasherAbstraction,
    implementation: ScryptHasher,
    dependencies: [BuildParams]
});
