import { createImplementation } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "~/features/keyValueStore/abstractions.js";
import { Lease as LeaseAbstraction } from "./abstractions.js";

// Leases live in their own scope of the global key-value store, apart from everyone's records.
const LEASE_SCOPE = "lease";

const expiresIn = (ttlMs: number): Date => {
    return new Date(Date.now() + ttlMs);
};

/**
 * A lease is a global key-value record whose value is the owner. The store's conditional writes do
 * the checking, so two owners racing for a key cannot both get it.
 */
class KeyValueLeaseImpl implements LeaseAbstraction.Interface {
    public constructor(private readonly store: GlobalKeyValueStore.Interface) {}

    public acquire(key: string, owner: string, ttlMs: number) {
        const expiresAt = expiresIn(ttlMs);
        return this.store.setIfAbsent(key, owner, { scope: LEASE_SCOPE, expiresAt });
    }

    public renew(key: string, owner: string, ttlMs: number) {
        const expiresAt = expiresIn(ttlMs);
        return this.store.replaceIf(key, owner, owner, { scope: LEASE_SCOPE, expiresAt });
    }

    public release(key: string, owner: string) {
        return this.store.deleteIf(key, owner, { scope: LEASE_SCOPE });
    }
}

export const KeyValueLease = createImplementation({
    abstraction: LeaseAbstraction,
    implementation: KeyValueLeaseImpl,
    dependencies: [GlobalKeyValueStore]
});
