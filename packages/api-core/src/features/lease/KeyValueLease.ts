import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "~/features/keyValueStore/abstractions.js";
import { KeyValueConditionFailedError } from "~/features/keyValueStore/errors.js";
import { Lease as LeaseAbstraction } from "./abstractions.js";

// Leases live in their own scope of the global key-value store, apart from everyone's records.
const LEASE_SCOPE = "lease";

const expiresIn = (ttlMs: number): Date => {
    return new Date(Date.now() + ttlMs);
};

/*
 * A write whose condition does not hold means the lease is held by someone else, or no longer by
 * this owner. That is an answer, not a failure, so it becomes `false`.
 */
const toHeld = (
    result: Result<void, GlobalKeyValueStore.Error>
): Result<boolean, LeaseAbstraction.Error> => {
    if (result.isOk()) {
        return Result.ok(true);
    }
    if (result.error instanceof KeyValueConditionFailedError) {
        return Result.ok(false);
    }
    return Result.fail(result.error);
};

/**
 * A lease is a global key-value record whose value is the owner. The store's conditional writes do
 * the checking, so two owners racing for a key cannot both get it.
 */
class KeyValueLeaseImpl implements LeaseAbstraction.Interface {
    public constructor(private readonly store: GlobalKeyValueStore.Interface) {}

    public async acquire(key: string, owner: string, ttlMs: number) {
        const expiresAt = expiresIn(ttlMs);
        const result = await this.store.set(key, owner, {
            scope: LEASE_SCOPE,
            expiresAt,
            ifNotExists: true
        });
        return toHeld(result);
    }

    public async renew(key: string, owner: string, ttlMs: number) {
        const expiresAt = expiresIn(ttlMs);
        const result = await this.store.set(key, owner, {
            scope: LEASE_SCOPE,
            expiresAt,
            ifValue: owner
        });
        return toHeld(result);
    }

    public async release(key: string, owner: string) {
        const result = await this.store.delete(key, { scope: LEASE_SCOPE, ifValue: owner });
        return toHeld(result);
    }
}

export const KeyValueLease = createImplementation({
    abstraction: LeaseAbstraction,
    implementation: KeyValueLeaseImpl,
    dependencies: [GlobalKeyValueStore]
});
