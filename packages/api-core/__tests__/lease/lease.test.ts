import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { getStorageOps } from "~/testing/environment.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";
import { LeaseFeature } from "~/features/lease/feature.js";
import { Lease } from "~/features/lease/index.js";

const TTL_MS = 60_000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Lease", () => {
    let lease: Lease.Interface;

    beforeEach(() => {
        const container = new Container();
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const { keyValueStorageOperations } = apiCoreStorage.storageOperations;
        KeyValueStoreFeature.register(container, keyValueStorageOperations);
        LeaseFeature.register(container);
        lease = container.resolve(Lease);
    });

    it("lets one owner hold a key", async () => {
        const first = await lease.acquire("task:1", "process-a", TTL_MS);
        const second = await lease.acquire("task:1", "process-b", TTL_MS);

        expect(first.value).toBe(true);
        expect(second.value).toBe(false);
    });

    it("refuses a second acquire by the same owner", async () => {
        await lease.acquire("task:2", "process-a", TTL_MS);

        const again = await lease.acquire("task:2", "process-a", TTL_MS);
        expect(again.value).toBe(false);
    });

    it("lets exactly one of several racing owners win", async () => {
        const owners = ["a", "b", "c", "d", "e"];
        const attempts = owners.map(owner => lease.acquire("task:race", owner, TTL_MS));
        const results = await Promise.all(attempts);

        const winners = results.filter(result => result.value === true);
        expect(winners).toHaveLength(1);
    });

    it("renews only for its owner", async () => {
        await lease.acquire("task:3", "process-a", TTL_MS);

        const byOwner = await lease.renew("task:3", "process-a", TTL_MS);
        const byOther = await lease.renew("task:3", "process-b", TTL_MS);

        expect(byOwner.value).toBe(true);
        expect(byOther.value).toBe(false);
    });

    it("releases only for its owner, then lets another owner in", async () => {
        await lease.acquire("task:4", "process-a", TTL_MS);

        const byOther = await lease.release("task:4", "process-b");
        expect(byOther.value).toBe(false);

        const byOwner = await lease.release("task:4", "process-a");
        expect(byOwner.value).toBe(true);

        const next = await lease.acquire("task:4", "process-b", TTL_MS);
        expect(next.value).toBe(true);
    });

    /*
     * The owner died: it stopped renewing, so the lease ran out and another owner can take the work.
     * DynamoDB keeps the expiry in whole seconds, hence the wait past the next second.
     */
    it("lets another owner take a lease that expired", async () => {
        await lease.acquire("task:5", "process-a", 1);
        await wait(1100);

        const renewed = await lease.renew("task:5", "process-a", TTL_MS);
        expect(renewed.value).toBe(false);

        const takenOver = await lease.acquire("task:5", "process-b", TTL_MS);
        expect(takenOver.value).toBe(true);
    });
});
