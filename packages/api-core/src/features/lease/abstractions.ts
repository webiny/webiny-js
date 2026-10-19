import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { KeyValueStoreRepository } from "~/features/keyValueStore/abstractions.js";

/**
 * A lease is a lock that runs out. One owner holds a key at a time, until it releases the lease or
 * stops renewing it and the lease expires. Processes use it to agree on who does a piece of work, so
 * the work runs once even when several of them could take it, and is picked up again when its owner
 * dies.
 *
 * `owner` identifies the holder; give each process its own. A lease is held by one owner exactly:
 * `acquire` fails while any live lease holds the key, the caller's own included, so extend a lease
 * with `renew`.
 *
 * Renew well inside `ttlMs`, around a third of it: a lease that expires while its owner is still
 * working lets another owner take the same work.
 */
export interface ILease {
    /** Takes the lease when no live one holds the key. Resolves to whether it was taken. */
    acquire(key: string, owner: string, ttlMs: number): Promise<Result<boolean, Lease.Error>>;
    /** Extends a live lease `owner` holds by `ttlMs` from now. False when `owner` no longer holds it. */
    renew(key: string, owner: string, ttlMs: number): Promise<Result<boolean, Lease.Error>>;
    /** Gives up a lease `owner` holds. False when `owner` did not hold it. */
    release(key: string, owner: string): Promise<Result<boolean, Lease.Error>>;
}

export const Lease = createAbstraction<ILease>("Lease");

export namespace Lease {
    export type Interface = ILease;
    export type Error = KeyValueStoreRepository.Error;
}
