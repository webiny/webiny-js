import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { TaskRecoveries } from "~/domain/TaskRecoveries.js";
import { ProcessOwner } from "~/domain/ProcessOwner.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { KeyValueTaskRecoveries } from "~/claim/KeyValueTaskRecoveries.js";
import { RandomProcessOwner } from "~/claim/RandomProcessOwner.js";
import { createMemoryKeyValueStore } from "./helpers/createMemoryKeyValueStore.js";

const TTL_MS = 60_000;
const target = { tenant: "root", taskId: "task-1" };

/*
 * Two processes sharing one store: each gets its own owner, as two servers would.
 */
const createProcesses = () => {
    const { store } = createMemoryKeyValueStore();

    const createProcess = () => {
        const container = new Container();
        container.registerInstance(GlobalKeyValueStore, store);
        container.register(RandomProcessOwner).inSingletonScope();
        container.register(KeyValueTaskClaim);
        container.register(KeyValueTaskRecoveries);
        return {
            claim: container.resolve(TaskClaim),
            recoveries: container.resolve(TaskRecoveries),
            owner: container.resolve(ProcessOwner)
        };
    };

    return { a: createProcess(), b: createProcess() };
};

afterEach(() => {
    vi.useRealTimers();
});

describe("KeyValueTaskClaim", () => {
    it("lets one process take a task", async () => {
        const { a, b } = createProcesses();

        expect(await a.claim.take(target, TTL_MS)).toBe(true);
        expect(await b.claim.take(target, TTL_MS)).toBe(false);
    });

    it("lets exactly one of several racing processes take a task", async () => {
        const { a, b } = createProcesses();

        const results = await Promise.all([
            a.claim.take(target, TTL_MS),
            b.claim.take(target, TTL_MS),
            a.claim.take(target, TTL_MS)
        ]);

        expect(results.filter(Boolean)).toHaveLength(1);
    });

    it("keeps a claim only for its owner", async () => {
        const { a, b } = createProcesses();
        await a.claim.take(target, TTL_MS);

        expect(await a.claim.keep(target, TTL_MS)).toBe(true);
        expect(await b.claim.keep(target, TTL_MS)).toBe(false);
    });

    it("releases only its own claim", async () => {
        const { a, b } = createProcesses();
        await a.claim.take(target, TTL_MS);

        await b.claim.release(target);
        expect(await b.claim.take(target, TTL_MS)).toBe(false);

        await a.claim.release(target);
        expect(await b.claim.take(target, TTL_MS)).toBe(true);
    });

    // The owner died: it stopped extending, so the claim ran out and another process can take over.
    it("lets another process take a claim that expired", async () => {
        vi.useFakeTimers();
        const { a, b } = createProcesses();
        await a.claim.take(target, TTL_MS);

        vi.advanceTimersByTime(TTL_MS + 1);

        expect(await a.claim.keep(target, TTL_MS)).toBe(false);
        expect(await b.claim.take(target, TTL_MS)).toBe(true);
    });

    it("gives every process its own owner", () => {
        const { a, b } = createProcesses();

        expect(a.owner.id).not.toBe(b.owner.id);
    });
});

describe("KeyValueTaskRecoveries", () => {
    it("counts takeovers per task", async () => {
        const { a } = createProcesses();

        expect(await a.recoveries.record(target)).toBe(1);
        expect(await a.recoveries.record(target)).toBe(2);
        expect(await a.recoveries.record({ tenant: "root", taskId: "task-2" })).toBe(1);
        expect(await a.recoveries.record({ tenant: "acme", taskId: "task-1" })).toBe(1);
    });

    it("starts again from zero a day after the last takeover", async () => {
        vi.useFakeTimers();
        const { a } = createProcesses();
        await a.recoveries.record(target);
        await a.recoveries.record(target);

        vi.advanceTimersByTime(86_400_001);

        expect(await a.recoveries.record(target)).toBe(1);
    });
});
